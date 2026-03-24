"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Clock, Zap, Rocket, AlertTriangle } from "lucide-react"
import { getTrialStatus, getTrialDiasRestantes, type TrialStatus } from "@/lib/plan"

export default function TrialBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<TrialStatus>("none")
  const [diasRestantes, setDiasRestantes] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    ;(async () => {
      try {
        const { supabase } = await import("@/lib/supabase")
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Sempre buscar plano do Supabase — fonte de verdade
        const { data } = await supabase
          .from("user_profiles")
          .select("plano_expira_em, plano")
          .eq("id", user.id)
          .single()

        // Plano pago ativo: limpar cache e não exibir nada
        if (data?.plano === "profissional" || data?.plano === "essencial") {
          localStorage.removeItem("trialExpiraEm")
          setStatus("none")
          return
        }

        // Trial: usar data do banco ou fallback para created_at + 7 dias
        let expira: string | null = data?.plano_expira_em ?? null
        if (!expira) {
          const trialFim = new Date(user.created_at)
          trialFim.setDate(trialFim.getDate() + 7)
          expira = trialFim.toISOString()
        }

        // Atualizar cache local com valor atual do banco
        localStorage.setItem("trialExpiraEm", expira)

        setStatus(getTrialStatus(expira))
        setDiasRestantes(getTrialDiasRestantes(expira))
      } catch {}
    })()
  }, [])

  if (!mounted) return null
  if (status === "none") return null
  if (status !== "expired" && dismissed) return null

  // Na página de planos, nunca bloquear — o usuário já está no lugar certo
  if (pathname === "/dashboard/plano") return null

  // Tela de bloqueio quando trial expirou
  if (status === "expired") {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-[#13151a] border border-white/[0.1] rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/15 rounded-full mb-5">
            <Clock className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Período de teste encerrado</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Seu teste gratuito de 7 dias chegou ao fim. Escolha um plano para continuar usando o Obreasy sem perder seus dados.
          </p>
          <button
            onClick={() => router.push("/dashboard/plano")}
            className="w-full bg-[#0B3064] hover:bg-[#082551] text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Ver planos e assinar
          </button>
        </div>
      </div>
    )
  }

  const isUrgent = status === "warning1"
  const isWarning = status === "warning2"
  const isOk = status === "ok"

  const mensagem = isUrgent
    ? "Seu teste termina amanhã!"
    : isWarning
    ? "Seu teste termina em 2 dias."
    : `${diasRestantes} dias restantes no seu teste gratuito.`

  if (isUrgent || isWarning) {
    return (
      <div className={`w-full ${isUrgent ? "bg-gradient-to-r from-red-950/90 via-red-900/80 to-red-950/90 border-red-500/30" : "bg-gradient-to-r from-orange-950/90 via-orange-900/80 to-orange-950/90 border-orange-500/30"} border-b px-3 py-2.5`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isUrgent ? "bg-red-500/20" : "bg-orange-500/20"}`}>
              <AlertTriangle className={`w-3.5 h-3.5 ${isUrgent ? "text-red-400" : "text-orange-400"}`} />
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className={`text-xs font-semibold ${isUrgent ? "text-red-200" : "text-orange-200"} leading-tight truncate`}>{mensagem}</p>
              <p className={`text-[10px] ${isUrgent ? "text-red-400/70" : "text-orange-400/70"} leading-tight hidden sm:block`}>
                Assine agora e continue sem interrupções.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => router.push("/dashboard/plano")}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                isUrgent
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                  : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30"
              }`}
            >
              <Zap className="w-2.5 h-2.5" />
              Garantir acesso
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Status "ok" — informativo, estilizado
  return (
    <div className="w-full bg-gradient-to-r from-[#0B3064]/40 via-[#0d3d80]/30 to-[#0B3064]/40 border-b border-blue-500/15 px-3 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0B3064]/15 flex items-center justify-center">
            <Rocket className="w-3 h-3 text-[#7eaaee]" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <span className="text-[11px] sm:text-xs text-blue-200/80 font-medium truncate block">{mensagem}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => router.push("/dashboard/plano")}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-[#0B3064]/15 hover:bg-[#0B3064]/25 text-[#7eaaee] border border-[#0B3064]/30 transition-all"
          >
            <Zap className="w-2.5 h-2.5" />
            Garantir acesso
          </button>
        </div>
      </div>
    </div>
  )
}
