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

    // Apaga dados relacionados antes de remover o usuário.
    // A maioria das tabelas já tem ON DELETE CASCADE para auth.users, mas
    // limpamos explicitamente para garantir a remoção (requisito Apple)
    // mesmo em tabelas onde o cascade não esteja confirmado.
    const relatedTables = [
      "diario_obra",
      "comprovantes_pagamentos",
      "recebimentos",
      "pagamentos",
      "despesas",
      "profissionais",
      "clientes",
      "alertas_orcamento",
      "alertas_prazo",
      "alertas_pagamento",
      "notificacoes",
      "user_events",
      "subscription_history",
      "obras",
      "user_profiles",
    ]

    for (const table of relatedTables) {
      const { error } = await admin.from(table).delete().eq("user_id", userId)
      if (error && error.code !== "42P01" && error.code !== "42703") {
        // 42P01 = tabela inexistente, 42703 = coluna inexistente — toleramos esses
        console.warn(`[/api/conta/excluir] aviso ao limpar ${table}:`, error.message)
      }
    }

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
