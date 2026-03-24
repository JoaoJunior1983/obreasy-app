/**
 * Sistema de Avisos Inteligentes de Orçamento
 *
 * REGRAS:
 *
 * 1. ORÇAMENTO DA OBRA:
 *    - Material e mão de obra compartilham o mesmo orçamento total
 *    - Avisos nos marcos configurados (padrão: 30%, 50%, 70%, 100%) ou se ultrapassar
 *
 * 2. PROFISSIONAIS (MÃO DE OBRA):
 *    - Cada profissional possui valor combinado/contratado INDIVIDUAL
 *    - Percentual = (total pago ao profissional + novo pagamento) / valor combinado
 *    - Avisos nos marcos configurados (padrão: 50%, 75%, 100%) ou se ultrapassar
 *    - Ao ultrapassar 100%, sugere revisão do contrato
 *
 * 3. COMPORTAMENTO:
 *    - Avisos são informativos e aparecem ANTES do lançamento
 *    - Botão único: "Efetivar lançamento e estou ciente"
 *    - Ao confirmar, o lançamento é salvo normalmente
 */

import { loadAlertConfig } from './alert-config'

export type AlertLevel = '30%' | '50%' | '70%' | '75%' | '100%' | 'excedido'
export type AlertType = 'orcamento_total' | 'profissional'

export interface BudgetAlert {
  id: string
  obraId: string
  type: AlertType
  level: AlertLevel
  percentage: number
  message: string
  detalhes: {
    tipo: 'material' | 'profissional'
    valorLancamento: number
    totalGastoApos: number
    orcamentoTotal?: number
    saldoDisponivel?: number
    profissionalNome?: string
    valorNegociado?: number
    totalPagoAoProfissional?: number
  }
  lastShownAt: string
  dismissed: boolean
}

const ALERT_STORAGE_KEY = 'budget_alerts_v2'

function generateAlertId(obraId: string, type: AlertType, level: AlertLevel, profissionalId?: string): string {
  if (profissionalId) {
    return `${obraId}_prof_${profissionalId}_${level}`
  }
  return `${obraId}_${type}_${level}`
}

