import { supabase } from './supabase'

/**
 * Verifica se o bucket de avatars existe e cria se necessário
 */
export async function ensureAvatarsBucketExists() {
  try {
    console.log("[STORAGE-SETUP] Verificando bucket 'avatars'...")

    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("[STORAGE-SETUP] Erro ao listar buckets:", listError)
      return { success: false, error: listError }
    }

    console.log("[STORAGE-SETUP] Buckets encontrados:", buckets?.map(b => b.name))

    // Verificar se o bucket 'avatars' existe
    const avatarsBucket = buckets?.find(b => b.name === 'avatars')

    if (avatarsBucket) {
      console.log("[STORAGE-SETUP] ✅ Bucket 'avatars' já existe")
      return { success: true, existed: true }
    }

    // Criar bucket se não existir
    console.log("[STORAGE-SETUP] Criando bucket 'avatars'...")

    const { data: newBucket, error: createError } = await supabase.storage.createBucket('avatars', {
      public: true, // Permitir acesso público aos avatars
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    })

    if (createError) {
      console.error("[STORAGE-SETUP] ❌ Erro ao criar bucket:", createError)
      return { success: false, error: createError }
    }

    console.log("[STORAGE-SETUP] ✅ Bucket 'avatars' criado com sucesso:", newBucket)

    // Definir política de acesso público para leitura
    // Nota: Isso precisa ser feito manualmente no Supabase Dashboard ou via SQL
    console.log("[STORAGE-SETUP] ⚠️ IMPORTANTE: Configure as políticas RLS no Supabase Dashboard:")
    console.log("[STORAGE-SETUP] 1. Vá em Storage > Policies")
    console.log("[STORAGE-SETUP] 2. Adicione política 'Public read' para SELECT")
    console.log("[STORAGE-SETUP] 3. Adicione política 'Authenticated users can upload' para INSERT/UPDATE")

    return { success: true, existed: false, created: true }
  } catch (error) {
    console.error("[STORAGE-SETUP] ❌ Erro inesperado:", error)
    return { success: false, error }
  }
}

/**
 * Instrução SQL para criar as políticas de acesso (executar no SQL Editor do Supabase)
 */
export const STORAGE_POLICIES_SQL = `
-- Permitir leitura pública dos avatars
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir que usuários autenticados façam upload de seus próprios avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados atualizem seus próprios avatars
CREATE POLICY "Authenticated users can update their avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados deletem seus próprios avatars
CREATE POLICY "Authenticated users can delete their avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
`
