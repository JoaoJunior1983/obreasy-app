# Configuração do Supabase Storage para Avatars

## Problema
A foto de perfil não está sendo salva no banco de dados, apenas em cache local (localStorage).

## Solução Automática
O sistema agora tenta criar o bucket 'avatars' automaticamente quando você faz upload de uma foto.

## Solução Manual (se necessário)

### 1. Criar o Bucket 'avatars'

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Storage** no menu lateral
4. Clique em **New bucket**
5. Configure:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Ativado (para permitir acesso público às fotos)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/png, image/jpeg, image/jpg, image/webp`
6. Clique em **Create bucket**

### 2. Configurar Políticas de Acesso (RLS)

Depois de criar o bucket, você precisa configurar as políticas de acesso:

#### Opção A: Via Interface (mais fácil)

1. Vá em **Storage** > **Policies**
2. Clique no bucket **avatars**
3. Adicione as seguintes políticas:

**Política 1: Leitura Pública**
- Name: `Public Access`
- Policy: `SELECT`
- Target roles: `public`
- USING expression:
  ```sql
  bucket_id = 'avatars'
  ```

**Política 2: Upload para Usuários Autenticados**
- Name: `Authenticated users can upload`
- Policy: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression:
  ```sql
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
  ```

**Política 3: Atualização para Usuários Autenticados**
- Name: `Authenticated users can update`
- Policy: `UPDATE`
- Target roles: `authenticated`
- USING expression:
  ```sql
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
  ```

#### Opção B: Via SQL Editor (mais rápido)

1. Vá em **SQL Editor**
2. Crie uma nova query
3. Cole e execute o seguinte SQL:

```sql
-- Permitir leitura pública dos avatars
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir que usuários autenticados façam upload de avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados atualizem avatars
CREATE POLICY "Authenticated users can update their avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados deletem avatars
CREATE POLICY "Authenticated users can delete their avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
```

### 3. Testar

1. Faça login no sistema
2. Vá em **Minha Conta**
3. Faça upload de uma foto de perfil
4. Abra o **Console do navegador** (F12) e veja os logs:
   - `[STORAGE-SETUP]` - Logs de verificação/criação do bucket
   - `[AVATAR]` - Logs do processo de upload
   - `[HEADER]` - Logs de carregamento do avatar
5. Se tudo funcionar, você verá:
   - ✅ Bucket 'avatars' existe ou foi criado
   - ✅ Upload bem-sucedido
   - ✅ URL pública gerada
   - ✅ Avatar carregado do Supabase

### 4. Diagnóstico de Problemas

Se ainda houver problemas, verifique no console:

- **Erro "Bucket not found"**: O bucket não foi criado. Crie manualmente seguindo o passo 1.
- **Erro "Permission denied"**: As políticas RLS não estão configuradas. Configure seguindo o passo 2.
- **Erro "File size too large"**: A imagem excede 5MB. Use uma imagem menor.
- **Erro "Invalid file type"**: Use apenas JPG, PNG ou WEBP.

### 5. Verificar se Funcionou

Para verificar se a foto está no banco de dados:

1. Vá em **Supabase Dashboard** > **Storage** > **avatars**
2. Você deverá ver os arquivos de avatar lá
3. Vá em **Table Editor** > **user_profiles**
4. Verifique se o campo `avatar_url` tem uma URL do Supabase (não um base64 enorme)

## URLs do Sistema

- **Supabase URL**: https://blietvjzchjrzbmkitha.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/blietvjzchjrzbmkitha
