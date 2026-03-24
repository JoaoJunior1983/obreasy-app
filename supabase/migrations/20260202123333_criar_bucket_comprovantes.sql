-- =============================================
-- MIGRATION: Criar bucket para comprovantes de pagamento
-- =============================================

-- 1. Criar bucket "comprovantes" (público para permitir acesso via URL pública)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política RLS: Permitir upload apenas para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de comprovantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1] -- Validar que o user_id é o mesmo do folder
);

-- 3. Política RLS: Permitir usuários visualizarem seus próprios comprovantes
CREATE POLICY "Usuários podem visualizar seus próprios comprovantes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Política RLS: Permitir usuários excluírem seus próprios comprovantes
CREATE POLICY "Usuários podem excluir seus próprios comprovantes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Política RLS: Permitir usuários atualizarem seus próprios comprovantes
CREATE POLICY "Usuários podem atualizar seus próprios comprovantes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Adicionar coluna comprovante_url na tabela pagamentos (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pagamentos'
      AND column_name = 'comprovante_url'
  ) THEN
    ALTER TABLE pagamentos
    ADD COLUMN comprovante_url TEXT;

    COMMENT ON COLUMN pagamentos.comprovante_url IS 'URL pública do comprovante de pagamento no Supabase Storage';
  END IF;
END $$;

-- 7. Adicionar coluna comprovante_url na tabela despesas (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'despesas'
      AND column_name = 'comprovante_url'
  ) THEN
    ALTER TABLE despesas
    ADD COLUMN comprovante_url TEXT;

    COMMENT ON COLUMN despesas.comprovante_url IS 'URL pública do comprovante de despesa no Supabase Storage';
  END IF;
END $$;
