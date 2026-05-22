import { useQuery } from "@tanstack/react-query"
import { qk } from "./keys"

/**
 * Forma canônica de um pagamento — usada por TODAS as telas.
 * Toda página que lê pagamentos DEVE usar `usePagamentos` (nunca declare
 * outra useQuery com key `["pagamentos", ...]`, ou o cache colide).
 */
export interface PagamentoRow {
  id: string
  obraId: string
  profissionalId: string
  valor: number
  data: string
  formaPagamento: string | null
  observacao: string | null
  comprovanteUrl: string | null
  criadaEm: string | null
}

export function usePagamentos(
  obraId: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: qk.pagamentos(obraId, userId),
    enabled: !!obraId && !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<PagamentoRow[]> => {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase
        .from("pagamentos")
        .select(
          "id, obra_id, profissional_id, valor, data, forma_pagamento, observacao, comprovante_url, criada_em",
        )
        .eq("obra_id", obraId!)
        .eq("user_id", userId!)
        .order("data", { ascending: false })
      if (error) throw error
      return (data || []).map(
        (p: any): PagamentoRow => ({
          id: p.id,
          obraId: p.obra_id,
          profissionalId: p.profissional_id,
          valor: parseFloat(p.valor) || 0,
          data: p.data || "",
          formaPagamento: p.forma_pagamento ?? null,
          observacao: p.observacao ?? null,
          comprovanteUrl: p.comprovante_url ?? null,
          criadaEm: p.criada_em ?? null,
        }),
      )
    },
  })
}
