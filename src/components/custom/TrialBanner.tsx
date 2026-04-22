"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Clock, Zap, Rocket, AlertTriangle, CreditCard } from "lucide-react"
import { getTrialStatus, getTrialDiasRestantes, type TrialStatus } from "@/lib/plan"
import {
  getGracePeriodStatus,
  type GracePeriodStatus,
} from "@/lib/guru-plans"
import { isAdminEmail } from "@/lib/admin"

type BannerState =
  | { type: "none" }
  | { type: "trial"; status: TrialStatus; diasRestantes: number }
  | { type: "overdue"; graceStatus: GracePeriodStatus }

export default function TrialBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<BannerState>({ type: "none" })
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    ;(async () => {
      try {
        const { supabase } = await import("@/lib/supabase")
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Admins (equipe Obreasy/Lasy) têm acesso full, sem bloqueio de trial/pagamento
        if (isAdminEmail(user.email)) {
          localStorage.removeItem("trialExpiraEm")
          setState({ type: "none" })
          return
        }

        const { data } = await supabase
          .from("user_profiles")
          .select("plano_expira_em, plano, status, cycle_end_date, overdue_since, pix_expires_at, payment_method")
          .eq("id", user.id)
          .single()

        if (!data) return

        // Check for overdue / blocked FIRST (highest priority)
        if (data.status === "overdue" || data.status === "cancelled" || data.status === "expired") {
          const grace = getGracePeriodStatus(
            data.cycle_end_date as string | null,
            data.overdue_since as string | null
          )
          if (grace !== "ok") {
            setState({ type: "overdue", graceStatus: grace })
            return
          }
        }

        // Check Pix annual expiration
        if (data.payment_method === "pix" && data.pix_expires_at) {
          const pixExpired = new Date(data.pix_expires_at as string) < new Date()
          if (pixExpired) {
            setState({ type: "overdue", graceStatus: "blocked" })
            return
          }
        }

        // Active paid plan — no banner
        if (
          data.status === "active" &&
          (data.plano === "profissional" || data.plano === "essencial")
        ) {
          localStorage.removeItem("trialExpiraEm")
          setState({ type: "none" })
          return
        }

        // Trial logic (existing behavior)
        let expira: string | null = data.plano_expira_em ?? null
        if (!expira && data.plano === "trial") {
          const trialFim = new Date(user.created_at)
          trialFim.setDate(trialFim.getDate() + 7)
          expira = trialFim.toISOString()
        }

        if (!expira) {
          setState({ type: "none" })
          return
        }

        localStorage.setItem("trialExpiraEm", expira)
        const trialStatus = getTrialStatus(expira)
        const diasRestantes = getTrialDiasRestantes(expira)

        if (trialStatus === "none") {
          setState({ type: "none" })
        } else {
          setState({ type: "trial", status: trialStatus, diasRestantes })
        }
      } catch {
        // silent
      }
    })()
  }, [])

  if (!mounted) return null
  if (state.type === "none") return null
  if (pathname === "/dashboard/plano") return null

  // ──── OVERDUE / BLOCKED ────

  if (state.type === "overdue") {
    const { graceStatus } = state

    // Full-screen block (4+ days overdue or Pix expired)
    if (graceStatus === "blocked") {
      return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#13151a] border border-white/[0.1] rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/15 rounded-full mb-5">
              <CreditCard className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Acesso bloqueado
            </h2>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Seu pagamento está pendente e o acesso ao Obreasy foi suspenso.
            </p>
            <p className="text-gray-500 text-xs mb-6 leading-relaxed">
              O app é liberado em até <strong className="text-gray-300">15 minutos</strong> após a confirmação do pagamento.
            </p>
            <button
              onClick={() => router.push("/dashboard/plano")}
              className="w-full bg-[#0B3064] hover:bg-[#082551] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Regularizar pagamento
            </button>
          </div>
        </div>
      )
    }

    // Progressive alert banners (days 1-3)
    const isDay3 = graceStatus === "overdue_day3"
    const isDay2 = graceStatus === "overdue_day2"

    const mensagem = isDay3
      ? "Último dia! Amanhã seu acesso será bloqueado por falta de pagamento."
      : isDay2
        ? "Pagamento pendente. Seu acesso será bloqueado em 1 dia."
        : "Seu pagamento está pendente. Regularize para continuar usando."

    const colorClass = isDay3
      ? "from-red-950/90 via-red-900/80 to-red-950/90 border-red-500/30"
      : isDay2
        ? "from-orange-950/90 via-orange-900/80 to-orange-950/90 border-orange-500/30"
        : "from-yellow-950/90 via-yellow-900/80 to-yellow-950/90 border-yellow-500/30"

    const textColor = isDay3
      ? "text-red-200"
      : isDay2
        ? "text-orange-200"
        : "text-yellow-200"

    const iconColor = isDay3
      ? "text-red-400"
      : isDay2
        ? "text-orange-400"
        : "text-yellow-400"

    const bgIcon = isDay3
      ? "bg-red-500/20"
      : isDay2
        ? "bg-orange-500/20"
        : "bg-yellow-500/20"

    const btnClass = isDay3
      ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30"
      : isDay2
        ? "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/30"
        : "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border-yellow-500/30"

    if (dismissed) return null

    return (
      <div className={`w-full bg-gradient-to-r ${colorClass} border-b px-3 py-2.5`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${bgIcon}`}>
              <AlertTriangle className={`w-3.5 h-3.5 ${iconColor}`} />
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className={`text-xs font-semibold ${textColor} leading-tight truncate`}>
                {mensagem}
              </p>
              {isDay3 && (
                <p className="text-[10px] text-red-400/70 leading-tight hidden sm:block">
                  O app é liberado em até 15 minutos após o pagamento.
                </p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => router.push("/dashboard/plano")}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${btnClass}`}
            >
              <CreditCard className="w-2.5 h-2.5" />
              Pagar agora
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ──── TRIAL (existing behavior) ────

  if (state.type === "trial") {
    const { status, diasRestantes } = state

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

    if (status !== "expired" && dismissed) return null

    const isUrgent = status === "warning1"
    const isWarning = status === "warning2"

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

    // Status "ok" — informativo
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

  return null
}
