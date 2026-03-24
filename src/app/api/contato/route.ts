import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { nome, email, telefone, mensagem } = await req.json()

    if (!nome || !email || !mensagem) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 })
    }

    const { error } = await resend.emails.send({
      from: "OBREASY <noreply@obreasy.com.br>",
      to: "contato@obreasy.com.br",
      replyTo: email,
      subject: `Contato pelo site - ${nome}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0B3064;">Nova mensagem de contato</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #555; font-weight: bold; width: 120px;">Nome:</td>
              <td style="padding: 8px 0; color: #111;">${nome}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #555; font-weight: bold;">E-mail:</td>
              <td style="padding: 8px 0; color: #111;">${email}</td>
            </tr>
            ${telefone ? `
            <tr>
              <td style="padding: 8px 0; color: #555; font-weight: bold;">Telefone:</td>
              <td style="padding: 8px 0; color: #111;">${telefone}</td>
            </tr>` : ""}
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f4f4f4; border-radius: 8px;">
            <p style="margin: 0; color: #555; font-weight: bold;">Mensagem:</p>
            <p style="margin: 8px 0 0; color: #111; white-space: pre-wrap;">${mensagem}</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("[API /contato] Resend error:", error)
      return NextResponse.json({ error: "Falha ao enviar e-mail." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[API /contato] Unexpected error:", err)
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 })
  }
}
