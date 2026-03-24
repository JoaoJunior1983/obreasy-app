/**
 * GERENCIADOR CENTRAL DE AVISOS - SISTEMA UNIFICADO
 *
 * Integra os dois sistemas de avisos:
 * 1. Avisos automáticos de orçamento (50%, 100%, excedido) - budget-alerts.ts
 * 2. Avisos configuráveis pelo usuário - alerts.ts
 *
 * Este gerenciador garante que os avisos sejam recalculados sempre que houver:
 * - Nova despesa
 * - Novo pagamento
 * - Edição de despesa/pagamento
 * - Exclusão de despesa/pagamento
 */

import { verificarAlertasOrcamento, verificarAlertasPrazo, verificarAlertasPagamento } from './alerts'

/**
 * Recalcula e dispara TODOS os avisos de uma obra
 * Deve ser chamado após qualquer operação financeira
 */
export function recalcularAvisos(obraId: string): void {
  if (typeof window === 'undefined') return

  try {
    // Carregar dados da obra
    const obras = JSON.parse(localStorage.getItem('obras') || '[]')
    const obra = obras.find((o: any) => o.id === obraId)

    if (!obra) {
      console.warn('[AlertManager] Obra não encontrada:', obraId)
      return
    }

    // Calcular total gasto atual
    const despesas = JSON.parse(localStorage.getItem('despesas') || '[]')
    const despesasObra = despesas.filter((d: any) => d.obraId === obraId)
    const totalGasto = despesasObra.reduce((acc: number, d: any) => acc + (d.valor || 0), 0)

    const orcamento = obra.orcamento || 0

    // 1. Verificar alertas de orçamento configuráveis
    verificarAlertasOrcamento(obraId, orcamento, totalGasto)

    // 2. Verificar alertas de prazo
    verificarAlertasPrazo(obraId)

    // 3. Verificar alertas de pagamento
    verificarAlertasPagamento(obraId)

    console.log('[AlertManager] Avisos recalculados:', {
      obraId,
      orcamento,
      totalGasto,
      percentualGasto: orcamento > 0 ? (totalGasto / orcamento * 100).toFixed(1) + '%' : 'N/A'
    })
  } catch (error) {
    console.error('[AlertManager] Erro ao recalcular avisos:', error)
  }
}

/**
 * Deve ser chamado após criar uma nova despesa
 */
export function avisoAposCriarDespesa(obraId: string): void {
  recalcularAvisos(obraId)
}

/**
 * Deve ser chamado após criar um novo pagamento
 */
export function avisoAposCriarPagamento(obraId: string): void {
  recalcularAvisos(obraId)
}

/**
 * Deve ser chamado após editar uma despesa
 */
export function avisoAposEditarDespesa(obraId: string): void {
  recalcularAvisos(obraId)
}

/**
 * Deve ser chamado após editar um pagamento
 */
export function avisoAposEditarPagamento(obraId: string): void {
  recalcularAvisos(obraId)
}

/**
 * Deve ser chamado após excluir uma despesa
 */
export function avisoAposExcluirDespesa(obraId: string): void {
  recalcularAvisos(obraId)
}

/**
 * Deve ser chamado após excluir um pagamento
 */
export function avisoAposExcluirPagamento(obraId: string): void {
  recalcularAvisos(obraId)
}

/**
 * Inicializa o sistema de avisos ao carregar uma obra
 * Deve ser chamado no useEffect do dashboard
 */
export function inicializarAvisos(obraId: string): void {
  recalcularAvisos(obraId)
}

/**
 * Hook para verificar avisos periodicamente (opcional)
 * Retorna função de cleanup
 */
export function iniciarVerificacaoPeriodica(obraId: string, intervaloMinutos: number = 5): () => void {
  const intervalo = setInterval(() => {
    recalcularAvisos(obraId)
  }, intervaloMinutos * 60 * 1000)

  // Verificar imediatamente
  recalcularAvisos(obraId)

  // Retornar função de cleanup
  return () => clearInterval(intervalo)
}
