import { useQuery } from "@tanstack/react-query"
import { qk } from "./keys"

/**
 * Forma canônica da obra. Sempre camelCase.
 */
export interface ObraRow {
  id: string
  userId: string
  nome: string
  nomeCliente: string | null
  tipo: string
  area: number
  localizacao: { cidade?: string | null; estado?: string | null } | null
  orcamento: number | null
  valorContratado: number | null
  dataInicio: string | null
  dataTermino: string | null
  criadaEm: string | null
  status: "em_andamento" | "concluida"
  concluidaEm: string | null
}

export function useObra(
  obraId: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: qk.obra(obraId, userId),
    enabled: !!obraId && !!userId,
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<ObraRow> => {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .eq("id", obraId!)
        .eq("user_id", userId!)
        .single()
      if (error || !data) throw new Error("obra not found")
      const o = data as any
      return {
        id: o.id,
        userId: o.user_id,
        nome: o.nome,
        nomeCliente: o.nome_cliente ?? null,
        tipo: o.tipo,
        area: Number(o.area) || 0,
        localizacao: o.localizacao ?? null,
        orcamento: o.orcamento != null ? Number(o.orcamento) : null,
        valorContratado: o.valor_contratado != null ? Number(o.valor_contratado) : null,
        dataInicio: o.data_inicio ?? null,
        dataTermino: o.data_termino ?? null,
        criadaEm: o.criada_em ?? null,
        status: o.status === "concluida" ? "concluida" : "em_andamento",
        concluidaEm: o.concluida_em ?? null,
      }
    },
  })
}
