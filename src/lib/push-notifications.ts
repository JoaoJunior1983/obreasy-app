/**
 * Sistema de alertas de marcos de orçamento
 *
 * Funciona em TODOS os dispositivos (iOS Safari, Android Chrome, desktop)
 * sem precisar de permissão de notificação.
 *
 * Ao cruzar um marco (25/50/75/100%), dispara um evento DOM que é
 * capturado pelo <BudgetMilestoneToast /> na página.
 */

const STORAGE_KEY = 'percentual_milestones_v1'

export interface MilestoneNotificationData {
  emoji: string
  title: string
  body: string
}

function dispatch(data: MilestoneNotificationData): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('budget-milestone', { detail: data }))
}

export function checkAndShowPercentualNotifications(params: {
  // Para profissional
  profissionalId?: string
  profissionalNome?: string
  valorPrevisto?: number
  valorPagamento?: number
  totalPagoProfAntes?: number
  // Para obra
  obraId: string
  obraOrcamento?: number
  totalGastoObraAntes?: number
  novoGastoObra: number
}): void {
  const {
    profissionalId,
    profissionalNome,
    valorPrevisto = 0,
    valorPagamento = 0,
    totalPagoProfAntes = 0,
    obraId,
    obraOrcamento = 0,
    totalGastoObraAntes = 0,
    novoGastoObra
  } = params

  if (typeof window === 'undefined') return

  const shown: Record<string, boolean> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  let changed = false

  // Checar marcos do profissional
  if (profissionalId && valorPrevisto > 0) {
    const antes = (totalPagoProfAntes / valorPrevisto) * 100
    const apos = ((totalPagoProfAntes + valorPagamento) / valorPrevisto) * 100

    for (const t of [100, 75, 50, 25]) {
      const key = `prof_${profissionalId}_${t}`
      if (apos >= t && antes < t && !shown[key]) {
        shown[key] = true
        changed = true

        const emoji = t >= 100 ? '🔴' : t >= 75 ? '🟠' : '🟡'
        dispatch({
          emoji,
          title: `${t}% do valor do profissional`,
          body: `Você atingiu ${t}% do valor previsto de ${profissionalNome || 'profissional'}.`
        })
        break
      }
    }
  }

  // Checar marcos do orçamento da obra
  if (obraOrcamento > 0) {
    const antes = (totalGastoObraAntes / obraOrcamento) * 100
    const apos = ((totalGastoObraAntes + novoGastoObra) / obraOrcamento) * 100

    for (const t of [100, 75, 50, 25]) {
      const key = `obra_${obraId}_${t}`
      if (apos >= t && antes < t && !shown[key]) {
        shown[key] = true
        changed = true

        const emoji = t >= 100 ? '🔴' : t >= 75 ? '🟠' : '🟡'
        dispatch({
          emoji,
          title: `${t}% do orçamento da obra`,
          body: `O total gasto da obra atingiu ${t}% do orçamento planejado.`
        })
        break
      }
    }
  }

  if (changed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shown))
  }
}
