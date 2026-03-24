# 🚨 CORREÇÃO URGENTE - AVATAR NÃO SALVA

## Problemas Identificados pelos Logs:

1. ❌ Coluna `avatar_url` não existe na tabela `user_profiles`
2. ❌ Bucket `avatars` não existe no Supabase Storage
3. ❌ Políticas RLS bloqueando criação programática de buckets

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### PASSO 1: Adicionar Coluna `avatar_url`

1. Abra o **Supabase Dashboard**: https://supabase.com/dashboard/project/blietvjzchjrzbmkitha
2. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)
3. Clique em **New query**
4. Cole e execute este SQL:

```sql
-- Adicionar coluna avatar_url à tabela user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL pública do avatar do usuário no Supabase Storage';
```

5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Deve aparecer "Success. No rows returned"

### PASSO 2: Criar Bucket `avatars`

1. No Supabase Dashboard, vá em **Storage** (ícone de pasta no menu lateral)
2. Clique em **New bucket**
3. Configure:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **ATIVADO** (importante!)
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**:
     ```
     image/png
     image/jpeg
     image/jpg
     image/webp
     ```
4. Clique em **Create bucket**

### PASSO 3: Configurar Políticas do Bucket

1. Ainda em **Storage**, clique no bucket **avatars** que você acabou de criar
2. Clique na aba **Policies**
3. Clique em **New policy**

**Política 1 - Leitura Pública:**
- Policy name: `Public Access`
- Allowed operation: `SELECT`
- Target roles: `public`
- Policy definition (USING):
  ```sql
  bucket_id = 'avatars'
  ```
- Clique **Save policy**

**Política 2 - Upload Autenticado:**
- Clique em **New policy** novamente
- Policy name: `Authenticated users can upload`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition (WITH CHECK):
  ```sql
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Clique **Save policy**

**Política 3 - Update Autenticado:**
- Clique em **New policy** novamente
- Policy name: `Authenticated users can update`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- Policy definition (USING):
  ```sql
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Clique **Save policy**

**Política 4 - Delete Autenticado:**
- Clique em **New policy** novamente
- Policy name: `Authenticated users can delete`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- Policy definition (USING):
  ```sql
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Clique **Save policy**

### ALTERNATIVA RÁPIDA - SQL para Todas as Políticas:

Se preferir fazer tudo via SQL (mais rápido):

1. Vá em **SQL Editor**
2. Cole e execute:

```sql
-- Permitir leitura pública dos avatars
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir que usuários autenticados façam upload
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados atualizem seus avatars
CREATE POLICY "Authenticated users can update their avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados deletem seus avatars
CREATE POLICY "Authenticated users can delete their avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
```

### PASSO 4: Testar

1. Volte para http://localhost:3000/dashboard/conta
2. **Recarregue a página** (Ctrl+F5)
3. Tente fazer upload de uma foto
4. Verifique o console (F12) - agora deve mostrar:
   - ✅ `[STORAGE-SETUP] Bucket 'avatars' já existe`
   - ✅ `[AVATAR] Upload bem-sucedido`
   - ✅ `[AVATAR] URL pública gerada`

### PASSO 5: Verificar se Funcionou

1. No Supabase Dashboard, vá em **Storage** > **avatars**
2. Você deve ver o arquivo da foto lá
3. Vá em **Table Editor** > **user_profiles**
4. A coluna `avatar_url` deve ter uma URL tipo:
   ```
   https://blietvjzchjrzbmkitha.supabase.co/storage/v1/object/public/avatars/afb98df4-3679-4578-8d6d-57f2e478914c-1739468123456.jpg
   ```

## 🎯 Resumo do que você precisa fazer:

1. **SQL Editor**: Executar o SQL para adicionar a coluna `avatar_url`
2. **Storage**: Criar o bucket `avatars` como público
3. **Policies**: Configurar as 4 políticas de acesso
4. **Testar**: Fazer upload da foto novamente

## ⏱️ Tempo estimado: 5 minutos

## 📞 Links Úteis:

- **Supabase Dashboard**: https://supabase.com/dashboard/project/blietvjzchjrzbmkitha
- **SQL Editor**: https://supabase.com/dashboard/project/blietvjzchjrzbmkitha/sql/new
- **Storage**: https://supabase.com/dashboard/project/blietvjzchjrzbmkitha/storage/buckets
