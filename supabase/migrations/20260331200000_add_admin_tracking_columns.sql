-- Migration: Adicionar colunas de tracking/admin em user_profiles
-- Novas colunas: status, lead_source, converted_at, cancelled_at, last_active_at

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trial'
    CHECK (status IN ('trial','active','cancelled','expired','churned'));

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS lead_source TEXT;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_profiles.status IS 'Estado canonico: trial, active, cancelled, expired, churned';
COMMENT ON COLUMN public.user_profiles.lead_source IS 'Origem do cadastro: organic, newlp, lp, indicacao, trial_code';
COMMENT ON COLUMN public.user_profiles.converted_at IS 'Data de conversao trial -> assinatura';
COMMENT ON COLUMN public.user_profiles.cancelled_at IS 'Data do cancelamento';
COMMENT ON COLUMN public.user_profiles.last_active_at IS 'Ultimo acesso ou acao significativa';

CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_lead_source ON public.user_profiles(lead_source);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active_at ON public.user_profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_converted_at ON public.user_profiles(converted_at);