function loadAlerts(): BudgetAlert[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(ALERT_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveAlerts(alerts: BudgetAlert[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alerts))
}

export function markAlertAsShown(alertId: string): void {
  const alerts = loadAlerts()
  const alert = alerts.find(a => a.id === alertId)
  if (alert) {
    alert.lastShownAt = new Date().toISOString()
    alert.dismissed = true
    saveAlerts(alerts)
  }
}

export function dismissAlert(alertId: string): void {
  const alerts = loadAlerts()
  const alert = alerts.find(a => a.id === alertId)
  if (alert) {
    alert.dismissed = true
    saveAlerts(alerts)
  }
}

/**
 * Verifica alertas gerais no dashboard (mantido para compatibilidade)
 */
export function checkBudgetAlerts(
  obraId: string,
  orcamentoTotal: number,
  totalGasto: number,
  orcamentoMateriais: number,
  gastoMateriais: number,
  orcamentoMaoObra: number,
  gastoMaoObra: number
): BudgetAlert | null {
  return null
}

/**
 * Determina o nível do alerta a partir de uma lista de marcos configurados.
 * Retorna o marco mais alto que foi atingido pela primeira vez com este lançamento.
 */
function resolveThresholdLevel(
  percentualAntes: number,
  percentualApos: number,
  thresholds: number[],
  isExceeded: boolean
): number | null {
  if (isExceeded) return null // tratado separadamente

  const sorted = [...thresholds].sort((a, b) => b - a) // maior primeiro
  for (const t of sorted) {
    if (percentualApos >= t && percentualAntes < t) {
      return t
    }
  }
  return null
}

function thresholdToLevel(t: number): AlertLevel {
  const map: Record<number, AlertLevel> = {
    30: '30%',
    50: '50%',
    70: '70%',
    75: '75%',
    100: '100%'
  }
  return map[t] ?? (`${t}%` as AlertLevel)
}

/**
 * Verifica alerta ao lançar DESPESA DE MATERIAL
 * Avalia impacto no orçamento TOTAL da obra
 */
export function checkMaterialBudgetAlert(
  obraId: string,
  valorMaterial: number,
  despesasExistentes: any[],
  orcamentoTotal: number
): BudgetAlert | null {
  if (!orcamentoTotal || orcamentoTotal <= 0) return null

  const config = loadAlertConfig()
  if (!config.enabled || !config.obra.enabled) return null

  const totalGastoAtual = despesasExistentes
    .filter(d => d.obraId === obraId)
    .reduce((sum, d) => sum + d.valor, 0)

  const totalGastoApos = totalGastoAtual + valorMaterial
  const percentualAntes = (totalGastoAtual / orcamentoTotal) * 100
  const percentualApos = (totalGastoApos / orcamentoTotal) * 100
  const saldoDisponivel = orcamentoTotal - totalGastoApos

  let level: AlertLevel | null = null
  let message = ''

  if (totalGastoApos > orcamentoTotal) {
    level = 'excedido'
    const excedente = totalGastoApos - orcamentoTotal
    message = `⚠️ Orçamento ultrapassado!\n\nEste lançamento de material fará sua obra exceder o orçamento total em R$ ${excedente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
  } else {
    const hitThreshold = resolveThresholdLevel(percentualAntes, percentualApos, config.obra.thresholds, false)
    if (hitThreshold !== null) {
      level = thresholdToLevel(hitThreshold)
      if (hitThreshold >= 100) {
        message = `⚠️ Orçamento atingido!\n\nCom este lançamento de material, sua obra atingirá 100% do orçamento planejado.`
      } else {
        message = `⚠️ ${hitThreshold}% do orçamento atingido!\n\nCom este lançamento de material, sua obra atingirá ${hitThreshold}% do orçamento total.`
      }
    }
  }

  if (!level) return null

  const alertId = generateAlertId(obraId, 'orcamento_total', level)

  return {
    id: alertId,
    obraId,
    type: 'orcamento_total',
    level,
    percentage: Math.round(percentualApos),
    message,
    detalhes: {
      tipo: 'material',
      valorLancamento: valorMaterial,
      totalGastoApos,
      orcamentoTotal,
      saldoDisponivel
    },
    lastShownAt: new Date().toISOString(),
    dismissed: false
  }
}

/**
 * Verifica alerta ao lançar PAGAMENTO A PROFISSIONAL
 * Avalia EXCLUSIVAMENTE o valor negociado com o profissional
 */
export function checkProfissionalBudgetAlert(
  obraId: string,
  profissionalId: string,
  profissionalNome: string,
  valorNegociado: number,
  valorPagamento: number,
  pagamentosExistentes: any[]
): BudgetAlert | null {
  if (!valorNegociado || valorNegociado <= 0) return null

  const config = loadAlertConfig()
  if (!config.enabled || !config.profissional.enabled) return null

  const totalPagoAtual = pagamentosExistentes
    .filter(p => p.profissionalId === profissionalId)
    .reduce((sum, p) => sum + p.valor, 0)

  const totalPagoApos = totalPagoAtual + valorPagamento
  const percentualAntes = (totalPagoAtual / valorNegociado) * 100
  const percentualApos = (totalPagoApos / valorNegociado) * 100

  let level: AlertLevel | null = null
  let message = ''

  if (totalPagoApos > valorNegociado) {
    level = 'excedido'
    const excedente = totalPagoApos - valorNegociado
    message = `⚠️ Valor combinado ultrapassado!\n\nEste pagamento ao profissional ${profissionalNome} excederá o valor combinado em R$ ${excedente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.\n\nConsidere revisar o contrato com o profissional.`
  } else {
    const hitThreshold = resolveThresholdLevel(percentualAntes, percentualApos, config.profissional.thresholds, false)
    if (hitThreshold !== null) {
      level = thresholdToLevel(hitThreshold)
      if (hitThreshold >= 100) {
        message = `⚠️ Valor combinado atingido!\n\nCom este pagamento, você atingirá 100% do valor combinado com ${profissionalNome}.`
      } else {
        message = `⚠️ ${hitThreshold}% do valor combinado atingido!\n\nCom este pagamento, você atingirá ${hitThreshold}% do valor combinado com ${profissionalNome}.`
      }
    }
  }

  if (!level) return null

  const alertId = generateAlertId(obraId, 'profissional', level, profissionalId)

  return {
    id: alertId,
    obraId,
    type: 'profissional',
    level,
    percentage: Math.round(percentualApos),
    message,
    detalhes: {
      tipo: 'profissional',
      valorLancamento: valorPagamento,
      totalGastoApos: totalPagoApos,
      profissionalNome,
      valorNegociado,
      totalPagoAoProfissional: totalPagoApos
    },
    lastShownAt: new Date().toISOString(),
    dismissed: false
  }
}

export function getAlertActionRoute(alert: BudgetAlert): string {
  return '/dashboard/obra'
}
