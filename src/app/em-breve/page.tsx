"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"

export default function EmBreve() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#141414] flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md w-full flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-[#0B3064]/20 border border-[#0B3064]/40 flex items-center justify-center">
          <Clock className="w-8 h-8 text-[#4A90D9]" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#F2F2F2]">Em breve</h1>
          <p className="text-[#999999] text-base sm:text-lg leading-relaxed">
            Estamos preparando algo incrível para você. Em breve o OBREASY estará disponível para novos cadastros.
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-white/20 text-[#F2F2F2] font-semibold text-sm hover:bg-white/[0.07] hover:border-white/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>
    </main>
  )
}
