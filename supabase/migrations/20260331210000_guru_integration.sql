-- Digital Manager Guru integration: webhook logs + subscription fields on user_profiles

-- New columns on user_profiles for Guru subscription tracking
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS guru_subscription_id text,
  ADD COLUMN IF NOT EXISTS guru_offer_id text,
  ADD COLUMN IF NOT EXISTS billing_cycle text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS current_cycle integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cycle_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS cycle_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS next_cycle_at timestamptz,
  ADD COLUMN IF NOT EXISTS pix_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS overdue_since timestamptz;

-- Index for webhook user resolution by guru_subscription_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_guru_sub_id
  ON public.user_profiles (guru_subscription_id)
  WHERE guru_subscription_id IS NOT NULL;

-- Webhook logs table for idempotency
CREATE TABLE IF NOT EXISTS public.guru_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type text NOT NULL,
  guru_id text NOT NULL,
  status_received text NOT NULL,
  raw_payload jsonb,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Idempotency: same guru_id + status_received pair must not be processed twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_guru_webhook_logs_idempotency
  ON public.guru_webhook_logs (guru_id, status_received);

-- RLS: only service_role can access guru_webhook_logs
ALTER TABLE public.guru_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on guru_webhook_logs"
  ON public.guru_webhook_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
