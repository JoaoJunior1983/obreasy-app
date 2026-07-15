import type { SupabaseClient } from "@supabase/supabase-js"
import { getPlanoByRevenueCatProductId } from "./revenuecat-plans"
import { isActiveStatus, type PlanoId, type BillingCycle, type SubscriptionStatus } from "./guru-plans"

// ─── Webhook payload (RevenueCat) ───
// https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields

export type RevenueCatEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "PRODUCT_CHANGE"
  | "CANCELLATION"
  | "UNCANCELLATION"
  | "NON_RENEWING_PURCHASE"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_EXTENDED"
  | "TRANSFER"
  | "TEMPORARY_ENTITLEMENT_GRANT"
  | "INVOICE_ISSUANCE"
  | "REFUND_REVERSED"
  | "TEST"

export interface RevenueCatWebhookEvent {
  id: string
  type: RevenueCatEventType
  app_user_id: string
  original_app_user_id?: string
  aliases?: string[]
  product_id: string
  new_product_id?: string
  entitlement_ids?: string[] | null
  period_type?: string
  purchased_at_ms?: number
  expiration_at_ms?: number | null
  store?: string
  environment?: "SANDBOX" | "PRODUCTION"
  price?: number
  currency?: string
  cancel_reason?: string | null
}

export interface RevenueCatWebhookPayload {
  api_version: string
  event: RevenueCatWebhookEvent
}

// ─── Event → internal status mapping ───
// CANCELLATION apenas desliga o auto-renew (o acesso permanece até expiration_at_ms);
// só tratamos como baixa efetiva quando chega o EXPIRATION.
const RC_EVENT_STATUS_MAP: Record<RevenueCatEventType, SubscriptionStatus | null> = {
  INITIAL_PURCHASE: "active",
  RENEWAL: "active",
  UNCANCELLATION: "active",
  PRODUCT_CHANGE: "active",
  TRANSFER: "active",
  SUBSCRIPTION_EXTENDED: "active",
  TEMPORARY_ENTITLEMENT_GRANT: "active",
  NON_RENEWING_PURCHASE: "active",
  INVOICE_ISSUANCE: "active",
  REFUND_REVERSED: "active",
  CANCELLATION: "active",
  BILLING_ISSUE: "overdue",
  EXPIRATION: "expired",
  SUBSCRIPTION_PAUSED: "inactive",
  TEST: null,
}

const STORE_TO_PLATFORM: Record<string, string> = {
  APP_STORE: "ios",
  MAC_APP_STORE: "ios",
  PLAY_STORE: "android",
  AMAZON: "android",
  GALAXY: "android",
}

// Eventos que legitimamente podem reduzir a data de acesso (fim de assinatura).
// Qualquer outro tipo (RENEWAL, PRODUCT_CHANGE, etc.) nunca deve "voltar no tempo":
// já vimos na prática o RevenueCat mandar PRODUCT_CHANGE com expiration_at_ms
// desatualizado (do produto antigo), chegando depois de um RENEWAL correto e
// sobrescrevendo a data certa com uma data já passada.
const EVENTS_THAT_CAN_SHORTEN_ACCESS = new Set<RevenueCatEventType>(["EXPIRATION", "CANCELLATION"])

// ─── Idempotency ───

export async function isRevenueCatEventProcessed(
  supabase: SupabaseClient,
  eventId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("revenuecat_webhook_logs")
    .select("id")
    .eq("event_id", eventId)
    .limit(1)
    .maybeSingle()

  return !!data
}

export async function logRevenueCatWebhook(
  supabase: SupabaseClient,
  event: RevenueCatWebhookEvent,
  rawPayload: Record<string, unknown>
): Promise<void> {
  await supabase.from("revenuecat_webhook_logs").upsert(
    {
      event_id: event.id,
      event_type: event.type,
      app_user_id: event.app_user_id,
      raw_payload: rawPayload,
    },
    { onConflict: "event_id", ignoreDuplicates: true }
  )
}

// ─── User resolution ───
// app_user_id é setado como o id do Supabase via Purchases.logIn() no app nativo,
// então na imensa maioria dos casos basta buscar por id — sem precisar casar e-mail.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function resolveUserByRevenueCatId(
  supabase: SupabaseClient,
  appUserId: string
): Promise<string | null> {
  if (UUID_RE.test(appUserId)) {
    const { data } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", appUserId)
      .maybeSingle()
    if (data?.id) return data.id
  }

  const { data: byRcId } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("revenuecat_app_user_id", appUserId)
    .limit(1)
    .maybeSingle()

  return byRcId?.id ?? null
}

// ─── Subscription upsert ───

interface RevenueCatUpsertData {
  userId: string
  revenuecatAppUserId: string
  productId: string
  plano: PlanoId
  billingCycle: BillingCycle
  status: SubscriptionStatus
  storePlatform: string
  cycleEndDate: string | null
  cancelReason?: string | null
}

