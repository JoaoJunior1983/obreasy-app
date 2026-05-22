import { useQuery } from "@tanstack/react-query"
import { qk } from "./keys"

/**
 * Forma canônica do profissional. camelCase.
 * `contrato` é JSONB livre (cabeçalho do contrato, anexo, etc.).
 */
export interface ProfissionalRow {
  id: string
  obraId: string
  userId: string
  nome: string
  funcao: string
  telefone: string | null
  email: string | null
  cpf: string | null
  observacoes: string | null
  valorPrevisto: number
  contrato: any | null
  criadaEm: string | null
}

export function useProfissionais(
  obraId: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: qk.profissionais(obraId, userId),
    enabled: !!obraId && !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<ProfissionalRow[]> => {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase
        .from("profissionais")
        .select("*")
        .eq("obra_id", obraId!)
        .eq("user_id", userId!)
        .order("criada_em", { ascending: false })
      if (error) throw error
      return (data || []).map(
        (p: any): ProfissionalRow => ({
          id: p.id,
          obraId: p.obra_id,
          userId: p.user_id,
          nome: p.nome,
          funcao: p.funcao,
          telefone: p.telefone ?? null,
          email: p.email ?? null,
          cpf: p.cpf ?? null,
          observacoes: p.observacoes ?? null,
          valorPrevisto: p.valor_previsto != null ? Number(p.valor_previsto) : 0,
          contrato: p.contrato ?? null,
          criadaEm: p.criada_em ?? null,
        }),
      )
    },
  })
}
