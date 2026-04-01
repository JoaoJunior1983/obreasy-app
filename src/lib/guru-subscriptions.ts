import type { SupabaseClient } from "@supabase/supabase-js"
import {
  getOfferByGuruId,
  mapGuruStatusToInternal,
  isActiveStatus,
  type PlanoId,
  type BillingCycle,
  type SubscriptionStatus,
} from "./guru-plans"

// ─── Webhook payload interfaces (Digital Manager Guru) ───

export interface GuruSubscriptionWebhook {
  api_token: string
  webhook_type: string
  id: string
  internal_id: string
  last_status: string
  name: string
  charged_times: number
  charged_every_days: number
  trial_days: number
  cancel_reason: string | null
  cancel_at_cycle_end: number
  payment_method: string | null
  subscription_code: string
  provider: string
  dates: {
    started_at: string | null
    cycle_start_date: string | null
    cycle_end_date: string | null
    next_cycle_at: string | null
    canceled_at: string | null
    last_status_at: string | null
  }
  subscriber: {
    id: string
    name: string | null
    email: string | null
    doc: string | null
    phone_number: string | null
    phone_local_code: string | null
  }
  product: {
    id: string
    name: string
    marketplace_id: string
    marketplace_name: string
    offer: {
      id: string
      name: string
      value: number
      plan?: {
        interval: number
        interval_type: string
        trial_days: number
        cycles: number
      }
    }
  }
  current_invoice: {
    id: string
    code: string
    cycle: number
    value: number
    status: string
    charge_at: string
    period_start: string
    period_end: string
    subscription_id: string
  }
  last_transaction: {
    id: string
    status: string
    contact: {
      id: string
      email: string
      name: string
    }
    payment: {
      method: string | null
      total: number
      currency: string
    }
  }
}

export interface GuruTransactionWebhook {
  api_token: string
  webhook_type: string
  id: string
  status: string
  contact: {
    id: string
    email: string
    name: string
  }
  payment: {
    method: string | null
    total: number
    currency: string
  }
  subscription?: {
    id: string
    last_status: string
    name: string
  }
  product: {
    id: string
    name: string
    type: string
    offer?: { id: string; name: string }
  }
}

// ─── Idempotency ───

export async function isWebhookProcessed(
  supabase: SupabaseClient,
  guruId: string,
  statusReceived: string
): Promise<boolean> {
  const { data } = await supabase
    .from("guru_webhook_logs")
    .select("id")
    .eq("guru_id", guruId)
    .eq("status_received", statusReceived)
    .limit(1)
    .maybeSingle()

  return !!data
}

export async function logWebhook(
  supabase: SupabaseClient,
  webhookType: string,
  guruId: string,
  statusReceived: string,
  rawPayload: Record<string, unknown>
): Promise<void> {
  await supabase.from("guru_webhook_logs").upsert(
    {
      webhook_type: webhookType,
      guru_id: guruId,
      status_received: statusReceived,
      raw_payload: rawPayload,
    },
    { onConflict: "guru_id,status_received", ignoreDuplicates: true }
  )
}

// ─── User resolution ───

export async function resolveUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ userId: string; currentPlano: string | null } | null> {
  const { data: authData, error } = await supabase.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  })

  if (error || !authData?.users) return null

  const match = authData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )
  if (!match) return null

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plano")
    .eq("id", match.id)
    .single()

  return { userId: match.id, currentPlano: profile?.plano ?? null }
}

export async function resolveUserByGuruSubId(
  supabase: SupabaseClient,
  guruSubscriptionId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("guru_subscription_id", guruSubscriptionId)
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}

// ─── Subscription upsert ───

interface UpsertData {
  userId: string
  guruSubscriptionId: string
  guruOfferId: string
  plano: PlanoId
  billingCycle: BillingCycle
  status: SubscriptionStatus
  paymentMethod?: string
  currentCycle?: number
  cycleStartDate?: string | null
  cycleEndDate?: string | null
  nextCycleAt?: string | null
  pixExpiresAt?: string | null
}

export async function upsertSubscription(
  supabase: SupabaseClient,
  data: UpsertData
): Promise<void> {
  const profileType = data.plano === "profissional" ? "builder" : "owner"

  const updatePayload: Record<string, unknown> = {
    guru_subscription_id: data.guruSubscriptionId,
    guru_offer_id: data.guruOfferId,
    plano: data.plano,
    billing_cycle: data.billingCycle,
    status: data.status,
    profile_type: profileType,
    payment_method: data.paymentMethod ?? null,
    current_cycle: data.currentCycle ?? 0,
    cycle_start_date: data.cycleStartDate ?? null,
    cycle_end_date: data.cycleEndDate ?? null,
    next_cycle_at: data.nextCycleAt ?? null,
    updated_at: new Date().toISOString(),
  }

  if (data.pixExpiresAt) {
    updatePayload.pix_expires_at = data.pixExpiresAt
  }

  if (isActiveStatus(data.status)) {
    updatePayload.overdue_since = null
    updatePayload.cancelled_at = null
    if (!data.pixExpiresAt) {
      updatePayload.plano_expira_em = null
    }
    if (data.status === "active") {
      updatePayload.converted_at = new Date().toISOString()
    }
  }

  if (data.status === "overdue") {
    updatePayload.overdue_since = new Date().toISOString()
  }

  if (data.status === "cancelled") {
    updatePayload.cancelled_at = new Date().toISOString()
    updatePayload.profile_type = "owner"
    updatePayload.plano = "essencial"
  }

  if (data.status === "expired" || data.status === "inactive") {
    updatePayload.profile_type = "owner"
    updatePayload.plano = "essencial"
  }

  await supabase
    .from("user_profiles")
    .update(updatePayload)
    .eq("id", data.userId)
}

