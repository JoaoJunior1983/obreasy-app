"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  LayoutGrid, CheckCircle2, Zap, Building2, Crown,
  CreditCard, QrCode, ExternalLink, Loader2, AlertTriangle,
  Calendar, ArrowDownCircle, XCircle, ArrowRight, ArrowLeftRight,
} from "lucide-react"
import { PLANOS, type PlanoTipo } from "@/lib/plan"
import { GURU_OFFERS, getOffer, getGracePeriodStatus, type GracePeriodStatus } from "@/lib/guru-plans"
import { trackEvent, recordSubscriptionChange, updateLastActive } from "@/lib/track-event"
import { toast } from "sonner"

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
  const [cycleEndDate, setCycleEndDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")
  const [cancelModalStep, setCancelModalStep] = useState<null | "confirm" | "retention" | "done">(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancellationRequested, setCancellationRequested] = useState(false)

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
      .select("profile_type, plano, plano_expira_em, status, billing_cycle, cycle_end_date, overdue_since, pix_expires_at, first_name, last_name")
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
    // Fallback ordenado: cycle_end_date (assinatura) → plano_expira_em (trial) → pix_expires_at
    const dataAcesso =
      (profile.cycle_end_date as string | null) ||
      (profile.plano_expira_em as string | null) ||
      (profile.pix_expires_at as string | null) ||
      null
    setCycleEndDate(dataAcesso)

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

    // Restaurar estado de cancelamento solicitado (persistido localmente até webhook do Guru atualizar)
    try {
      if (localStorage.getItem("cancellationRequested") === "true") {
        setCancellationRequested(true)
      }
    } catch { /* ignore */ }
  }, [router, loadProfile])

  const formatarDataPtBr = (iso: string | null): string => {
    if (!iso) return "—"
    try {
      return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch {
      return "—"
    }
  }

  const planoPreco = (() => {
    const p = PLANOS[plano === "profissional" ? "profissional" : "essencial"]
    if (billingCycle === "annual") return { valor: p.precoAnual, sufixo: "/ano" }
    return { valor: p.preco, sufixo: "/mês" }
  })()

  const handleAbrirCancelamento = () => {
    setCancelModalStep("confirm")
    setCancelReason("")
  }

  const handleConfirmarCancelamento = async () => {
    setCancelLoading(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.")
        setCancelLoading(false)
        return
      }

      const res = await fetch("/api/plano/cancelar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ comment: cancelReason }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || "Falha ao cancelar assinatura")
      }

      try {
        localStorage.setItem("cancellationRequested", "true")
      } catch { /* ignore */ }
      setCancellationRequested(true)
      setCancelModalStep("done")
      trackEvent("plan_cancelled", { plano, billing_cycle: billingCycle, requested: true }).catch(() => {})
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Erro ao cancelar assinatura")
    } finally {
      setCancelLoading(false)
    }
  }

  const handleScrollPlanos = () => {
    if (typeof document === "undefined") return
    document.getElementById("planos-disponiveis")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

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
                value: fmt(planoPreco.valor),
                sub: planoPreco.sufixo,
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
                      cancellationRequested ? "bg-amber-400 animate-pulse" :
                      isActive ? "bg-emerald-400 animate-pulse" :
                      isOverdue ? "bg-red-400 animate-pulse" :
                      isTrial ? "bg-blue-400 animate-pulse" :
                      "bg-gray-500"
                    }`} />
                    <span className={`text-xs font-semibold ${
                      cancellationRequested ? "text-amber-400" :
                      isActive ? "text-emerald-400" :
                      isOverdue ? "text-red-400" :
                      isTrial ? "text-blue-400" :
                      "text-gray-400"
                    }`}>
                      {cancellationRequested ? "Cancelamento agendado" :
                       isActive ? "Ativo" :
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

          {/* Detalhes adicionais (ciclo, próxima cobrança, forma de pagamento) */}
          {(isActive || isTrial) && (
            <div className="px-4 py-2.5 border-t border-white/[0.06] space-y-1.5">
              {billingCycle && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3 h-3" />
                    Ciclo
                  </span>
                  <span className="text-gray-300 font-medium">
                    {billingCycle === "annual" ? "Anual" : "Mensal"}
                  </span>
                </div>
              )}
              {cycleEndDate && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {isTrial ? "Fim do trial" : cancellationRequested ? "Acesso até" : "Próxima cobrança"}
                  </span>
                  <span className="text-gray-300 font-medium">
                    {formatarDataPtBr(cycleEndDate)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" />
                  Forma de pagamento
                </span>
                <span className="text-gray-300 font-medium">
                  {isTrial ? "—" : "Cartão / Pix"}
                </span>
              </div>
            </div>
          )}

          {/* Mensagem após cancelamento */}
          {cancellationRequested && (
            <div className="px-4 py-2.5 border-t border-white/[0.06] bg-amber-500/5">
              <p className="text-[10px] text-amber-300/80 leading-relaxed">
                Assinatura cancelada. Seu acesso permanecerá ativo até{" "}
                <span className="font-semibold text-amber-300">{formatarDataPtBr(cycleEndDate)}</span>.
                Após essa data, sua conta retornará ao modo gratuito.
              </p>
            </div>
          )}

          {/* Ações de gestão */}
          {isActive && !isTrial && !isOverdue && !cancellationRequested && (
            <div className="px-4 py-2.5 border-t border-white/[0.06] flex gap-2">
              <button
                onClick={handleScrollPlanos}
                className="flex-1 h-8 text-[11px] font-medium text-gray-300 bg-white/[0.05] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] hover:border-[#0B3064]/40 transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeftRight className="w-3 h-3" />
                Alterar plano
              </button>
              <button
                onClick={handleAbrirCancelamento}
                className="h-8 px-3 text-[11px] font-medium text-gray-500 hover:text-red-400 transition-colors"
              >
                Cancelar assinatura
              </button>
            </div>
          )}
        </div>

        {/* ─── Plan selection ─── */}
        <>
          <div id="planos-disponiveis" className="pt-2">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1 text-center">
              Planos disponíveis
            </p>
          </div>

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

          {/* Manage subscription note (apenas para mudança de forma de pagamento) */}
          {isActive && !isTrial && !isOverdue && (
            <div className="flex items-start gap-2 bg-[#1f2228]/60 border border-white/[0.06] rounded-xl p-3">
              <Zap className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Para trocar a forma de pagamento ou alterar o cartão, entre em contato pelo{" "}
                <button onClick={() => router.push("/dashboard/suporte")} className="text-[#7eaaee] underline underline-offset-2">
                  suporte
                </button>.
              </p>
            </div>
          )}
        </>

      </div>

      {/* ── Modal de Cancelamento ─────────────────────────────── */}
      {cancelModalStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1f2228] border border-white/[0.1] rounded-2xl shadow-2xl max-w-md w-full p-5 animate-in zoom-in-95 duration-200">

            {cancelModalStep === "confirm" && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Cancelar assinatura?</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-1.5">
                  Tem certeza que deseja cancelar sua assinatura?
                </p>
                <p className="text-xs text-gray-500 leading-relaxed mb-5">
                  Você continuará com acesso a todos os recursos até{" "}
                  <span className="text-gray-300 font-semibold">{formatarDataPtBr(cycleEndDate)}</span>.
                  Após essa data, o app retornará ao modo gratuito.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCancelModalStep(null)}
                    className="flex-1 h-10 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-200 border border-white/[0.1] rounded-lg text-sm font-medium transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setCancelModalStep("retention")}
                    className="flex-1 h-10 bg-red-600/90 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}

            {cancelModalStep === "retention" && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0B3064]/20 border border-[#0B3064]/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-[#7eaaee]" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Antes de cancelar...</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Talvez uma destas opções funcione melhor para você:
                </p>

                <div className="space-y-2 mb-4">
                  <button
                    onClick={() => setCancelModalStep(null)}
                    className="w-full flex items-start gap-3 text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#0B3064]/40 rounded-lg p-3 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">Continuar com o plano</p>
                      <p className="text-[11px] text-gray-500">Mantenha tudo do jeito que está</p>
                    </div>
                  </button>

                  {isProfissional && (
                    <button
                      onClick={() => {
                        setCancelModalStep(null)
                        handleScrollPlanos()
                      }}
                      className="w-full flex items-start gap-3 text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#0B3064]/40 rounded-lg p-3 transition-all"
                    >
                      <ArrowDownCircle className="w-4 h-4 text-[#7eaaee] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">Mudar para plano menor</p>
                        <p className="text-[11px] text-gray-500">Plano Essencial — {fmt(PLANOS.essencial.preco)}/mês</p>
                      </div>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 mb-3">
                  <label className="text-[11px] font-medium text-gray-400">
                    Pode nos contar o motivo? (opcional)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={2}
                    placeholder="Ex.: terminei a obra, preço, falta funcionalidade..."
                    className="w-full bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg p-2 text-xs focus:border-[#3B82F6] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCancelModalStep("confirm")}
                    disabled={cancelLoading}
                    className="flex-1 h-10 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-200 border border-white/[0.1] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmarCancelamento}
                    disabled={cancelLoading}
                    className="flex-1 h-10 bg-red-600/90 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {cancelLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Confirmar cancelamento
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {cancelModalStep === "done" && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Cancelamento agendado</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-1.5">
                  Sua assinatura foi cancelada e não será renovada no próximo ciclo.
                </p>
                <p className="text-xs text-gray-500 leading-relaxed mb-5">
                  Seu acesso permanecerá ativo até{" "}
                  <span className="text-gray-300 font-semibold">{formatarDataPtBr(cycleEndDate)}</span>.
                  Após essa data, sua conta retornará ao modo gratuito.
                </p>
                <button
                  onClick={() => setCancelModalStep(null)}
                  className="w-full h-10 bg-[#0B3064] hover:bg-[#082551] text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Entendi
                </button>
              </>
            )}
          </div>
        </div>
      )}
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
