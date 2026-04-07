import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Configuração com valores padrão
const SUPABASE_URL = 'https://blietvjzchjrzbmkitha.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWV0dmp6Y2hqcnpibWtpdGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzM5MzUsImV4cCI6MjA4NTI0OTkzNX0.1MOdgwmLOFlCF89SxmwfrpnVZKu90CL70Oc8KVveSrE'

// Cliente singleton - criado apenas uma vez
let supabaseInstance: SupabaseClient<Database> | null = null

// Função para criar/obter o cliente Supabase
function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Obter URL e chave (preferir env vars, fallback para constantes)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

  // Criar cliente com configurações otimizadas
  supabaseInstance = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'implicit'
    },
    global: {
      headers: {
        'X-Client-Info': 'obreasy-app'
      }
    },
    db: {
      schema: 'public'
    }
  })

  // Tratar refresh token inválido: limpar sessão stale e redirecionar para login
  if (typeof window !== 'undefined') {
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        const hadSession = localStorage.getItem('isAuthenticated') === 'true'
        if (hadSession) {
          localStorage.removeItem('isAuthenticated')
          localStorage.removeItem('user')
          localStorage.removeItem('trialExpiraEm')
          window.location.href = '/login'
        }
      }
    })
  }

  return supabaseInstance
}

// Exportar cliente como propriedade getter para lazy initialization
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getSupabaseClient()
    return (client as any)[prop]
  }
})

// Função helper para verificar se o Supabase está configurado
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

  return !!(url && key &&
    url !== 'https://placeholder.supabase.co' &&
    key !== 'placeholder-key')
}

// Teste de conexão (não lança erro, apenas retorna status)
export async function testSupabaseConnection() {
  try {
    const client = getSupabaseClient()
    const { error } = await client.from('user_profiles').select('count').limit(1)
    return { success: !error, error }
  } catch (err) {
    return { success: false, error: err }
  }
}
