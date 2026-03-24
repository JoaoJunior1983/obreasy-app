-- ================================================================================
-- 🔧 MIGRAÇÃO: Adicionar coluna comprovante_url à tabela pagamentos
-- ================================================================================
--
-- PROBLEMA: A tabela pagamentos não possui a coluna comprovante_url
-- ERRO: "Could not find the 'comprovante_url' column of 'pagamentos' in the schema cache"
--
-- INSTRUÇÕES:
-- 1. Acesse: https://blietvjzchjrzbmkitha.supabase.co
-- 2. Vá em "SQL Editor" no menu lateral
-- 3. Cole este script
-- 4. Clique em "Run" para executar
-- 5. Aguarde a confirmação de sucesso
--
-- ================================================================================

-- Adicionar coluna comprovante_url à tabela pagamentos
ALTER TABLE public.pagamentos
ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.pagamentos.comprovante_url IS 'URL pública do comprovante de pagamento no Supabase Storage';

-- Verificar se a coluna foi criada com sucesso
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pagamentos'
ORDER BY ordinal_position;
