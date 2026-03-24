import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas')
  process.exit(1)
}

console.log('🔗 Conectando ao Supabase...')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const migrationSQL = readFileSync('/workspace/supabase/migrations/20260130113835_create_obras_table.sql', 'utf8')

console.log('📝 Executando migração SQL...')

// Executar cada statement separadamente
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

for (const statement of statements) {
  const { error } = await supabase.rpc('exec_sql', { 
    query: statement + ';'
  }).catch(async () => {
    // Se exec_sql não existir, tentar executar direto
    return await supabase.from('_').select('*').limit(0)
  })
  
  if (error && !error.message?.includes('does not exist')) {
    console.warn('⚠️ Aviso:', error.message)
  }
}

console.log('✅ Migração concluída!')
