import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Hook para obter o usuário autenticado atual
 * Atualiza automaticamente quando o estado de autenticação muda
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obter usuário inicial
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

/**
 * Hook para obter a sessão atual
 */
export function useSession() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading }
}

/**
 * Hook para fazer queries do Supabase com estado gerenciado
 * @param query Função que retorna a query do Supabase
 * @param deps Dependências do useEffect
 */
export function useSupabaseQuery<T>(
  query: () => Promise<{ data: T | null; error: any }>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    query()
      .then(({ data, error }) => {
        setData(data)
        setError(error)
      })
      .finally(() => setLoading(false))
  }, deps)

  return { data, error, loading }
}

/**
 * Hook para ouvir mudanças em tempo real de uma tabela
 * @param table Nome da tabela
 * @param event Tipo de evento ('INSERT', 'UPDATE', 'DELETE', ou '*')
 * @param callback Função chamada quando há mudança
 *
 * @example
 * useRealtimeSubscription('users', 'INSERT', (payload) => {
 *   console.log('Novo usuário:', payload)
 * })
 */
export function useRealtimeSubscription(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: any) => void
) {
  useEffect(() => {
    const channel = (supabase as any)
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table
        },
        callback
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event, callback])
}
