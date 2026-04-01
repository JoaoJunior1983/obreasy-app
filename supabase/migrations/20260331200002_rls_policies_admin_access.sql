-- Migration: RLS policies para novas tabelas + admin access em tabelas existentes

-- ========================================
-- RLS: user_events
-- ========================================
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own events" ON public.user_events;
CREATE POLICY "Users can read own events"
  ON public.user_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own events" ON public.user_events;
CREATE POLICY "Users can insert own events"
  ON public.user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access user_events" ON public.user_events;
CREATE POLICY "Admin full access user_events"
  ON public.user_events FOR SELECT
  USING (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com'));

-- ========================================
-- RLS: subscription_history
-- ========================================
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscription_history" ON public.subscription_history;
CREATE POLICY "Users can read own subscription_history"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription_history" ON public.subscription_history;
CREATE POLICY "Users can insert own subscription_history"
  ON public.subscription_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access subscription_history" ON public.subscription_history;
CREATE POLICY "Admin full access subscription_history"
  ON public.subscription_history FOR SELECT
  USING (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com'));

-- ========================================
-- Admin SELECT em despesas (metricas)
-- ========================================
DROP POLICY IF EXISTS "Admin select all despesas" ON public.despesas;
CREATE POLICY "Admin select all despesas"
  ON public.despesas FOR SELECT
  USING (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com') OR auth.uid() = user_id);

-- ========================================
-- Admin SELECT em pagamentos (metricas)
-- ========================================
DROP POLICY IF EXISTS "Admin select all pagamentos" ON public.pagamentos;
CREATE POLICY "Admin select all pagamentos"
  ON public.pagamentos FOR SELECT
  USING (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com') OR auth.uid() = user_id);

-- ========================================
-- Admin SELECT em recebimentos (metricas)
-- ========================================
DROP POLICY IF EXISTS "Admin select all recebimentos" ON public.recebimentos;
CREATE POLICY "Admin select all recebimentos"
  ON public.recebimentos FOR SELECT
  USING (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com') OR auth.uid() = user_id);

-- ========================================
-- Admin INSERT em user_events (para acoes admin)
-- ========================================
DROP POLICY IF EXISTS "Admin insert user_events" ON public.user_events;
CREATE POLICY "Admin insert user_events"
  ON public.user_events FOR INSERT
  WITH CHECK (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com'));

-- ========================================
-- Admin INSERT em subscription_history (para acoes admin)
-- ========================================
DROP POLICY IF EXISTS "Admin insert subscription_history" ON public.subscription_history;
CREATE POLICY "Admin insert subscription_history"
  ON public.subscription_history FOR INSERT
  WITH CHECK (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com'));

-- ========================================
-- Admin UPDATE em admin_trials (estender, reativar)
-- ========================================
DROP POLICY IF EXISTS "Admin update all admin_trials" ON public.admin_trials;
CREATE POLICY "Admin update all admin_trials"
  ON public.admin_trials FOR UPDATE
  USING (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com'))
  WITH CHECK (auth.jwt()->>'email' IN ('cleyton@lasy.ai', 'joaojrsilva@hotmail.com'));
