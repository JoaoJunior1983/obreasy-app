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
  const [selectedCycle, setSelectedCycle] = useState<Cycle>("annual")
  const [pixSelected, setPixSelected] = useState(false)

  const loadProfile = useCallback(async () => {
    const { supabase } = await import("@/lib/supabase")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return null }

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
    if (!isAuthenticated) { router.push("/login"); return }

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
      <div className="max-w-3xl mx-auto space-y-5">

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
                Regularize seu pagamento para manter o acesso.
              </p>
            </div>
          </div>
        )}

        {/* Current plan summary */}
        <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-gray-400">Plano atual</p>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isProfissional
                ? "bg-[#0B3064]/20 text-[#7eaaee] border border-[#0B3064]/40"
                : "bg-white/[0.06] text-gray-300 border border-white/[0.08]"
            }`}>
              {isProfissional ? "Profissional" : "Essencial"}
            </span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
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
            <div className="px-4 py-2.5 border-t border-white/[0.06]">
              <p className="text-[10px] text-gray-500">
                Ciclo: <span className="text-gray-300 font-medium">{billingCycle === "annual" ? "Anual" : "Mensal"}</span>
              </p>
            </div>
          )}
        </div>

        {/* ─── Plan selection ─── */}
        <>
          {/* Toggle Mensal / Anual */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-full p-1 border border-white/[0.08]" style={{ backgroundColor: "rgba(20,20,35,0.8)" }}>
                <button
                  onClick={() => { setSelectedCycle("monthly"); setPixSelected(false) }}
                  className={`px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    selectedCycle === "monthly"
                      ? "bg-[#0B3064] text-white shadow-lg shadow-[#0B3064]/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setSelectedCycle("annual")}
                  className={`px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    selectedCycle === "annual"
                      ? "bg-[#0B3064] text-white shadow-lg shadow-[#0B3064]/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center -mt-2">
              Economize até 15% no plano anual
            </p>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* ── Profissional (Construtor) — Highlighted ── */}
              <div
                className="rounded-2xl border-2 border-[#0B3064] flex flex-col overflow-hidden order-1"
                style={{ backgroundColor: "rgba(17,24,39,0.9)", boxShadow: "0 0 30px 4px rgba(11,48,100,0.25), 0 0 60px 8px rgba(11,48,100,0.1)" }}
              >
                <div className="bg-[#0B3064] text-center py-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Mais Popular</span>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-white mb-0.5">Profissional</h3>
                  <p className="text-[11px] text-gray-500 mb-4">Para construtores e múltiplas obras</p>

                  <div className="mb-1">
                    {selectedCycle === "monthly" ? (
                      <>
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#7eaaee]">{fmt(PLANOS.profissional.preco)}</span>
                        <span className="text-sm text-gray-500 ml-1">/mês</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#7eaaee]">{fmtMensal(PLANOS.profissional.precoAnual)}</span>
                        <span className="text-sm text-gray-500 ml-1">/mês</span>
                      </>
                    )}
                  </div>
                  {selectedCycle === "annual" && (
                    <p className="text-[11px] text-gray-500 mb-1">
                      cobrado <span className="text-white font-medium">{fmt(PLANOS.profissional.precoAnual)}</span>/ano
                    </p>
                  )}

                  <div className="flex items-center mt-3 mb-5">
                    <div className="bg-[#0B3064]/30 border border-[#0B3064]/50 rounded-lg px-3 py-1.5">
                      <span className="text-[11px] font-bold text-[#7eaaee]">Obras ilimitadas</span>
                    </div>
                  </div>

                  {plano === "profissional" && isActive ? (
                    <div className="flex items-center justify-center gap-1.5 h-11 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/20 mb-5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Plano atual
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAssinar("profissional", selectedCycle)}
                      className="w-full py-3 rounded-xl bg-[#0B3064] text-white font-semibold text-sm hover:bg-[#082551] transition-all active:scale-95 shadow-lg shadow-[#0B3064]/20 mb-5"
                    >
                      Assinar Agora
                    </button>
                  )}

                  <p className="text-[10px] font-bold text-[#7eaaee] uppercase tracking-widest mb-3">Tudo do Essencial +</p>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">PLATAFORMA</p>
                      {["Obras ilimitadas", "Controle financeiro completo", "Relatórios avançados em PDF", "Alertas de orçamento"].map((f) => (
                        <div key={f} className="flex items-center gap-2 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#7eaaee] flex-shrink-0" />
                          <span className="text-[12px] text-[#ccc]">{f}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">GESTÃO</p>
                      {["Visão consolidada de obras", "Controle de recebimentos", "Gestão de profissionais"].map((f) => (
                        <div key={f} className="flex items-center gap-2 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#7eaaee] flex-shrink-0" />
                          <span className="text-[12px] text-[#ccc]">{f}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">SUPORTE</p>
                      {["Prioritário", "Acesso beta features"].map((f) => (
                        <div key={f} className="flex items-center gap-2 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#7eaaee] flex-shrink-0" />
                          <span className="text-[12px] text-[#ccc]">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Essencial ── */}
              <div
                className="rounded-2xl border border-white/[0.08] flex flex-col overflow-hidden order-2"
                style={{ backgroundColor: "rgba(17,24,39,0.9)" }}
              >
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-white mb-0.5">Essencial</h3>
                  <p className="text-[11px] text-gray-500 mb-4">Perfeito para uma obra</p>

                  <div className="mb-1">
                    {selectedCycle === "monthly" ? (
                      <>
                        <span className="text-3xl sm:text-4xl font-extrabold text-white">{fmt(PLANOS.essencial.preco)}</span>
                        <span className="text-sm text-gray-500 ml-1">/mês</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl font-extrabold text-white">{fmtMensal(PLANOS.essencial.precoAnual)}</span>
                        <span className="text-sm text-gray-500 ml-1">/mês</span>
                      </>
                    )}
                  </div>
                  {selectedCycle === "annual" && (
                    <p className="text-[11px] text-gray-500 mb-1">
                      cobrado <span className="text-white font-medium">{fmt(PLANOS.essencial.precoAnual)}</span>/ano
                    </p>
                  )}

                  <div className="flex items-center mt-3 mb-5">
                    <div className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5">
                      <span className="text-[11px] font-bold text-[#ccc]">1 obra ativa</span>
                    </div>
                  </div>

                  {plano === "essencial" && isActive ? (
                    <div className="flex items-center justify-center gap-1.5 h-11 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/20 mb-5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Plano atual
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAssinar("essencial", selectedCycle)}
                      className="w-full py-3 rounded-xl border border-white/[0.12] text-white font-semibold text-sm hover:bg-white/[0.05] transition-all active:scale-95 mb-5"
                    >
                      Assinar Agora
                    </button>
                  )}

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">PLATAFORMA</p>
                      {["1 obra ativa", "Controle financeiro", "Relatórios em PDF", "Alertas de orçamento"].map((f) => (
                        <div key={f} className="flex items-center gap-2 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#555] flex-shrink-0" />
                          <span className="text-[12px] text-[#ccc]">{f}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">ACESSO</p>
                      <div className="flex items-center gap-2 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#555] flex-shrink-0" />
                        <span className="text-[12px] text-[#ccc]">Mobile e web</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">SUPORTE</p>
                      <div className="flex items-center gap-2 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#555] flex-shrink-0" />
                        <span className="text-[12px] text-[#ccc]">Email e chat</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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

          {/* Manage subscription note */}
          {isActive && !isTrial && !isOverdue && (
            <div className="flex items-start gap-2 bg-[#1f2228]/60 border border-white/[0.06] rounded-xl p-3">
              <Zap className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Para alterar ciclo, forma de pagamento ou cancelar, entre em contato pelo{" "}
                <button onClick={() => router.push("/dashboard/suporte")} className="text-[#7eaaee] underline underline-offset-2">
                  suporte
                </button>.
              </p>
            </div>
          )}
        </>

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
