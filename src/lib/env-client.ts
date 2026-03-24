/**
 * Configuração segura de variáveis de ambiente para o cliente
 * Este arquivo garante que as variáveis estejam disponíveis no navegador
 */

export function getClientEnv() {
  // Valores hardcoded como fallback para garantir funcionamento
  const url = 'https://blietvjzchjrzbmkitha.supabase.co'
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWV0dmp6Y2hqcnpibWtpdGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzM5MzUsImV4cCI6MjA4NTI0OTkzNX0.1MOdgwmLOFlCF89SxmwfrpnVZKu90CL70Oc8KVveSrE'

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || key
  }
}

export const clientEnv = getClientEnv()
