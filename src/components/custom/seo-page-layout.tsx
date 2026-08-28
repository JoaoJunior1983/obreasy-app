import Link from "next/link"
import { ReactNode } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface SeoPageLayoutProps {
  /** H1 da página. É o sinal mais forte de tema para o Google, então carrega o termo. */
  titulo: string
  /** Linha de apoio abaixo do H1, em linguagem de quem busca — não de quem vende. */
  subtitulo: string
  /** Rótulo curto acima do H1 (categoria do conteúdo). */
  chapeu: string
  children: ReactNode
}

/**
 * Casca das páginas de conteúdo que existem para busca orgânica.
 *
 * Diferente da home, estas páginas são Server Components: o texto precisa
 * chegar no HTML servido, não depois da hidratação. Nada aqui pode virar
 * "use client" sem custo direto de indexação.
 */
export default function SeoPageLayout({ titulo, subtitulo, chapeu, children }: SeoPageLayoutProps) {
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
          <Link
            href="/cadastro"
            className="rounded-lg bg-[#7eaaee] px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#0B3064] transition-colors hover:bg-white"
          >
            Testar grátis
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#7eaaee]">
          {chapeu}
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight text-white">
          {titulo}
        </h1>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-white/70">{subtitulo}</p>

        <div className="mt-10 space-y-10 text-[15px] sm:text-base leading-relaxed text-white/80">
          {children}
        </div>

        <aside className="mt-14 rounded-2xl border border-[#7eaaee]/25 bg-[#7eaaee]/[0.07] p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Faça o diário da sua obra pelo celular
          </h2>
          <p className="mt-3 text-white/75">
            O Obreasy registra o dia da obra com foto, guarda o histórico organizado por data e
            gera o relatório em PDF para enviar ao cliente. Teste sem custo.
          </p>
          <Link
            href="/cadastro"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7eaaee] px-5 py-3 text-sm font-semibold text-[#0B3064] transition-colors hover:bg-white"
          >
            Começar agora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </aside>
      </main>

      <footer className="border-t border-white/[0.06] mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
          <span>© {new Date().getFullYear()} Obreasy</span>
          <nav className="flex gap-4">
            <Link href="/suporte" className="hover:text-white transition-colors">Suporte</Link>
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
