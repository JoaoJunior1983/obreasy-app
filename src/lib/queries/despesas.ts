import { useQuery } from "@tanstack/react-query"
import { qk } from "./keys"

/**
 * Forma canônica de uma despesa. camelCase.
 */
export interface DespesaRow {
  id: string
  obraId: string
  userId: string
  data: string
  categoria: string
  descricao: string
  valor: number
  formaPagamento: string | null
  fornecedor: string | null
  profissionalId: string | null
  observacao: string | null
  anexo: string | null
  criadaEm: string | null
}

export function useDespesas(
  obraId: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: qk.despesas(obraId, userId),
    enabled: !!obraId && !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<DespesaRow[]> => {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .eq("obra_id", obraId!)
        .eq("user_id", userId!)
        .order("data", { ascending: false })
      if (error) throw error
      return (data || []).map(
        (d: any): DespesaRow => ({
          id: d.id,
          obraId: d.obra_id,
          userId: d.user_id,
          data: d.data || "",
          categoria: d.categoria,
          descricao: d.descricao,
          valor: parseFloat(d.valor) || 0,
          formaPagamento: d.forma_pagamento ?? null,
          fornecedor: d.fornecedor ?? null,
          profissionalId: d.profissional_id ?? null,
          observacao: d.observacao ?? null,
          anexo: d.anexo ?? null,
          criadaEm: d.criada_em ?? null,
        }),
      )
    },
  })
}
