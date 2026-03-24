import { createClient } from '@supabase/supabase-js'

// Valores de fallback
const SUPABASE_URL = 'https://blietvjzchjrzbmkitha.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWV0dmp6Y2hqcnpibWtpdGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzM5MzUsImV4cCI6MjA4NTI0OTkzNX0.1MOdgwmLOFlCF89SxmwfrpnVZKu90CL70Oc8KVveSrE'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWV0dmp6Y2hqcnpibWtpdGhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY3MzkzNSwiZXhwIjoyMDg1MjQ5OTM1fQ.7PGsrea8OKaic-8_pTFgu-kujCbtVmSPCduHPlv5x3Y'

// Cliente Supabase para uso em Server Components e API Routes
// Este cliente usa a Service Role Key que tem permissões administrativas
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Cliente Supabase para uso em Server Components (sem privilégios administrativos)
export function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
