import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { email, telefone, mensagem, assunto, tipo } = await req.json()

    if (!email || !mensagem) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 })
    }

    const subjectLabel = tipo
      ? `${tipo} - ${assunto || "Sem assunto"} - ${email}`
      : `Solicitação de suporte - ${email}`

    const { error } = await resend.emails.send({
      from: "OBREASY <noreply@obreasy.com.br>",
      to: "giovanni@lasy.ai",
      replyTo: email,
      subject: subjectLabel,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0B3064;">${tipo ? `Consulta: ${tipo}` : "Nova solicitação de suporte"}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #555; font-weight: bold; width: 120px;">E-mail:</td>
              <td style="padding: 8px 0; color: #111;">${email}</td>
            </tr>
            ${telefone ? `
            <tr>
              <td style="padding: 8px 0; color: #555; font-weight: bold;">Telefone:</td>
              <td style="padding: 8px 0; color: #111;">${telefone}</td>
            </tr>` : ""}
            ${assunto ? `
            <tr>
              <td style="padding: 8px 0; color: #555; font-weight: bold;">Assunto:</td>
              <td style="padding: 8px 0; color: #111;">${assunto}</td>
            </tr>` : ""}
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f4f4f4; border-radius: 8px;">
            <p style="margin: 0; color: #555; font-weight: bold;">Descrição:</p>
            <p style="margin: 8px 0 0; color: #111; white-space: pre-wrap;">${mensagem}</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("[API /suporte] Resend error:", error)
      return NextResponse.json({ error: "Falha ao enviar e-mail." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[API /suporte] Unexpected error:", err)
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 })
  }
}
