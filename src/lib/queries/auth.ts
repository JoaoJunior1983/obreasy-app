import { useQuery } from "@tanstack/react-query"
import type { User } from "@supabase/supabase-js"

/**
 * Auth do Supabase com cache de 5min compartilhado entre todas as
 * páginas autenticadas. Cache hit imediato ao navegar entre dashboards.
 *
 * Use `isError` para redirecionar para /login quando a sessão expira.
 */
export function useAuthUser() {
  return useQuery<User>({
    queryKey: ["auth-user"],
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) throw new Error("not authenticated")
      return data.user
    },
  })
}
