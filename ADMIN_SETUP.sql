-- ================================================================================
-- 🔐 ADMIN SETUP - OBREASY
-- ================================================================================
-- Execute este script no Supabase SQL Editor:
-- https://blietvjzchjrzbmkitha.supabase.co
-- ================================================================================

-- ----------------------------------------
-- 1. Adicionar colunas de plano em user_profiles
-- ----------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'essencial'
    CHECK (plano IN ('essencial', 'profissional', 'trial')),
  ADD COLUMN IF NOT EXISTS plano_expira_em TIMESTAMPTZ;

COMMENT ON COLUMN public.user_profiles.plano IS 'Plano atual: essencial | profissional | trial';
COMMENT ON COLUMN public.user_profiles.plano_expira_em IS 'Data de expiração do plano (null = sem expiração)';

-- ----------------------------------------
-- 2. Criar tabela admin_trials
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  email TEXT,                -- null = qualquer usuário pode usar
  days INT NOT NULL DEFAULT 30,
  label TEXT,                -- descrição: "Parceria Influenciador X"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,    -- quando o código expira (null = sem expiração)
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.admin_trials IS 'Códigos de trial/acesso gratuito criados pelo admin';
COMMENT ON COLUMN public.admin_trials.code IS 'Código único de 8 caracteres (ex: ABC12345)';
COMMENT ON COLUMN public.admin_trials.email IS 'Email específico que pode usar o código (null = qualquer um)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_admin_trials_code ON public.admin_trials(code);
CREATE INDEX IF NOT EXISTS idx_admin_trials_email ON public.admin_trials(email);
CREATE INDEX IF NOT EXISTS idx_admin_trials_used_by ON public.admin_trials(used_by);

-- ----------------------------------------
-- 3. RLS em admin_trials
-- ----------------------------------------
ALTER TABLE public.admin_trials ENABLE ROW LEVEL SECURITY;

-- Admin tem acesso total
DROP POLICY IF EXISTS "Admin full access trials" ON public.admin_trials;
CREATE POLICY "Admin full access trials"
  ON public.admin_trials
  USING (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com'))
  WITH CHECK (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com'));

-- Qualquer usuário autenticado pode ler códigos não usados (para validação)
CREATE POLICY "Users can read trials"
  ON public.admin_trials
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Usuário autenticado pode marcar código como usado (redemption)
CREATE POLICY "Users can redeem trial"
  ON public.admin_trials
  FOR UPDATE
  USING (auth.role() = 'authenticated' AND used_at IS NULL)
  WITH CHECK (auth.role() = 'authenticated');

-- ----------------------------------------
-- 4. RLS admin em user_profiles — ver e atualizar TODOS
-- ----------------------------------------
-- Remover políticas conflitantes se existirem
DROP POLICY IF EXISTS "Admin select all user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin update all user_profiles" ON public.user_profiles;

CREATE POLICY "Admin select all user_profiles"
  ON public.user_profiles
  FOR SELECT
  USING (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com') OR auth.uid() = id);

CREATE POLICY "Admin update all user_profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com') OR auth.uid() = id)
  WITH CHECK (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com') OR auth.uid() = id);

-- ----------------------------------------
-- 5. RLS admin em obras — ver TODAS
-- ----------------------------------------
DROP POLICY IF EXISTS "Admin select all obras" ON public.obras;

CREATE POLICY "Admin select all obras"
  ON public.obras
  FOR SELECT
  USING (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com') OR auth.uid() = user_id);

-- ----------------------------------------
-- 6. Verificação
-- ----------------------------------------
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'admin_trials')
ORDER BY table_name, ordinal_position;
