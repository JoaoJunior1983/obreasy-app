-- Adicionar campos de consentimento de marketing (LGPD + App Store/Play guidelines)
-- - marketing_optin: usuário aceitou receber ofertas de parceiros (default FALSE conforme LGPD)
-- - marketing_optin_at: momento em que o consentimento foi dado (auditoria LGPD)

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS marketing_optin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_optin_at TIMESTAMPTZ;
