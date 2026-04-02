import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import {
  handleSubscriptionWebhook,
  handleTransactionWebhook,
  type GuruSubscriptionWebhook,
  type GuruTransactionWebhook,
} from "@/lib/guru-subscriptions"
import { isActiveStatus, mapGuruStatusToInternal } from "@/lib/guru-plans"
import { sendPurchaseConfirmationEmail } from "@/lib/guru-email"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const apiToken = body.api_token as string | undefined

    const expectedToken = process.env.GURU_API_TOKEN
    if (!apiToken || apiToken !== expectedToken) {
      console.error(`[Guru Webhook/tx] Token mismatch — received: ${apiToken?.slice(0, 8)}... | expected env set: ${!!expectedToken} | expected length: ${expectedToken?.length ?? 0}`)
      return NextResponse.json({ error: "Invalid api_token" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const webhookType = body.webhook_type as string

    // Guru sometimes sends subscription payloads to the transaction URL
    if (webhookType === "subscription") {
      const subBody = body as unknown as GuruSubscriptionWebhook
      const result = await handleSubscriptionWebhook(supabase, subBody)

      if (result.status === "processed" && result.userId) {
        const internalStatus = mapGuruStatusToInternal(subBody.last_status)
        const subscriberEmail =
          subBody.subscriber?.email || subBody.last_transaction?.contact?.email

        if (subscriberEmail && isActiveStatus(internalStatus)) {
          sendPurchaseConfirmationEmail({
            email: subscriberEmail,
            planName: result.plano === "profissional" ? "Profissional" : "Essencial",
            cycle: subBody.charged_every_days > 31 ? "annual" : "monthly",
            subscriberName: subBody.subscriber?.name,
          }).catch((e) => console.error("[Guru Webhook/tx] Email error:", e))
        }
      }

      return NextResponse.json(result, { status: result.httpStatus })
    }

    if (webhookType === "transaction") {
      const txBody = body as unknown as GuruTransactionWebhook
      const result = await handleTransactionWebhook(supabase, txBody)

      if (result.status === "processed" && result.userId) {
        const subscriberEmail = txBody.contact?.email
        if (subscriberEmail) {
          sendPurchaseConfirmationEmail({
            email: subscriberEmail,
            planName: result.plano === "profissional" ? "Profissional" : "Essencial",
            cycle: "annual",
            subscriberName: txBody.contact?.name,
          }).catch((e) => console.error("[Guru Webhook/tx] Email error:", e))
        }
      }

      return NextResponse.json(result, { status: result.httpStatus })
    }

    return NextResponse.json({ status: "unknown_type", type: webhookType }, { status: 200 })
  } catch (error) {
    console.error("[Guru Webhook] Transaction error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
