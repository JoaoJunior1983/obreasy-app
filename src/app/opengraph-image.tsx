import { ImageResponse } from "next/og"

export const alt = "Obreasy — Aplicativo de Controle e Gestão de Obras"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Antes não havia imagem de compartilhamento: link colado no WhatsApp ou no
// Instagram aparecia sem capa e sem título.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0a0f1c",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "10px",
            background: "#0B3064",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "48px" }}>
          <div
            style={{
              width: "76px",
              height: "76px",
              background: "#0B3064",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="46" height="46" viewBox="0 0 512 512" fill="none">
              <path d="M256 128L384 192V384L256 448L128 384V192L256 128Z" fill="#ffffff" />
              <path
                d="M256 192V384M192 224V352M320 224V352M160 256H352M160 320H352"
                stroke="#0B3064"
                strokeWidth="16"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: "44px", fontWeight: 900, color: "#ffffff", letterSpacing: "-1px" }}>
            OBREASY
          </span>
        </div>

        <div style={{ fontSize: "70px", fontWeight: 800, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-2px", display: "flex", flexDirection: "column" }}>
          <span>Controle sua obra</span>
          <span style={{ color: "#7eaaee" }}>sem planilhas confusas.</span>
        </div>

        <div style={{ fontSize: "30px", color: "#94a3b8", marginTop: "36px", display: "flex" }}>
          Orçamento, gastos, profissionais e diário da obra num só lugar
        </div>

        <div style={{ display: "flex", gap: "16px", marginTop: "48px" }}>
          {["iPhone", "Android", "Computador"].map((p) => (
            <div
              key={p}
              style={{
                display: "flex",
                border: "2px solid #1e3a63",
                borderRadius: "999px",
                padding: "10px 26px",
                fontSize: "24px",
                color: "#7eaaee",
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
