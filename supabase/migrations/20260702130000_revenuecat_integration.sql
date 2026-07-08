-- RevenueCat integration: native IAP tracking (iOS/Android) alongside Guru (web)

-- New columns on user_profiles for RevenueCat / multi-provider subscription tracking
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'guru',
  ADD COLUMN IF NOT EXISTS store_platform text NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS revenuecat_app_user_id text,
  ADD COLUMN IF NOT EXISTS revenuecat_product_id text;

COMMENT ON COLUMN public.user_profiles.payment_provider IS 'guru | revenuecat — origem da assinatura ativa';
COMMENT ON COLUMN public.user_profiles.store_platform IS 'web | ios | android — plataforma onde a assinatura foi contratada';

-- Index for webhook user resolution by revenuecat_app_user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_revenuecat_app_user_id
  ON public.user_profiles (revenuecat_app_user_id)
  WHERE revenuecat_app_user_id IS NOT NULL;

-- Webhook logs table for idempotency (mirrors guru_webhook_logs)
CREATE TABLE IF NOT EXISTS public.revenuecat_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  event_type text NOT NULL,
  app_user_id text,
  raw_payload jsonb,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Idempotency: same RevenueCat event.id must not be processed twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_revenuecat_webhook_logs_idempotency
  ON public.revenuecat_webhook_logs (event_id);

-- RLS: only service_role can access revenuecat_webhook_logs
ALTER TABLE public.revenuecat_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on revenuecat_webhook_logs"
  ON public.revenuecat_webhook_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
