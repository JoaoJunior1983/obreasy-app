import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import {
  handleRevenueCatWebhook,
  type RevenueCatWebhookPayload,
} from "@/lib/revenuecat-subscriptions"

export async function POST(req: NextRequest) {
  try {
    const expectedAuth = process.env.REVENUECAT_WEBHOOK_AUTH
    const receivedAuth = req.headers.get("authorization") || ""
    const isValidAuth = !!expectedAuth && (receivedAuth === `Bearer ${expectedAuth}` || receivedAuth === expectedAuth)

    if (!isValidAuth) {
      console.error("[RevenueCat Webhook] Authorization header mismatch")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as RevenueCatWebhookPayload

    if (!body?.event?.id || !body?.event?.type) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const result = await handleRevenueCatWebhook(supabase, body)

    return NextResponse.json(result, { status: result.httpStatus })
  } catch (error) {
    console.error("[RevenueCat Webhook] error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
