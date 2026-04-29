import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { cancelGuruSubscription, GuruApiError } from "@/lib/guru-api"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim()

    if (!accessToken) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://blietvjzchjrzbmkitha.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })

    const { data: userResp, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userResp?.user) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 })
    }

    const userId = userResp.user.id
    const body = await req.json().catch(() => ({})) as { comment?: string }
    const comment = (body?.comment || "").toString().slice(0, 500)

    const admin = getSupabaseAdmin()
    const { data: profile, error: profileErr } = await admin
      .from("user_profiles")
      .select("guru_subscription_id, status, cycle_end_date, plano_expira_em")
      .eq("id", userId)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    if (!profile.guru_subscription_id) {
      return NextResponse.json(
        { error: "Nenhuma assinatura ativa para cancelar" },
        { status: 400 }
      )
    }

    if (profile.status === "cancelled" || profile.status === "expired") {
      return NextResponse.json(
        { error: "Sua assinatura já está cancelada ou expirada" },
        { status: 400 }
      )
    }

    try {
      await cancelGuruSubscription(profile.guru_subscription_id, {
        cancelAtCycleEnd: true,
        comment,
      })
    } catch (err) {
      if (err instanceof GuruApiError) {
        console.error("[/api/plano/cancelar] Guru error:", err.httpStatus, err.code, err.message)
        if (err.httpStatus === 403) {
          return NextResponse.json(
            { error: "Esta assinatura não pode ser cancelada. Entre em contato com o suporte." },
            { status: 403 }
          )
        }
        return NextResponse.json(
          { error: "Não foi possível cancelar agora. Tente novamente em instantes." },
          { status: 502 }
        )
      }
      throw err
    }

    await admin
      .from("user_profiles")
      .update({ cancelled_at: new Date().toISOString() })
      .eq("id", userId)

    return NextResponse.json({
      ok: true,
      accessUntil: profile.cycle_end_date || profile.plano_expira_em || null,
    })
  } catch (err) {
    console.error("[/api/plano/cancelar] erro inesperado:", err)
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 })
  }
}
