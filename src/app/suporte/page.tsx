import type { Metadata } from "next"
import { Mail } from "lucide-react"
import LegalLayout from "@/components/custom/legal-layout"

export const metadata: Metadata = {
  title: "Suporte — Obreasy",
  description: "Entre em contato com o suporte do Obreasy.",
}

const pCls = "text-sm sm:text-base leading-relaxed text-gray-300 mb-3"

export default function SuportePage() {
  return (
    <LegalLayout title="Suporte" lastUpdated="23/06/2026" icon="support">
      <p className={pCls}>
        Precisa de ajuda com o Obreasy? Nossa equipe está pronta para te atender.
      </p>
      <p className={pCls}>
        Para dúvidas sobre o app, planos, conta ou funcionalidades, entre em contato pelo e-mail:
      </p>

      <a
        href="mailto:suporte@obreasy.com.br"
        className="mt-4 flex items-center gap-3 rounded-xl border border-[#7eaaee]/30 bg-[#0B3064]/30 px-5 py-4 text-white transition-colors hover:border-[#7eaaee]/50 hover:bg-[#0B3064]/50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7eaaee]/15">
          <Mail className="h-5 w-5 text-[#7eaaee]" />
        </div>
        <div>
          <p className="text-xs text-white/60">E-mail de suporte</p>
          <p className="text-base font-semibold text-[#7eaaee] sm:text-lg">suporte@obreasy.com.br</p>
        </div>
      </a>

      <p className={`${pCls} mt-6 mb-0`}>
        Respondemos o mais rápido possível em dias úteis. Inclua o e-mail da sua conta para agilizar o atendimento.
      </p>
    </LegalLayout>
  )
}
