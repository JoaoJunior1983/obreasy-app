import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import {
  handleSubscriptionWebhook,
  type GuruSubscriptionWebhook,
} from "@/lib/guru-subscriptions"
import { isActiveStatus, mapGuruStatusToInternal } from "@/lib/guru-plans"
import { sendPurchaseConfirmationEmail } from "@/lib/guru-email"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GuruSubscriptionWebhook

    const expectedToken = process.env.GURU_API_TOKEN
    if (!body.api_token || body.api_token !== expectedToken) {
      console.error(`[Guru Webhook] Token mismatch — received: ${body.api_token?.slice(0, 8)}... | expected env set: ${!!expectedToken} | expected length: ${expectedToken?.length ?? 0}`)
      return NextResponse.json({ error: "Invalid api_token" }, { status: 401 })
    }

    if (body.webhook_type !== "subscription") {
      return NextResponse.json({ error: "Invalid webhook_type" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const result = await handleSubscriptionWebhook(supabase, body)

    if (result.status === "processed" && result.userId) {
      const internalStatus = mapGuruStatusToInternal(body.last_status)
      const subscriberEmail =
        body.subscriber?.email || body.last_transaction?.contact?.email
      const subscriberName =
        body.subscriber?.name || body.last_transaction?.contact?.name

      if (subscriberEmail && isActiveStatus(internalStatus)) {
        sendPurchaseConfirmationEmail({
          email: subscriberEmail,
          planName: result.plano === "profissional" ? "Profissional" : "Essencial",
          cycle: body.charged_every_days > 31 ? "annual" : "monthly",
          subscriberName,
        }).catch((e) => console.error("[Guru Webhook] Email error:", e))
      }
    }

    return NextResponse.json(result, { status: result.httpStatus })
  } catch (error) {
    console.error("[Guru Webhook] Subscription error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
