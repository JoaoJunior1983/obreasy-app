/**
 * Fábrica central de queryKeys do React Query.
 *
 * Toda página que precisa de dados da obra DEVE usar estas chaves via
 * os hooks canônicos (src/lib/queries/*). Nunca declare uma queryKey
 * com formato diferente para a mesma entidade — isso causa colisão de
 * cache (bug histórico: pagamentos sumiam ao navegar entre telas).
 */
export const qk = {
  authUser: () => ["auth-user"] as const,
  obra: (obraId: string | undefined, userId: string | undefined) =>
    ["obra", obraId, userId] as const,
  profissionais: (obraId: string | undefined, userId: string | undefined) =>
    ["profissionais", obraId, userId] as const,
  pagamentos: (obraId: string | undefined, userId: string | undefined) =>
    ["pagamentos", obraId, userId] as const,
  despesas: (obraId: string | undefined, userId: string | undefined) =>
    ["despesas", obraId, userId] as const,
  recebimentos: (obraId: string | undefined, userId: string | undefined) =>
    ["recebimentos", obraId, userId] as const,
  clientes: (obraId: string | undefined, userId: string | undefined) =>
    ["clientes", obraId, userId] as const,
} as const

/** Topo de chave usado em invalidações por predicate. */
export const QUERY_NAMESPACES = [
  "obra",
  "profissionais",
  "pagamentos",
  "despesas",
  "recebimentos",
  "clientes",
] as const
