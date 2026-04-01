import { Resend } from "resend"

interface EmailParams {
  email: string
  planName: string
  cycle: string
  subscriberName?: string | null
}

export async function sendPurchaseConfirmationEmail(
  params: EmailParams
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[Guru Email] RESEND_API_KEY not configured")
    return false
  }

  const resend = new Resend(apiKey)
  const { email, planName, cycle, subscriberName } = params
  const greeting = subscriberName ? `Olá, ${subscriberName}!` : "Olá!"
  const cycleLabel = cycle === "annual" ? "anual" : "mensal"

  try {
    const { error } = await resend.emails.send({
      from: "OBREASY <noreply@obreasy.com.br>",
      to: email,
      subject: `Assinatura confirmada — Obreasy ${planName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0a0a0f; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #ffffff; margin: 0 0 8px;">Bem-vindo ao Obreasy!</h1>
            <p style="font-size: 14px; color: #9ca3af; margin: 0;">Sua assinatura foi confirmada com sucesso.</p>
          </div>

          <div style="background: #1f2228; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #d1d5db; margin: 0 0 16px;">${greeting}</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Plano:</td>
                <td style="padding: 8px 0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Ciclo:</td>
                <td style="padding: 8px 0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">${cycleLabel}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://app.obreasy.com.br/dashboard"
               style="display: inline-block; background: #0B3064; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 10px; text-decoration: none;">
              Acessar o Obreasy
            </a>
          </div>

          <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
            Dúvidas? Responda este e-mail ou acesse nosso suporte.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error("[Guru Email] Resend error:", error)
      return false
    }
    return true
  } catch (err) {
    console.error("[Guru Email] Unexpected error:", err)
    return false
  }
}
