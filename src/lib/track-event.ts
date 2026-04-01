import { supabase } from "@/lib/supabase"

export type EventType =
  | "signup"
  | "trial_start"
  | "profile_selected"
  | "first_obra"
  | "first_despesa"
  | "first_report"
  | "subscription_started"
  | "plan_changed"
  | "plan_cancelled"
  | "login"

export async function trackEvent(
  eventType: EventType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await (supabase as any).from("user_events").insert({
      user_id: user.id,
      event_type: eventType,
      metadata: metadata ?? {},
    })
  } catch {
    // fire-and-forget
  }
}

export async function trackFirstEvent(
  eventType: EventType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await (supabase as any)
      .from("user_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", eventType)

    if ((count ?? 0) > 0) return

    await (supabase as any).from("user_events").insert({
      user_id: user.id,
      event_type: eventType,
      metadata: metadata ?? {},
    })
  } catch {
    // fire-and-forget
  }
}

export async function updateLastActive(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await (supabase as any)
      .from("user_profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", user.id)
  } catch {
    // fire-and-forget
  }
}

export async function recordSubscriptionChange(
  userId: string,
  planoAnterior: string | null,
  planoNovo: string,
  motivo?: string
): Promise<void> {
  try {
    await (supabase as any).from("subscription_history").insert({
      user_id: userId,
      plano_anterior: planoAnterior,
      plano_novo: planoNovo,
      motivo: motivo ?? null,
    })
  } catch {
    // fire-and-forget
  }
}

export function getLeadSource(): string {
  if (typeof window === "undefined") return "organic"
  const params = new URLSearchParams(window.location.search)
  const ref = params.get("ref")
  if (ref) return ref
  const referrer = document.referrer
  if (!referrer) return "direct"
  if (referrer.includes("/newlp")) return "newlp"
  if (referrer.includes("/lp")) return "lp"
  return "organic"
}
