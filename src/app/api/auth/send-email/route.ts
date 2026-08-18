import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { Resend } from "resend"

// Send Email Hook do Supabase Auth (Standard Webhooks).
// O SMTP do Resend não aceita API key restrita a envio (535), mas a API HTTP
// aceita — então o GoTrue delega o envio para cá em vez de falar SMTP.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://blietvjzchjrzbmkitha.supabase.co"

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secretEnv = process.env.SEND_EMAIL_HOOK_SECRET || ""
  const secretB64 = secretEnv.replace(/^v1,whsec_/, "").replace(/^whsec_/, "")
  if (!secretB64) return false

  const id = req.headers.get("webhook-id") || ""
  const timestamp = req.headers.get("webhook-timestamp") || ""
  const sigHeader = req.headers.get("webhook-signature") || ""
  if (!id || !timestamp || !sigHeader) return false

  const expected = createHmac("sha256", Buffer.from(secretB64, "base64"))
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest()

  // O header pode trazer várias assinaturas: "v1,BASE64 v1,BASE64"
  return sigHeader.split(" ").some(part => {
    const b64 = part.includes(",") ? part.split(",")[1] : part
    try {
      const got = Buffer.from(b64, "base64")
      return got.length === expected.length && timingSafeEqual(got, expected)
    } catch {
      return false
    }
  })
}

function layout(titulo: string, corpo: string, cta?: { url: string; label: string }) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0a;border-radius:16px">
  <div style="text-align:center;margin-bottom:24px"><span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">OBREASY</span></div>
  <h2 style="color:#ffffff;font-size:20px;margin:0 0 12px">${titulo}</h2>
  <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px">${corpo}</p>
  ${cta ? `<div style="text-align:center;margin:0 0 24px"><a href="${cta.url}" style="display:inline-block;background:#0B3064;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 32px;border-radius:12px">${cta.label}</a></div>` : ""}
  <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0">Se voc&ecirc; n&atilde;o pediu este e-mail, pode ignor&aacute;-lo com seguran&ccedil;a.</p>
</div>`
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!verifySignature(req, rawBody)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 })
  }

  const email: string | undefined = payload?.user?.email
  const data = payload?.email_data || {}
  const tipo: string = data.email_action_type || ""
  if (!email || !tipo) {
    return NextResponse.json({ error: "dados ausentes" }, { status: 400 })
  }

  const verifyUrl = (type: string, tokenHash: string, redirectTo: string) =>
    `${SUPABASE_URL}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(redirectTo || "https://obreasy.com.br")}`

  let subject = "Obreasy"
  let html = ""

  switch (tipo) {
    case "recovery":
      subject = "Redefina sua senha - Obreasy"
      html = layout(
        "Redefinir sua senha",
        "Recebemos um pedido para redefinir a senha da sua conta no Obreasy. Toque no bot&atilde;o abaixo para criar uma nova senha:",
        { url: verifyUrl("recovery", data.token_hash, data.redirect_to), label: "Criar nova senha" }
      )
      break
    case "signup":
      subject = "Confirme seu e-mail - Obreasy"
      html = layout(
        "Confirme seu e-mail",
        "Falta pouco! Toque no bot&atilde;o abaixo para confirmar seu cadastro no Obreasy:",
        { url: verifyUrl("signup", data.token_hash, data.redirect_to), label: "Confirmar cadastro" }
      )
      break
    case "magiclink":
      subject = "Seu link de acesso - Obreasy"
      html = layout(
        "Entrar no Obreasy",
        "Toque no bot&atilde;o abaixo para acessar sua conta:",
        { url: verifyUrl("magiclink", data.token_hash, data.redirect_to), label: "Entrar" }
      )
      break
    case "invite":
      subject = "Você foi convidado - Obreasy"
      html = layout(
        "Voc&ecirc; foi convidado",
        "Toque no bot&atilde;o abaixo para aceitar o convite e criar sua conta no Obreasy:",
        { url: verifyUrl("invite", data.token_hash, data.redirect_to), label: "Aceitar convite" }
      )
      break
    case "email_change_current":
    case "email_change_new":
    case "email_change":
      subject = "Confirme a troca de e-mail - Obreasy"
      html = layout(
        "Confirmar troca de e-mail",
        "Recebemos um pedido para alterar o e-mail da sua conta no Obreasy. Toque no bot&atilde;o abaixo para confirmar:",
        { url: verifyUrl("email_change", data.token_hash, data.redirect_to), label: "Confirmar troca" }
      )
      break
    case "reauthentication":
      subject = "Seu código de verificação - Obreasy"
      html = layout(
        "C&oacute;digo de verifica&ccedil;&atilde;o",
        `Use o c&oacute;digo abaixo para confirmar sua identidade:<br><br><span style="font-size:28px;font-weight:800;letter-spacing:6px;color:#ffffff">${data.token || ""}</span>`
      )
      break
    default:
      subject = "Notificação da sua conta - Obreasy"
      html = layout(
        "Notifica&ccedil;&atilde;o da sua conta",
        "Toque no bot&atilde;o abaixo para continuar:",
        data.token_hash ? { url: verifyUrl(tipo, data.token_hash, data.redirect_to), label: "Continuar" } : undefined
      )
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: "Obreasy <noreply@obreasy.com.br>",
    to: email,
    subject,
    html,
  })

  if (error) {
    console.error("[auth/send-email] Resend error:", error)
    return NextResponse.json({ error: "falha no envio" }, { status: 500 })
  }

  return NextResponse.json({})
}
