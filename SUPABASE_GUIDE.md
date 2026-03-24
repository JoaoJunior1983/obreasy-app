# Guia de Uso do Supabase - Next.js

Este guia mostra como usar o Supabase no seu projeto Next.js.

## Arquivos Configurados

- ✅ `.env.local` - Variáveis de ambiente
- ✅ `src/lib/supabase.ts` - Cliente Supabase para componentes do navegador
- ✅ `src/lib/supabase-server.ts` - Clientes para Server Components e API Routes
- ✅ `src/types/supabase.ts` - Tipos TypeScript do banco

## Variáveis de Ambiente

As seguintes variáveis foram configuradas automaticamente:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_key_aqui
```

## 1. Uso em Client Components

Para usar em componentes que rodam no navegador:

```typescript
import { supabase } from '@/lib/supabase'

// SELECT: Buscar dados
const { data, error } = await supabase
  .from('sua_tabela')
  .select('*')
  .eq('coluna', 'valor')
  .order('created_at', { ascending: false })

// INSERT: Criar registro
const { data, error } = await supabase
  .from('sua_tabela')
  .insert([{ coluna1: 'valor1' }])
  .select()

// UPDATE: Atualizar registro
const { data, error } = await supabase
  .from('sua_tabela')
  .update({ coluna: 'novo_valor' })
  .eq('id', id)

// DELETE: Deletar registro
const { error } = await supabase
  .from('sua_tabela')
  .delete()
  .eq('id', id)
```

## 2. Uso em Server Components

Para usar em Server Components do Next.js:

```typescript
import { getSupabaseServer } from '@/lib/supabase-server'

export default async function MeuServerComponent() {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from('sua_tabela')
    .select('*')

  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.nome}</div>
      ))}
    </div>
  )
}
```

## 3. Uso em API Routes

Para usar em API Routes com permissões administrativas:

```typescript
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin()

  // Este cliente tem permissões completas
  const { data, error } = await supabaseAdmin
    .from('sua_tabela')
    .insert([{ coluna: 'valor' }])

  return Response.json({ data, error })
}
```

## 4. Autenticação

### Login

```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@example.com',
  password: 'senha123'
})
```

### Cadastro

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@example.com',
  password: 'senha123'
})
```

### Logout

```typescript
const { error } = await supabase.auth.signOut()
```

### Obter Usuário Atual

```typescript
const { data: { user }, error } = await supabase.auth.getUser()
```

### Ouvir Mudanças de Autenticação

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Evento:', event, session)
      // 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', etc.
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

## 5. Realtime (Tempo Real)

Ouvir mudanças em uma tabela:

```typescript
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

useEffect(() => {
  const channel = supabase
    .channel('mudancas-tabela')
    .on(
      'postgres_changes',
      {
        event: '*', // 'INSERT', 'UPDATE', 'DELETE', ou '*'
        schema: 'public',
        table: 'sua_tabela'
      },
      (payload) => {
        console.log('Mudança detectada:', payload)
        // Atualizar estado aqui
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## 6. Upload de Arquivos

```typescript
import { supabase } from '@/lib/supabase'

// Upload
const { data, error } = await supabase.storage
  .from('seu-bucket')
  .upload(`arquivos/${file.name}`, file)

// Obter URL pública
const { data: { publicUrl } } = supabase.storage
  .from('seu-bucket')
  .getPublicUrl(`arquivos/${file.name}`)
```

## 7. Queries Complexas

```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    titulo,
    conteudo,
    autor:users(id, nome, email),
    comentarios:comments(id, texto)
  `)
  .eq('status', 'publicado')
  .gte('created_at', '2024-01-01')
  .order('created_at', { ascending: false })
  .limit(10)
```

## 8. Chamar Funções do PostgreSQL

```typescript
const { data, error } = await supabase.rpc('nome_da_funcao', {
  parametro1: 'valor1',
  parametro2: 123
})
```

## Próximos Passos

1. Crie suas tabelas no banco de dados usando arquivos `.sql`
2. Atualize `src/types/supabase.ts` com os tipos das suas tabelas
3. Use os exemplos acima para interagir com o banco

## Dicas de Segurança

- ✅ Use `supabase` (cliente) em componentes do navegador
- ✅ Use `getSupabaseServer()` em Server Components
- ⚠️ Use `getSupabaseAdmin()` apenas em API Routes
- ❌ NUNCA use `getSupabaseAdmin()` em Client Components
- ❌ NUNCA exponha `SUPABASE_SERVICE_ROLE_KEY` no navegador
