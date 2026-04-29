import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-server"

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

    const admin = getSupabaseAdmin()
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId)

    if (deleteErr) {
      console.error("[/api/conta/excluir] erro ao deletar usuário:", deleteErr)
      return NextResponse.json(
        { error: "Não foi possível excluir a conta. Entre em contato com o suporte." },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/conta/excluir] erro inesperado:", err)
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 })
  }
}
