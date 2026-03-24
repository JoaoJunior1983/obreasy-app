# 🔧 Correção: Perfil do usuário não persiste após login

## Problema Identificado

Quando o usuário faz login, o sistema pede para selecionar se é "dono da obra" ou "construtor", mesmo que já tenha selecionado isso anteriormente no cadastro.

## Causa

O perfil do usuário estava sendo salvo apenas no **localStorage** do navegador, mas não estava sendo persistido no banco de dados **Supabase**. Quando o usuário fazia login em outro dispositivo ou limpava o cache do navegador, o perfil era perdido.

## Solução Aplicada

### 1. Adicionar coluna ao banco de dados

Execute o script SQL no Supabase:

**Arquivo:** `ADICIONAR_PROFILE_TYPE.sql`

**Passos:**
1. Acesse: https://blietvjzchjrzbmkitha.supabase.co
2. Vá em **"SQL Editor"** no menu lateral
3. Abra o arquivo `ADICIONAR_PROFILE_TYPE.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **"Run"**
7. Aguarde a confirmação ✅

### 2. Atualizações de código aplicadas

✅ **storage.ts** - Função `setUserProfile()` agora é assíncrona e salva no Supabase
✅ **profile-selection-modal.tsx** - Atualizado para usar a função assíncrona
✅ **auth-modal.tsx** - Carrega o `profile_type` do Supabase durante o login

### 3. Como funciona agora

**Durante o cadastro:**
1. Usuário seleciona o perfil (owner/builder)
2. Perfil é salvo no **localStorage** (imediato)
3. Perfil é salvo no **Supabase** (persistente)

**Durante o login:**
1. Sistema autentica o usuário
2. Busca o perfil do Supabase
3. Carrega o perfil salvo anteriormente
4. **Não pede** para selecionar novamente se já houver perfil salvo

**Se não houver perfil:**
- Modal de seleção aparece (primeira vez ou perfil não definido)
- Usuário seleciona
- Perfil é salvo no Supabase e localStorage

## Estrutura do banco

```sql
ALTER TABLE public.user_profiles
ADD COLUMN profile_type TEXT CHECK (profile_type IN ('owner', 'builder'));
```

**Valores possíveis:**
- `'owner'` - Dono da obra
- `'builder'` - Construtor/Profissional
- `NULL` - Perfil não definido (pede seleção)

## Teste

1. Execute a migração SQL
2. Faça logout
3. Faça login novamente
4. O sistema NÃO deve pedir para selecionar o perfil novamente
5. Se pedir, selecione uma vez e faça logout/login - agora deve funcionar

## Observações

- Usuários existentes precisarão selecionar o perfil **uma vez** após a atualização
- Após selecionar, o perfil ficará salvo permanentemente
- O perfil pode ser alterado em "Minha Conta" (se houver essa opção)
