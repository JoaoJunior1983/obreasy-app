"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  LayoutGrid, CheckCircle2,
  ArrowUpCircle, ArrowDownCircle, Zap, Building2, X, AlertTriangle
} from "lucide-react"
import { PLANOS, getPlanoAtualDB, setPlanoAtual, calcularProrrataUpgrade, type PlanoTipo } from "@/lib/plan"

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function PlanoPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plano, setPlano] = useState<PlanoTipo>("essencial")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [downgrading, setDowngrading] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [loading, setLoading] = useState(true)

  // Dia de contratação (simplificado: dia atual do mês do usuário)
  const [diaContratacao] = useState(() => new Date().getDate())

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) { router.push("/"); return }

    ;(async () => {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/"); return }

      // Lê profile_type direto do banco para determinar o plano correto
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("profile_type")
        .eq("id", user.id)
        .single()

      if (profile?.profile_type === "owner") {
        setPlano("essencial")
      } else if (profile?.profile_type === "builder") {
        setPlano("profissional")
      } else {
        const plano = await getPlanoAtualDB(user.id)
        setPlano(plano)
      }

      setLoading(false)
      if (searchParams.get("upgrade") === "1") setShowUpgradeModal(true)
    })()
  }, [router, searchParams])

  const handleConfirmarUpgrade = async () => {
    setUpgrading(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("user_profiles")
        .update({ profile_type: "builder" })
        .eq("id", user.id)

      if (error) throw error

      // Atualizar localStorage
      setPlanoAtual("profissional")
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}")
        userData.profile = "builder"
        localStorage.setItem("user", JSON.stringify(userData))
      } catch {}

      setPlano("profissional")
      setShowUpgradeModal(false)
    } catch (e) {
      console.error("Erro ao fazer upgrade:", e)
    } finally {
      setUpgrading(false)
    }
  }

  const handleConfirmarDowngrade = async () => {
    setDowngrading(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from("user_profiles")
        .update({ profile_type: "owner" })
        .eq("id", user.id)
      if (error) throw error
      setPlanoAtual("essencial")
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}")
        userData.profile = "owner"
        localStorage.setItem("user", JSON.stringify(userData))
      } catch {}
      setPlano("essencial")
      setShowDowngradeModal(false)
    } catch (e) {
      console.error("Erro ao fazer downgrade:", e)
    } finally {
      setDowngrading(false)
    }
  }

  const handleConfirmarCancelamento = async () => {
    setCanceling(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from("user_profiles")
        .update({ profile_type: "owner", plano_expira_em: null })
        .eq("id", user.id)
      if (error) throw error
      setPlanoAtual("essencial")
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}")
        userData.profile = "owner"
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.removeItem("trialExpiraEm")
      } catch {}
      setPlano("essencial")
      setShowCancelModal(false)
    } catch (e) {
      console.error("Erro ao cancelar:", e)
    } finally {
      setCanceling(false)
    }
  }

  const planoInfo = PLANOS[plano]
  const prorrataInfo = calcularProrrataUpgrade(diaContratacao)
  const isProfissional = plano === "profissional"

  // helper para bottom sheet modal
  const BottomSheet = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full bg-[#13151a] rounded-t-2xl border-t border-white/[0.08] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        {children}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3064] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-4 pb-10 sm:px-6">
      <div className="max-w-xl mx-auto space-y-3">

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <LayoutGrid className="w-3.5 h-3.5 text-[#7eaaee]" />
          </div>
          <h1 className="text-sm font-bold text-white">Meu Plano</h1>
        </div>

        {/* Plano atual */}
        <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-gray-400">Plano atual</p>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isProfissional
                ? "bg-[#0B3064]/20 text-[#7eaaee] border border-[#0B3064]/40"
                : "bg-white/[0.06] text-gray-300 border border-white/[0.08]"
            }`}>
              {isProfissional ? "Construtor / Profissional" : "Dono da Obra"}
            </span>
          </div>

          <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06]">
            {[
              { label: "Valor", value: fmt(planoInfo.preco), sub: "/mês" },
              { label: "Obras", value: planoInfo.limiteObras === Infinity ? "∞" : String(planoInfo.limiteObras), sub: null },
              { label: "Status", value: null, custom: (
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-400">Ativo</span>
                </div>
              )},
            ].map(({ label, value, sub, custom }) => (
              <div key={label} className="py-3 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">{label}</p>
                {custom ?? <p className="text-sm font-bold text-white leading-tight">{value}{sub && <span className="text-[10px] text-gray-500 font-normal">{sub}</span>}</p>}
              </div>
            ))}
          </div>

          <div className="px-3 py-3">
            <p className="text-xs text-gray-400 leading-relaxed">
              {isProfissional
                ? <>Plano <span className="text-white font-medium">Construtor / Profissional</span> — obras ilimitadas, controle de recebimentos e gestão avançada.</>
                : <>Plano <span className="text-white font-medium">Dono da Obra</span> — essencial para quem gerencia 1 obra.</>}
            </p>
          </div>
        </div>

        {/* Ações */}
        {!isProfissional ? (
          <>
            <button onClick={() => setShowUpgradeModal(true)}
              className="w-full flex items-center justify-center gap-2 h-11 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-sm font-semibold rounded-xl transition-all">
              <ArrowUpCircle className="w-4 h-4" />Fazer upgrade para Construtor
            </button>
            <p className="text-[11px] text-gray-600 text-center -mt-1">Sem permanência · Cancele quando quiser</p>
          </>
        ) : (
          <button onClick={() => setShowDowngradeModal(true)}
            className="w-full flex items-center justify-center gap-2 h-11 bg-[#2a2d35] hover:bg-white/[0.10] active:scale-95 text-gray-300 text-sm font-medium rounded-xl border border-white/[0.08] transition-all">
            <ArrowDownCircle className="w-4 h-4" />Fazer downgrade para Dono da Obra
          </button>
        )}

        {/* Comparativo — só para plano essencial */}
        {!isProfissional && (
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-3 border-b border-white/[0.06]">
              <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
              <p className="text-xs font-semibold text-white">O que você ganha no Construtor</p>
            </div>
            {[
              ["Para 1 obra", "Obras ilimitadas"],
              ["Sem visão consolidada", "Visão consolidada de todas as obras"],
            ].map(([antes, depois], i) => (
              <div key={i} className={`grid grid-cols-2 divide-x divide-white/[0.06] ${i > 0 ? "border-t border-white/[0.06]" : ""}`}>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <X className="w-3 h-3 text-gray-600 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{antes}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0B3064]/08">
                  <CheckCircle2 className="w-3 h-3 text-[#7eaaee] flex-shrink-0" />
                  <span className="text-xs text-[#7eaaee] font-medium">{depois}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Bottom sheet: Downgrade */}
      {showDowngradeModal && (
        <BottomSheet onClose={() => setShowDowngradeModal(false)}>
          <div className="px-4 pb-8 pt-2 space-y-4">
            <p className="text-sm font-bold text-white">Fazer downgrade</p>
            <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-200">Você passará para o plano <strong>Dono da Obra</strong>, com limite de <strong>1 obra</strong>. Seus dados não serão excluídos.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0B3064]/10 border border-[#0B3064]/30 rounded-xl p-3 text-center opacity-50">
                <p className="text-[10px] text-[#7eaaee] uppercase tracking-wide mb-1">Atual</p>
                <p className="text-xs font-bold text-white">Construtor</p>
                <p className="text-[10px] text-gray-500">{fmt(PLANOS.profissional.preco)}/mês</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Novo</p>
                <p className="text-xs font-bold text-white">Dono da Obra</p>
                <p className="text-[10px] text-gray-500">{fmt(PLANOS.essencial.preco)}/mês</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDowngradeModal(false)}
                className="flex-1 h-11 bg-white/[0.06] hover:bg-white/[0.10] text-gray-300 text-sm rounded-xl border border-white/[0.08] transition-colors">
                Manter plano
              </button>
              <button onClick={handleConfirmarDowngrade} disabled={downgrading}
                className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">
                {downgrading ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Bottom sheet: Cancelamento */}
      {showCancelModal && (
        <BottomSheet onClose={() => setShowCancelModal(false)}>
          <div className="px-4 pb-8 pt-2 space-y-4">
            <p className="text-sm font-bold text-white">Cancelar assinatura</p>
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-200">Ao cancelar, sua conta voltará para o plano gratuito <strong>Dono da Obra</strong> (1 obra). Seus dados não serão excluídos.</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">O cancelamento é imediato. Você não será cobrado nos próximos ciclos.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 h-11 bg-white/[0.06] hover:bg-white/[0.10] text-gray-300 text-sm rounded-xl border border-white/[0.08] transition-colors">
                Manter
              </button>
              <button onClick={handleConfirmarCancelamento} disabled={canceling}
                className="flex-1 h-11 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">
                {canceling ? "Cancelando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Bottom sheet: Upgrade */}
      {showUpgradeModal && (
        <BottomSheet onClose={() => setShowUpgradeModal(false)}>
          <div className="px-4 pb-8 pt-2 space-y-4">
            <p className="text-sm font-bold text-white">Upgrade para Construtor / Profissional</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-center opacity-50">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Atual</p>
                <p className="text-xs font-bold text-white">Dono da Obra</p>
                <p className="text-[10px] text-gray-500">{fmt(PLANOS.essencial.preco)}/mês</p>
              </div>
              <div className="bg-[#0B3064]/10 border border-[#0B3064]/40 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#7eaaee] uppercase tracking-wide mb-1">Novo</p>
                <p className="text-xs font-bold text-white">Construtor</p>
                <p className="text-[10px] text-[#7eaaee]">{fmt(PLANOS.profissional.preco)}/mês</p>
              </div>
            </div>

            <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-white/[0.06]">Resumo do upgrade</p>
              {[
                { label: "Plano Profissional (mês completo)", value: fmt(PLANOS.profissional.preco), cls: "text-gray-200" },
                { label: `Dias restantes no ciclo`, value: `${prorrataInfo.diasRestantes} dias`, cls: "text-gray-200" },
                { label: "Desconto proporcional", value: `− ${fmt(prorrataInfo.valorProporcional)}`, cls: "text-emerald-400" },
              ].map(({ label, value, cls }, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-xs font-semibold ${cls}`}>{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs font-semibold text-white">Total a pagar agora</span>
                <span className="text-sm font-bold text-[#7eaaee]">{fmt(prorrataInfo.totalAPagar)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-[#0B3064]/10 border border-[#0B3064]/30 rounded-xl p-3">
              <Building2 className="w-4 h-4 text-[#7eaaee] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#7eaaee]">Após o upgrade você terá <strong>obras ilimitadas</strong> e visão consolidada de todos os projetos.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowUpgradeModal(false)}
                className="flex-1 h-11 bg-white/[0.06] hover:bg-white/[0.10] text-gray-300 text-sm rounded-xl border border-white/[0.08] transition-colors">
                Cancelar
              </button>
              <button onClick={handleConfirmarUpgrade} disabled={upgrading}
                className="flex-1 h-11 bg-[#0B3064] hover:bg-[#082551] active:scale-95 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">
                {upgrading ? "Processando..." : "Confirmar upgrade"}
              </button>
            </div>
          </div>
        </BottomSheet>
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
