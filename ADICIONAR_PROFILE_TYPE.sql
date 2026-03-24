-- ================================================================================
-- 🔧 MIGRAÇÃO: Adicionar coluna profile_type à tabela user_profiles
-- ================================================================================
--
-- PROBLEMA: O perfil do usuário (owner/builder) não está sendo salvo no banco
-- SOLUÇÃO: Adicionar coluna profile_type para persistir a escolha do usuário
--
-- INSTRUÇÕES:
-- 1. Acesse: https://blietvjzchjrzbmkitha.supabase.co
-- 2. Vá em "SQL Editor" no menu lateral
-- 3. Cole este script
-- 4. Clique em "Run" para executar
-- 5. Aguarde a confirmação de sucesso
--
-- ================================================================================

-- Adicionar coluna profile_type à tabela user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS profile_type TEXT CHECK (profile_type IN ('owner', 'builder'));

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.user_profiles.profile_type IS 'Tipo de perfil do usuário: owner (dono da obra) ou builder (construtor/profissional)';

-- Verificar se a coluna foi criada com sucesso
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;