// ─── Full webhook handlers ───

interface WebhookResult {
  status: string
  userId?: string
  plano?: string
  subscriptionStatus?: string
  error?: string
  httpStatus: number
}

export async function handleSubscriptionWebhook(
  supabase: SupabaseClient,
  body: GuruSubscriptionWebhook
): Promise<WebhookResult> {
  const guruSubId = body.id
  const statusReceived = body.last_status
  const rawPayload = body as unknown as Record<string, unknown>

  const alreadyProcessed = await isWebhookProcessed(supabase, guruSubId, statusReceived)
  if (alreadyProcessed) {
    return { status: "already_processed", httpStatus: 200 }
  }

  const internalStatus = mapGuruStatusToInternal(statusReceived)
  const offerId = body.product?.offer?.id || ""
  const offer = getOfferByGuruId(offerId)
  const plano: PlanoId = offer?.plano ?? "essencial"
  const cycle: BillingCycle = offer?.cycle ?? "monthly"

  const subscriberEmail =
    body.subscriber?.email || body.last_transaction?.contact?.email || null

  if (!subscriberEmail) {
    await logWebhook(supabase, "subscription", guruSubId, statusReceived, rawPayload)
    return { status: "no_email", httpStatus: 200 }
  }

  let userId = await resolveUserByGuruSubId(supabase, guruSubId)
  if (!userId) {
    const resolved = await resolveUserByEmail(supabase, subscriberEmail)
    userId = resolved?.userId ?? null
  }

  if (!userId) {
    console.error(
      `[Guru Webhook] Cannot resolve user for subscription ${guruSubId} (email: ${subscriberEmail})`
    )
    await logWebhook(supabase, "subscription", guruSubId, statusReceived, rawPayload)
    return { status: "user_not_found", error: subscriberEmail, httpStatus: 200 }
  }

  await upsertSubscription(supabase, {
    userId,
    guruSubscriptionId: guruSubId,
    guruOfferId: offerId,
    plano,
    billingCycle: cycle,
    status: internalStatus,
    paymentMethod: body.payment_method ?? "credit_card",
    currentCycle: body.current_invoice?.cycle ?? body.charged_times ?? 0,
    cycleStartDate: body.dates?.cycle_start_date,
    cycleEndDate: body.dates?.cycle_end_date,
    nextCycleAt: body.dates?.next_cycle_at,
  })

  await logWebhook(supabase, "subscription", guruSubId, statusReceived, rawPayload)

  return {
    status: "processed",
    userId,
    plano,
    subscriptionStatus: internalStatus,
    httpStatus: 200,
  }
}

export async function handleTransactionWebhook(
  supabase: SupabaseClient,
  body: GuruTransactionWebhook
): Promise<WebhookResult> {
  const txId = body.id
  const statusReceived = body.status
  const rawPayload = body as unknown as Record<string, unknown>

  const alreadyProcessed = await isWebhookProcessed(supabase, txId, statusReceived)
  if (alreadyProcessed) {
    return { status: "already_processed", httpStatus: 200 }
  }

  const approvedStatuses = ["approved", "paid", "confirmed", "active"]
  if (!approvedStatuses.includes(statusReceived.toLowerCase())) {
    await logWebhook(supabase, "transaction", txId, statusReceived, rawPayload)
    return { status: "logged", httpStatus: 200 }
  }

  const offerId = body.product?.offer?.id || ""
  const offer = getOfferByGuruId(offerId)
  const subscriberEmail = body.contact?.email || null

  if (!subscriberEmail) {
    await logWebhook(supabase, "transaction", txId, statusReceived, rawPayload)
    return { status: "no_email", httpStatus: 200 }
  }

  const resolved = await resolveUserByEmail(supabase, subscriberEmail)
  if (!resolved) {
    console.error(
      `[Guru Webhook] Cannot resolve user for transaction ${txId} (email: ${subscriberEmail})`
    )
    await logWebhook(supabase, "transaction", txId, statusReceived, rawPayload)
    return { status: "user_not_found", error: subscriberEmail, httpStatus: 200 }
  }

  const plano: PlanoId = offer?.plano ?? "essencial"
  const cycle: BillingCycle = offer?.cycle ?? "annual"
  const isPix = (body.payment?.method || "").toLowerCase().includes("pix")

  const pixExpiresAt = isPix
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    : null

  await upsertSubscription(supabase, {
    userId: resolved.userId,
    guruSubscriptionId: body.subscription?.id || txId,
    guruOfferId: offerId,
    plano,
    billingCycle: cycle,
    status: "active",
    paymentMethod: isPix ? "pix" : "credit_card",
    pixExpiresAt,
  })

  await logWebhook(supabase, "transaction", txId, statusReceived, rawPayload)

  return {
    status: "processed",
    userId: resolved.userId,
    plano,
    subscriptionStatus: "active",
    httpStatus: 200,
  }
}
