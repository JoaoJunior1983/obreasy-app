import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { QUERY_NAMESPACES } from "./keys"

/**
 * Hook utilitário para invalidar todas as queries vinculadas a uma obra
 * (pagamentos, despesas, profissionais, recebimentos, clientes, e a obra
 * em si). Toda tela de mutação (criar/editar/excluir pagamento ou despesa)
 * DEVE chamar `await invalidate()` após o save bem-sucedido — sem isso, as
 * telas de leitura servem dado velho até o staleTime expirar.
 */
export function useInvalidateObra() {
  const qc = useQueryClient()
  const targets = new Set<string>(QUERY_NAMESPACES)
  return useCallback(async () => {
    await qc.invalidateQueries({
      predicate: (q) => targets.has(q.queryKey[0] as string),
    })
  }, [qc])
}
