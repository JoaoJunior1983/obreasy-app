import Link from "next/link"
import { ReactNode } from "react"
import { ArrowLeft, FileText, Shield } from "lucide-react"

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  icon?: "terms" | "privacy"
  children: ReactNode
}

export default function LegalLayout({ title, lastUpdated, icon = "terms", children }: LegalLayoutProps) {
  const Icon = icon === "privacy" ? Shield : FileText

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B3064] via-[#0a0a0a] to-[#0a0a0a] text-white">
      <header className="sticky top-0 z-20 bg-[#0B3064]/60 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-[#7eaaee] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>OBREASY</span>
          </Link>
          <nav className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-white/70">
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#7eaaee]/15 border border-[#7eaaee]/30 flex items-center justify-center shadow-lg shadow-[#0B3064]/30">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#7eaaee]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] sm:text-xs text-white/70 mb-6 sm:mb-8">
          Última atualização: {lastUpdated}
        </div>

        <article className="rounded-2xl bg-[#1f2228]/60 backdrop-blur-sm border border-white/[0.08] shadow-2xl shadow-black/40 p-5 sm:p-8">
          {children}
        </article>

        <div className="mt-6 sm:mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3064] hover:bg-[#082551] border border-white/10 text-sm font-medium text-white transition-colors shadow-lg shadow-[#0B3064]/40"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao app
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] mt-12 sm:mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-6 text-xs text-white/50 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Obreasy</span>
          <span>
            Contato:{" "}
            <a href="mailto:suporte@obreasy.com.br" className="text-[#7eaaee] hover:text-white transition-colors">
              suporte@obreasy.com.br
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
