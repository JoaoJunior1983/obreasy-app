/**
 * Utilitários para cálculo de orçamentos e gastos - CORRIGIDO
 *
 * Sistema baseado em orçamento TOTAL único (sem separação material/mão de obra)
 */

import { checkMaterialBudgetAlert, checkProfissionalBudgetAlert, type BudgetAlert } from './budget-alerts'

export interface Despesa {
  id: string
  obraId: string
  valor: number
  categoria?: string
  category?: string
  profissionalId?: string
}

export interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
  valorPrevisto?: number
  contrato?: {
    valorPrevisto?: number
    valorTotalPrevisto?: number
  }
}

export interface Obra {
  id: string
  orcamento: number | null
}

/**
 * Calcula gasto total com mão de obra
 */
export function calcularGastoMaoObra(despesas: Despesa[]): number {
  return despesas
    .filter(d => {
      const categoria = d.categoria || d.category
      return categoria === 'mao_obra' || d.profissionalId
    })
    .reduce((total, d) => total + d.valor, 0)
}

/**
 * Calcula gasto com materiais
 */
export function calcularGastoMateriais(despesas: Despesa[]): number {
  return despesas
    .filter(d => {
      const categoria = d.categoria || d.category
      return (categoria === 'material' || categoria === 'outros') && !d.profissionalId
    })
    .reduce((total, d) => total + d.valor, 0)
}

/**
 * Calcula total gasto
 */
export function calcularTotalGasto(despesas: Despesa[]): number {
  return despesas.reduce((total, d) => total + d.valor, 0)
}

/**
 * Verifica alertas ao lançar DESPESA DE MATERIAL
 * Retorna alerta se necessário, null caso contrário
 */
export function checkBudgetAfterMaterialExpense(
  obraId: string,
  valorMaterial: number,
  despesasExistentes: Despesa[],
  orcamentoTotal: number
): BudgetAlert | null {
  return checkMaterialBudgetAlert(
    obraId,
    valorMaterial,
    despesasExistentes,
    orcamentoTotal
  )
}

/**
 * Verifica alertas ao lançar PAGAMENTO A PROFISSIONAL
 * Verifica EXCLUSIVAMENTE o valor negociado do profissional
 * NÃO considera orçamento total da obra
 */
export function checkBudgetAfterProfissionalPayment(
  obraId: string,
  profissionalId: string,
  profissionalNome: string,
  valorNegociado: number,
  valorPagamento: number,
  pagamentosExistentes: Despesa[]
): BudgetAlert | null {
  return checkProfissionalBudgetAlert(
    obraId,
    profissionalId,
    profissionalNome,
    valorNegociado,
    valorPagamento,
    pagamentosExistentes
  )
}

/**
 * Função genérica para verificar orçamento após qualquer transação
 * DEPRECATED: Use checkBudgetAfterMaterialExpense ou checkBudgetAfterProfissionalPayment
 */
export function checkBudgetAfterTransaction(
  obraId: string,
  novaDespesa: Despesa,
  despesasExistentes: Despesa[],
  profissionais: Profissional[],
  orcamentoTotal: number
): BudgetAlert | null {
  // Verificar se é material ou pagamento a profissional
  const categoria = novaDespesa.categoria || novaDespesa.category

  if (novaDespesa.profissionalId) {
    // É pagamento a profissional
    const profissional = profissionais.find(p => p.id === novaDespesa.profissionalId)
    if (!profissional) return null

    const valorNegociado = profissional.valorPrevisto ||
                           profissional.contrato?.valorPrevisto ||
                           profissional.contrato?.valorTotalPrevisto ||
                           0

    return checkBudgetAfterProfissionalPayment(
      obraId,
      novaDespesa.profissionalId,
      profissional.nome,
      valorNegociado,
      novaDespesa.valor,
      despesasExistentes
    )
  } else {
    // É despesa de material - verifica orçamento total
    if (!orcamentoTotal || orcamentoTotal <= 0) return null

    return checkBudgetAfterMaterialExpense(
      obraId,
      novaDespesa.valor,
      despesasExistentes,
      orcamentoTotal
    )
  }
}