export async function upsertRevenueCatSubscription(
  supabase: SupabaseClient,
  data: RevenueCatUpsertData
): Promise<void> {
  const profileType = data.plano === "profissional" ? "builder" : "owner"

  const updatePayload: Record<string, unknown> = {
    payment_provider: "revenuecat",
    store_platform: data.storePlatform,
    revenuecat_app_user_id: data.revenuecatAppUserId,
    revenuecat_product_id: data.productId,
    plano: data.plano,
    billing_cycle: data.billingCycle,
    status: data.status,
    payment_method: "in_app_purchase",
    cycle_end_date: data.cycleEndDate,
    profile_type: profileType,
    updated_at: new Date().toISOString(),
  }

  if (isActiveStatus(data.status)) {
    updatePayload.overdue_since = null
    if (data.status === "active") {
      updatePayload.cancelled_at = null
    }
  }

  if (data.status === "overdue") {
    updatePayload.overdue_since = new Date().toISOString()
  }

  if (data.status === "expired" || data.status === "inactive") {
    updatePayload.profile_type = "owner"
    updatePayload.plano = "essencial"
    updatePayload.cancelled_at = new Date().toISOString()
  }

  await supabase.from("user_profiles").update(updatePayload).eq("id", data.userId)
}

// ─── Full webhook handler ───

interface WebhookResult {
  status: string
  userId?: string
  plano?: string
  subscriptionStatus?: string
  error?: string
  httpStatus: number
}

export async function handleRevenueCatWebhook(
  supabase: SupabaseClient,
  payload: RevenueCatWebhookPayload
): Promise<WebhookResult> {
  const event = payload.event
  const rawPayload = payload as unknown as Record<string, unknown>

  const alreadyProcessed = await isRevenueCatEventProcessed(supabase, event.id)
  if (alreadyProcessed) {
    return { status: "already_processed", httpStatus: 200 }
  }

  if (event.type === "TEST") {
    await logRevenueCatWebhook(supabase, event, rawPayload)
    return { status: "test_event_ignored", httpStatus: 200 }
  }

  const internalStatus = RC_EVENT_STATUS_MAP[event.type]
  if (!internalStatus) {
    await logRevenueCatWebhook(supabase, event, rawPayload)
    return { status: "event_ignored", httpStatus: 200 }
  }

  const productId = event.type === "PRODUCT_CHANGE" && event.new_product_id ? event.new_product_id : event.product_id
  const mapped = getPlanoByRevenueCatProductId(productId)
  const plano: PlanoId = mapped?.plano ?? "essencial"
  const cycle: BillingCycle = mapped?.cycle ?? "monthly"

  const userId = await resolveUserByRevenueCatId(supabase, event.app_user_id)
  if (!userId) {
    console.error(
      `[RevenueCat Webhook] Cannot resolve user for app_user_id ${event.app_user_id} (event ${event.id}, type ${event.type})`
    )
    await logRevenueCatWebhook(supabase, event, rawPayload)
    return { status: "user_not_found", error: event.app_user_id, httpStatus: 200 }
  }

  const storePlatform = STORE_TO_PLATFORM[event.store ?? ""] ?? "ios"
  let cycleEndDate = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null

  // Guarda contra eventos fora de ordem / com datas obsoletas (ex.: PRODUCT_CHANGE
  // carregando expiration_at_ms do produto anterior). Nunca deixamos a data de
  // acesso regredir, exceto em eventos que legitimamente encerram a assinatura.
  if (cycleEndDate && !EVENTS_THAT_CAN_SHORTEN_ACCESS.has(event.type)) {
    const { data: currentProfile } = await supabase
      .from("user_profiles")
      .select("cycle_end_date")
      .eq("id", userId)
      .maybeSingle()

    const currentCycleEndDate = currentProfile?.cycle_end_date as string | null
    if (currentCycleEndDate && new Date(cycleEndDate) < new Date(currentCycleEndDate)) {
      console.warn(
        `[RevenueCat Webhook] Ignorando cycle_end_date regressivo do evento ${event.type} (${event.id}): ` +
          `${cycleEndDate} < ${currentCycleEndDate}. Mantendo data existente.`
      )
      cycleEndDate = currentCycleEndDate
    }
  }

  await upsertRevenueCatSubscription(supabase, {
    userId,
    revenuecatAppUserId: event.app_user_id,
    productId,
    plano,
    billingCycle: cycle,
    status: internalStatus,
    storePlatform,
    cycleEndDate,
    cancelReason: event.cancel_reason,
  })

  await logRevenueCatWebhook(supabase, event, rawPayload)

  return {
    status: "processed",
    userId,
    plano,
    subscriptionStatus: internalStatus,
    httpStatus: 200,
  }
}
