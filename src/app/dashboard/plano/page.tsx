"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  LayoutGrid, CheckCircle2, Zap, Building2, Crown,
  CreditCard, QrCode, ExternalLink, Loader2, AlertTriangle,
} from "lucide-react"
import { PLANOS, type PlanoTipo } from "@/lib/plan"
import { GURU_OFFERS, getOffer, getGracePeriodStatus, type GracePeriodStatus } from "@/lib/guru-plans"
import { trackEvent, recordSubscriptionChange, updateLastActive } from "@/lib/track-event"

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const fmtMensal = (anual: number) =>
  fmt(parseFloat((anual / 12).toFixed(2)))

type Cycle = "monthly" | "annual"

function PlanoPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [plano, setPlano] = useState<PlanoTipo>("essencial")
  const [status, setStatus] = useState<string>("trial")
  const [billingCycle, setBillingCycle] = useState<string | null>(null)
  const [graceStatus, setGraceStatus] = useState<GracePeriodStatus>("ok")
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")

  // Cycle & payment toggles
  const [selectedCycle, setSelectedCycle] = useState<Cycle>("monthly")
  const [pixSelected, setPixSelected] = useState(false)

  const loadProfile = useCallback(async () => {
    const { supabase } = await import("@/lib/supabase")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/"); return null }

    setUserEmail(user.email || "")
    setUserId(user.id)

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("profile_type, plano, status, billing_cycle, cycle_end_date, overdue_since, pix_expires_at, first_name, last_name")
      .eq("id", user.id)
      .single()

    if (!profile) return null

    setUserName([profile.first_name, profile.last_name].filter(Boolean).join(" "))

    const currentPlano: PlanoTipo =
      profile.profile_type === "builder" ? "profissional" :
      profile.profile_type === "owner" ? "essencial" :
      (profile.plano as PlanoTipo) || "essencial"

    setPlano(currentPlano)
    setStatus(profile.status || "trial")
    setBillingCycle(profile.billing_cycle as string | null)

    if (profile.status === "overdue" || profile.status === "cancelled" || profile.status === "expired") {
      setGraceStatus(getGracePeriodStatus(
        profile.cycle_end_date as string | null,
        profile.overdue_since as string | null,
      ))
    } else {
      setGraceStatus("ok")
    }

    return profile
  }, [router])

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) { router.push("/"); return }

    loadProfile().then(() => setLoading(false))
  }, [router, loadProfile])

  // Poll after checkout redirect
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      const profile = await loadProfile()
      if (profile?.status === "active") {
        setPolling(false)
        clearInterval(interval)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [polling, loadProfile])

  const handleAssinar = (targetPlano: "essencial" | "profissional", cycle: Cycle) => {
    const offer = getOffer(targetPlano, cycle)
    if (!offer) return

    const params = new URLSearchParams()
    if (userEmail) params.set("email", userEmail)
    if (userName) params.set("name", userName)

    const url = `${offer.guruCheckoutUrl}${params.toString() ? "?" + params.toString() : ""}`

    trackEvent("subscription_started", { plano: targetPlano, cycle }).catch(() => {})
    updateLastActive().catch(() => {})

    window.open(url, "_blank")
    setPolling(true)
  }

  const isActive = status === "active"
  const isTrial = status === "trial"
  const isOverdue = graceStatus !== "ok"
  const isProfissional = plano === "profissional"

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3064] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-4 pb-10 sm:px-6">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <LayoutGrid className="w-3.5 h-3.5 text-[#7eaaee]" />
          </div>
          <h1 className="text-sm font-bold text-white">Meu Plano</h1>
        </div>

        {/* Polling indicator */}
        {polling && (
          <div className="flex items-center gap-2 bg-[#0B3064]/15 border border-[#0B3064]/30 rounded-xl p-3">
            <Loader2 className="w-4 h-4 text-[#7eaaee] animate-spin" />
            <p className="text-xs text-[#7eaaee]">Aguardando confirmação do pagamento...</p>
          </div>
        )}

        {/* Overdue warning */}
        {isOverdue && graceStatus !== "blocked" && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-200 font-semibold">Pagamento pendente</p>
              <p className="text-[10px] text-red-300/70 mt-0.5">
                Regularize seu pagamento para manter o acesso. O app é liberado em até 15 minutos após o pagamento.
              </p>
            </div>
          </div>
        )}

        {/* Current plan card */}
        <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-gray-400">Plano atual</p>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isProfissional
                ? "bg-[#0B3064]/20 text-[#7eaaee] border border-[#0B3064]/40"
                : "bg-white/[0.06] text-gray-300 border border-white/[0.08]"
            }`}>
              {isProfissional ? "Profissional" : "Essencial"}
            </span>
          </div>

          <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06]">
            {[
              {
                label: "Valor",
                value: fmt(PLANOS[plano === "profissional" ? "profissional" : "essencial"].preco),
                sub: "/mês",
              },
              {
                label: "Obras",
                value: PLANOS[plano === "profissional" ? "profissional" : "essencial"].limiteObras === Infinity ? "∞" : "1",
                sub: null,
              },
              {
                label: "Status",
                value: null,
                custom: (
                  <div className="flex items-center justify-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-emerald-400 animate-pulse" :
                      isOverdue ? "bg-red-400 animate-pulse" :
                      isTrial ? "bg-blue-400 animate-pulse" :
                      "bg-gray-500"
                    }`} />
                    <span className={`text-xs font-semibold ${
                      isActive ? "text-emerald-400" :
                      isOverdue ? "text-red-400" :
                      isTrial ? "text-blue-400" :
                      "text-gray-400"
                    }`}>
                      {isActive ? "Ativo" :
                       isOverdue ? "Pendente" :
                       isTrial ? "Trial" :
                       status === "cancelled" ? "Cancelado" : "Inativo"}
                    </span>
                  </div>
                ),
              },
            ].map(({ label, value, sub, custom }) => (
              <div key={label} className="py-3 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">{label}</p>
                {custom ?? (
                  <p className="text-sm font-bold text-white leading-tight">
                    {value}
                    {sub && <span className="text-[10px] text-gray-500 font-normal">{sub}</span>}
                  </p>
                )}
              </div>
            ))}
          </div>

          {billingCycle && isActive && (
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-[10px] text-gray-500">
                Ciclo: <span className="text-gray-300 font-medium">{billingCycle === "annual" ? "Anual" : "Mensal"}</span>
              </p>
            </div>
          )}
        </div>

        {/* ─── Plan selection (show if trial, overdue, or wants to change) ─── */}
        {(!isActive || isTrial || isOverdue) && (
          <>
            {/* Cycle toggle */}
            <div className="flex items-center justify-center gap-1 bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-1">
              <button
                onClick={() => { setSelectedCycle("monthly"); setPixSelected(false) }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedCycle === "monthly"
                    ? "bg-[#0B3064] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setSelectedCycle("annual")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                  selectedCycle === "annual"
                    ? "bg-[#0B3064] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Anual
                <span className="ml-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                  -15%
                </span>
              </button>
            </div>

            {/* Pix toggle for annual */}
            {selectedCycle === "annual" && (
              <div className="flex items-center justify-center gap-1 bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-1">
                <button
                  onClick={() => setPixSelected(false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    !pixSelected
                      ? "bg-white/[0.08] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Cartão
                  <span className="text-[9px] text-gray-500 font-normal">(renovação auto.)</span>
                </button>
                <button
                  onClick={() => setPixSelected(true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    pixSelected
                      ? "bg-white/[0.08] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Pix
                  <span className="text-[9px] text-gray-500 font-normal">(pagamento único)</span>
                </button>
              </div>
            )}

            {/* Plan cards */}
            <div className="grid grid-cols-1 gap-3">
              {(["essencial", "profissional"] as const).map((p) => {
                const info = PLANOS[p]
                const price = selectedCycle === "annual" ? info.precoAnual : info.preco
                const monthlyEquiv = selectedCycle === "annual" ? fmtMensal(info.precoAnual) : null
                const isCurrentPlan = plano === p && isActive
                const isPro = p === "profissional"

                return (
                  <div
                    key={p}
                    className={`bg-[#1f2228]/80 border rounded-xl overflow-hidden ${
                      isPro ? "border-[#0B3064]/40" : "border-white/[0.08]"
                    }`}
                  >
                    {isPro && (
                      <div className="bg-[#0B3064]/20 px-3 py-1.5 flex items-center gap-1.5">
                        <Crown className="w-3 h-3 text-[#7eaaee]" />
                        <span className="text-[10px] font-bold text-[#7eaaee] uppercase tracking-wider">Mais popular</span>
                      </div>
                    )}

                    <div className="px-3 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-bold text-white">{info.nome}</h3>
                          <p className="text-[10px] text-gray-500">{info.descricao}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">{fmt(price)}</p>
                          <p className="text-[10px] text-gray-500">
                            {selectedCycle === "annual" ? "/ano" : "/mês"}
                          </p>
                          {monthlyEquiv && (
                            <p className="text-[10px] text-emerald-400">{monthlyEquiv}/mês</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        {[
                          `${info.limiteObras === Infinity ? "Obras ilimitadas" : "1 obra"}`,
                          "Controle de despesas",
                          "Relatórios",
                          ...(isPro ? [
                            "Visão consolidada",
                            "Controle de recebimentos",
                            "Gestão avançada",
                          ] : []),
                        ].map((f) => (
                          <div key={f} className="flex items-center gap-2">
                            <CheckCircle2 className={`w-3 h-3 flex-shrink-0 ${isPro ? "text-[#7eaaee]" : "text-gray-500"}`} />
                            <span className="text-[11px] text-gray-300">{f}</span>
                          </div>
                        ))}
                      </div>

                      {isCurrentPlan ? (
                        <div className="flex items-center justify-center gap-1.5 h-10 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Plano atual
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAssinar(p, selectedCycle)}
                          className={`w-full flex items-center justify-center gap-2 h-10 text-xs font-semibold rounded-xl transition-all active:scale-95 ${
                            isPro
                              ? "bg-[#0B3064] hover:bg-[#082551] text-white"
                              : "bg-white/[0.06] hover:bg-white/[0.10] text-gray-200 border border-white/[0.08]"
                          }`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Assinar {info.nome} — {fmt(price)}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 bg-[#1f2228]/60 border border-white/[0.06] rounded-xl p-3">
              <Zap className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  {selectedCycle === "monthly"
                    ? "Cobrança mensal recorrente via cartão de crédito. Cancele quando quiser."
                    : pixSelected
                      ? "Pagamento único anual via Pix. Sem renovação automática."
                      : "Cobrança anual recorrente via cartão de crédito com 15% de desconto."}
                </p>
                <p className="text-[10px] text-gray-600">
                  Sem permanência mínima. Seus dados nunca são excluídos.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Active plan — manage section */}
        {isActive && !isTrial && !isOverdue && (
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-3 py-3 border-b border-white/[0.06]">
              <p className="text-xs font-semibold text-gray-400">Gerenciar assinatura</p>
            </div>
            <div className="px-3 py-3 space-y-2">
              {!isProfissional && (
                <button
                  onClick={() => handleAssinar("profissional", billingCycle === "annual" ? "annual" : "monthly")}
                  className="w-full flex items-center justify-center gap-2 h-10 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Upgrade para Profissional
                </button>
              )}
              <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                Para alterar ciclo, forma de pagamento ou cancelar, entre em contato pelo{" "}
                <button onClick={() => router.push("/dashboard/suporte")} className="text-[#7eaaee] underline underline-offset-2">
                  suporte
                </button>.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function PlanoPage() {
  return (
    <Suspense>
      <PlanoPageInner />
    </Suspense>
  )
}
