import Link from "next/link"
import { ReactNode } from "react"

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: ReactNode
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-[#0B3064]">OBREASY</Link>
          <nav className="flex gap-4 text-xs text-gray-600">
            <Link href="/termos" className="hover:text-[#0B3064]">Termos</Link>
            <Link href="/privacidade" className="hover:text-[#0B3064]">Privacidade</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: {lastUpdated}</p>
        <div className="prose prose-gray max-w-none">
          {children}
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Obreasy</span>
          <span>Contato: <a href="mailto:suporte@obreasy.com.br" className="hover:text-[#0B3064]">suporte@obreasy.com.br</a></span>
        </div>
      </footer>
    </div>
  )
}
