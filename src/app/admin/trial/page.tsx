"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Plus, Check, Gift, Clock, XCircle, Trash2, RefreshCw,
  Star, ArrowUpRight, Building2, Receipt, FileText,
  CalendarPlus, Zap, TrendingUp, Users, Timer, Award,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { recordSubscriptionChange } from "@/lib/track-event"

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string | null
  plano: string | null
  plano_expira_em: string | null
  status: string | null
  converted_at: string | null
  cancelled_at: string | null
  last_active_at: string | null
  created_at: string
}

interface UserEvent {
  id: string
  user_id: string
  event_type: string
  created_at: string
}

type TrialStatus = "ativo" | "proximo_do_fim" | "expirado" | "convertido"
type ScoreLevel = "alta" | "media" | "baixa"
type TrialSource = "organic" | "admin"

interface EnrichedTrial {
  id: string
  email: string
  nome: string
  source: TrialSource
  days: number
  created_at: string
  expires_at: string | null
  status: TrialStatus
  diasRestantes: number
  planoAtual: string
  hasObra: boolean
  hasDespesa: boolean
  hasReport: boolean
  conversionScore: number
  scoreLevel: ScoreLevel
  adminTrialId: string | null
}

type StatusFilter = "todos" | "ativo" | "proximo_do_fim" | "expirado" | "convertido"
type UseLevelFilter = "todos" | "com_obra" | "com_despesa" | "sem_atividade"
type DaysFilter = "todos" | "0" | "1-3" | "4-7" | "8-15" | "15+"

const STATUS_CONFIG: Record<TrialStatus, { label: string; bg: string; text: string; icon: typeof Check }> = {
  ativo: { label: "Ativo", bg: "bg-green-500/20", text: "text-green-400", icon: Check },
  proximo_do_fim: { label: "Próximo do fim", bg: "bg-yellow-500/20", text: "text-yellow-400", icon: Clock },
  expirado: { label: "Expirado", bg: "bg-red-500/20", text: "text-red-400", icon: XCircle },
  convertido: { label: "Convertido", bg: "bg-blue-500/20", text: "text-blue-400", icon: ArrowUpRight },
}

const SCORE_CONFIG: Record<ScoreLevel, { label: string; bg: string; text: string }> = {
  alta: { label: "Alta", bg: "bg-green-500/20", text: "text-green-400" },
  media: { label: "Média", bg: "bg-yellow-500/20", text: "text-yellow-400" },
  baixa: { label: "Baixa", bg: "bg-red-500/20", text: "text-red-400" },
}

export default function AdminTrialPage() {
  const [trials, setTrials] = useState<EnrichedTrial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nome: "", email: "", days: "30" })
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [useLevelFilter, setUseLevelFilter] = useState<UseLevelFilter>("todos")
  const [scoreFilter, setScoreFilter] = useState<"todos" | ScoreLevel>("todos")
  const [daysFilter, setDaysFilter] = useState<DaysFilter>("todos")
  const [search, setSearch] = useState("")

  const [convertTarget, setConvertTarget] = useState<string | null>(null)
  const [convertPlano, setConvertPlano] = useState<"essencial" | "profissional">("profissional")

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { supabase } = await import("@/lib/supabase")

    const [profilesRes, eventsRes, adminTrialsRes] = await Promise.all([
      (supabase.from("user_profiles") as any)
        .select("id, first_name, last_name, email, plano, plano_expira_em, status, converted_at, cancelled_at, last_active_at, created_at")
        .order("created_at", { ascending: false }),
      (supabase.from("user_events") as any)
        .select("id, user_id, event_type, created_at")
        .in("event_type", ["first_obra", "first_despesa", "first_report"]),
      (supabase.from("admin_trials") as any)
        .select("id, email, days, expires_at"),
    ])

    const profiles: UserProfile[] = profilesRes.data ?? []
    const events: UserEvent[] = eventsRes.data ?? []
    const adminTrials: { id: string; email: string; days: number; expires_at: string | null }[] = adminTrialsRes.data ?? []

    const adminTrialByEmail = new Map<string, typeof adminTrials[0]>()
    for (const at of adminTrials) {
      if (at.email) adminTrialByEmail.set(at.email.toLowerCase(), at)
    }

    const eventsByUserId = new Map<string, UserEvent[]>()
    for (const e of events) {
      const list = eventsByUserId.get(e.user_id) ?? []
      list.push(e)
      eventsByUserId.set(e.user_id, list)
    }

    const now = Date.now()
    const twoDaysMs = 2 * 86400000

    const enriched: EnrichedTrial[] = profiles.map((p) => {
      const email = (p.email ?? "").toLowerCase()
      const adminTrial = adminTrialByEmail.get(email)
      const userEvents = eventsByUserId.get(p.id) ?? []

      const hasObra = userEvents.some((e) => e.event_type === "first_obra")
      const hasDespesa = userEvents.some((e) => e.event_type === "first_despesa")
      const hasReport = userEvents.some((e) => e.event_type === "first_report")

      const expiresAt = p.plano_expira_em
      let diasRestantes = 0
      if (expiresAt) {
        diasRestantes = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 86400000))
      }

      const trialDays = adminTrial?.days ?? 7

      let status: TrialStatus = "ativo"
      if (p.converted_at || (p.plano && p.plano !== "trial" && p.status === "active")) {
        status = "convertido"
      } else if (!expiresAt || new Date(expiresAt).getTime() < now) {
        status = "expirado"
      } else if (diasRestantes >= 1 && diasRestantes <= 3) {
        status = "proximo_do_fim"
      }

      let score = 0
      if (hasObra) score += 30
      if (hasDespesa) score += 25
      if (hasReport) score += 20
      if (diasRestantes >= 1 && diasRestantes <= 3 && status !== "convertido") score += 15
      if (p.last_active_at && now - new Date(p.last_active_at).getTime() <= twoDaysMs) score += 10

      let scoreLevel: ScoreLevel = "baixa"
      if (score >= 70) scoreLevel = "alta"
      else if (score >= 40) scoreLevel = "media"

      return {
        id: p.id,
        email: p.email ?? "—",
        nome: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—",
        source: adminTrial ? "admin" as TrialSource : "organic" as TrialSource,
        days: trialDays,
        created_at: p.created_at,
        expires_at: expiresAt,
        status,
        diasRestantes,
        planoAtual: p.plano ?? "trial",
        hasObra,
        hasDespesa,
        hasReport,
        conversionScore: score,
        scoreLevel,
        adminTrialId: adminTrial?.id ?? null,
      }
    })

    setTrials(enriched)
    setLoading(false)
  }

  const matchDaysFilter = (dias: number, filter: DaysFilter): boolean => {
    if (filter === "todos") return true
    if (filter === "0") return dias === 0
    if (filter === "1-3") return dias >= 1 && dias <= 3
    if (filter === "4-7") return dias >= 4 && dias <= 7
    if (filter === "8-15") return dias >= 8 && dias <= 15
    if (filter === "15+") return dias > 15
    return true
  }

  const filtered = useMemo(() => {
    let result = trials

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((t) =>
        t.email.toLowerCase().includes(q) ||
        t.nome.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== "todos") result = result.filter((t) => t.status === statusFilter)

    if (startDate) {
      const start = new Date(startDate).toISOString()
      result = result.filter((t) => t.created_at >= start)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setDate(end.getDate() + 1)
      result = result.filter((t) => t.created_at < end.toISOString())
    }

    if (useLevelFilter === "com_obra") result = result.filter((t) => t.hasObra)
    else if (useLevelFilter === "com_despesa") result = result.filter((t) => t.hasDespesa)
    else if (useLevelFilter === "sem_atividade")
      result = result.filter((t) => !t.hasObra && !t.hasDespesa && !t.hasReport)

    if (scoreFilter !== "todos") result = result.filter((t) => t.scoreLevel === scoreFilter)
    if (daysFilter !== "todos") result = result.filter((t) => matchDaysFilter(t.diasRestantes, daysFilter))

    return result
  }, [trials, search, statusFilter, startDate, endDate, useLevelFilter, scoreFilter, daysFilter])

  const summary = useMemo(() => {
    const total = trials.length
    const ativos = trials.filter((t) => t.status === "ativo" || t.status === "proximo_do_fim").length
    const convertidos = trials.filter((t) => t.status === "convertido").length
    const expiradosSemConv = trials.filter((t) => t.status === "expirado").length
    const taxa = total > 0 ? (convertidos / total) * 100 : 0
    return { total, ativos, convertidos, expiradosSemConv, taxa }
  }, [trials])

  const setTrialLoading = (id: string, v: boolean) =>
    setActionLoading((prev) => ({ ...prev, [id]: v }))

  const handleCriar = async () => {
    if (!form.email.trim()) { toast.error("Email é obrigatório"); return }
    const days = parseInt(form.days) || 30
    setSaving(true)
    const { supabase } = await import("@/lib/supabase")

    const expires = new Date()
    expires.setDate(expires.getDate() + days)

    const { error } = await (supabase.from("admin_trials") as any).insert([{
      email: form.email.trim().toLowerCase(),
      label: form.nome.trim() || null,
      days,
      expires_at: expires.toISOString(),
    }])

    if (error) {
      toast.error("Erro ao cadastrar: " + error.message)
    } else {
      await (supabase.from("user_profiles") as any)
        .update({ plano: "trial", status: "trial", plano_expira_em: expires.toISOString() })
        .eq("email", form.email.trim().toLowerCase())
      setForm({ nome: "", email: "", days: "30" })
      setShowForm(false)
      toast.success("Acesso trial cadastrado!")
      await loadData()
    }
    setSaving(false)
  }

  const handleExtend = async (trial: EnrichedTrial, extraDays: number) => {
    setTrialLoading(trial.id, true)
    const { supabase } = await import("@/lib/supabase")

    const current = trial.expires_at ? new Date(trial.expires_at) : new Date()
    const base = current.getTime() > Date.now() ? current : new Date()
    base.setDate(base.getDate() + extraDays)
    const newExpires = base.toISOString()

    await (supabase.from("user_profiles") as any)
      .update({ plano_expira_em: newExpires, plano: "trial", status: "trial" })
      .eq("id", trial.id)

    if (trial.adminTrialId) {
      await (supabase.from("admin_trials") as any)
        .update({ expires_at: newExpires })
        .eq("id", trial.adminTrialId)
    }

    toast.success(`+${extraDays} dias adicionados`)
    await loadData()
    setTrialLoading(trial.id, false)
  }

  const handleReativar = async (trial: EnrichedTrial) => {
    setTrialLoading(trial.id, true)
    const { supabase } = await import("@/lib/supabase")

    const newExpires = new Date()
    newExpires.setDate(newExpires.getDate() + trial.days)
    const expiresStr = newExpires.toISOString()

    await (supabase.from("user_profiles") as any)
      .update({ plano: "trial", status: "trial", plano_expira_em: expiresStr })
      .eq("id", trial.id)

    if (trial.adminTrialId) {
      await (supabase.from("admin_trials") as any)
        .update({ expires_at: expiresStr })
        .eq("id", trial.adminTrialId)
    }

    toast.success("Trial reativado!")
    await loadData()
    setTrialLoading(trial.id, false)
  }

  const handleConverter = async (trial: EnrichedTrial, plano: "essencial" | "profissional") => {
    setTrialLoading(trial.id, true)
    const { supabase } = await import("@/lib/supabase")

    const { error } = await (supabase.from("user_profiles") as any)
      .update({
        plano,
        plano_expira_em: null,
        status: "active",
        converted_at: new Date().toISOString(),
      })
      .eq("id", trial.id)

    if (error) {
      toast.error("Erro ao converter: " + error.message)
    } else {
      await recordSubscriptionChange(trial.id, trial.planoAtual, plano, "conversao_manual_admin")
      toast.success(`Convertido para plano ${plano}!`)
      setConvertTarget(null)
      await loadData()
    }
    setTrialLoading(trial.id, false)
  }

  const handleRemover = async (trial: EnrichedTrial) => {
    if (!trial.adminTrialId) {
      toast.error("Só é possível remover trials criados pelo admin")
      return
    }
    setTrialLoading(trial.id, true)
    const { supabase } = await import("@/lib/supabase")
    await (supabase.from("admin_trials") as any).delete().eq("id", trial.adminTrialId)
    toast.success("Registro admin removido")
    await loadData()
    setTrialLoading(trial.id, false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  const summaryCards = [
    { label: "Total usuários", value: summary.total, icon: Users, color: "bg-blue-500/20 text-blue-400" },
    { label: "Trials ativos", value: summary.ativos, icon: Timer, color: "bg-green-500/20 text-green-400" },
    { label: "Convertidos", value: summary.convertidos, icon: TrendingUp, color: "bg-blue-500/20 text-blue-400" },
    { label: "Expirados s/ conv.", value: summary.expiradosSemConv, icon: XCircle, color: "bg-red-500/20 text-red-400" },
    { label: "Taxa de conversão", value: `${summary.taxa.toFixed(1)}%`, icon: Award, color: "bg-yellow-500/20 text-yellow-400" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Controle de Trials</h1>
          <p className="text-sm text-gray-400 mt-0.5">Todos os trials (orgânicos + admin)</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo acesso
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-3 bg-slate-800/50 border-slate-700/50">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center mb-2 ${card.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xl font-bold text-white leading-none">
                {typeof card.value === "number" ? card.value.toLocaleString("pt-BR") : card.value}
              </p>
              <p className="text-[11px] font-medium text-gray-400 mt-1 leading-tight">{card.label}</p>
            </Card>
          )
        })}
      </div>

      <Card className="p-3 bg-slate-800/50 border-slate-700/50 space-y-2">
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-gray-500"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-slate-700 border border-slate-600 text-white text-xs rounded-md px-2 h-8 cursor-pointer">
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="proximo_do_fim">Próximo do fim</option>
            <option value="expirado">Expirado</option>
            <option value="convertido">Convertido</option>
          </select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="h-8 text-xs bg-slate-700 border-slate-600 text-white" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="h-8 text-xs bg-slate-700 border-slate-600 text-white" />
          <select value={daysFilter} onChange={(e) => setDaysFilter(e.target.value as DaysFilter)}
            className="bg-slate-700 border border-slate-600 text-white text-xs rounded-md px-2 h-8 cursor-pointer">
            <option value="todos">Dias restantes</option>
            <option value="0">Expirado (0)</option>
            <option value="1-3">1–3 dias</option>
            <option value="4-7">4–7 dias</option>
            <option value="8-15">8–15 dias</option>
            <option value="15+">15+ dias</option>
          </select>
          <select value={useLevelFilter} onChange={(e) => setUseLevelFilter(e.target.value as UseLevelFilter)}
            className="bg-slate-700 border border-slate-600 text-white text-xs rounded-md px-2 h-8 cursor-pointer">
            <option value="todos">Nível de uso</option>
            <option value="com_obra">Com obra</option>
            <option value="com_despesa">Com despesa</option>
            <option value="sem_atividade">Sem atividade</option>
          </select>
          <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value as "todos" | ScoreLevel)}
            className="bg-slate-700 border border-slate-600 text-white text-xs rounded-md px-2 h-8 cursor-pointer">
            <option value="todos">Potencial</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
          <Button onClick={() => {
            setSearch(""); setStatusFilter("todos"); setStartDate(""); setEndDate("")
            setDaysFilter("todos"); setUseLevelFilter("todos"); setScoreFilter("todos")
          }} className="h-8 text-xs bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600">
            Limpar
          </Button>
        </div>
      </Card>

      {showForm && (
        <Card className="p-5 bg-slate-800/50 border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-4">Cadastrar acesso trial manual</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-400">Email <span className="text-red-400">*</span></Label>
              <Input type="email" placeholder="usuario@email.com" value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Nome</Label>
              <Input placeholder="Nome do usuário" value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Duração (dias)</Label>
              <Input type="number" placeholder="30" value={form.days}
                onChange={(e) => setForm((p) => ({ ...p, days: e.target.value }))}
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 mt-1" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => setShowForm(false)}
              className="bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600 text-sm">Cancelar</Button>
            <Button onClick={handleCriar} disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
              {saving ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          {filtered.length} de {trials.length} usuário{trials.length !== 1 ? "s" : ""}
        </p>

        {filtered.length === 0 && (
          <Card className="p-8 bg-slate-800/50 border-slate-700/50 text-center">
            <Gift className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum trial encontrado</p>
          </Card>
        )}

        {filtered.map((trial) => {
          const sc = STATUS_CONFIG[trial.status]
          const StatusIcon = sc.icon
          const sl = SCORE_CONFIG[trial.scoreLevel]
          const busy = actionLoading[trial.id] ?? false
          const isConvertOpen = convertTarget === trial.id

          return (
            <Card key={trial.id}
              className={`p-4 bg-slate-800/50 border-slate-700/50 ${trial.status === "expirado" ? "opacity-60" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-white">{trial.nome}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${sc.bg} ${sc.text}`}>
                    <StatusIcon className="w-3 h-3" />{sc.label}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${sl.bg} ${sl.text}`}>
                    <Star className="w-2.5 h-2.5" />{sl.label} ({trial.conversionScore}pts)
                  </span>
                  {trial.source === "admin" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-500/20 text-purple-400">Admin</span>
                  )}
                </div>

                <p className="text-sm text-blue-400 mb-1.5">{trial.email}</p>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                  <span>{trial.days} dias de trial</span>
                  <span className="text-gray-600">•</span>
                  <span>Plano: {trial.planoAtual}</span>
                  {trial.status !== "convertido" && trial.status !== "expirado" && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className={trial.status === "proximo_do_fim" ? "text-yellow-400" : "text-green-400"}>
                        {trial.diasRestantes} dias restantes
                      </span>
                    </>
                  )}
                  {trial.expires_at && (
                    <><span className="text-gray-600">•</span>
                    <span>Expira: {new Date(trial.expires_at).toLocaleDateString("pt-BR")}</span></>
                  )}
                  <span className="text-gray-600">•</span>
                  <span>Cadastro: {new Date(trial.created_at).toLocaleDateString("pt-BR")}</span>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <ActivityIcon active={trial.hasObra} icon={Building2} label="Obra" />
                  <ActivityIcon active={trial.hasDespesa} icon={Receipt} label="Despesa" />
                  <ActivityIcon active={trial.hasReport} icon={FileText} label="Relatório" />
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  {(trial.status === "ativo" || trial.status === "proximo_do_fim") && (
                    <>
                      <Button onClick={() => handleExtend(trial, 3)} disabled={busy}
                        className="h-6 px-2 text-[10px] bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600">
                        <CalendarPlus className="w-3 h-3 mr-1" />+3 dias
                      </Button>
                      <Button onClick={() => handleExtend(trial, 7)} disabled={busy}
                        className="h-6 px-2 text-[10px] bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600">
                        <CalendarPlus className="w-3 h-3 mr-1" />+7 dias
                      </Button>
                    </>
                  )}
                  {trial.status === "expirado" && (
                    <Button onClick={() => handleReativar(trial)} disabled={busy}
                      className="h-6 px-2 text-[10px] bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30">
                      <RefreshCw className="w-3 h-3 mr-1" />Reativar
                    </Button>
                  )}
                  {trial.status !== "convertido" && !isConvertOpen && (
                    <Button onClick={() => { setConvertTarget(trial.id); setConvertPlano("profissional") }} disabled={busy}
                      className="h-6 px-2 text-[10px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30">
                      <Zap className="w-3 h-3 mr-1" />Converter
                    </Button>
                  )}
                  {isConvertOpen && (
                    <div className="flex items-center gap-1.5 bg-slate-900/50 rounded-md px-2 py-1">
                      <select value={convertPlano} onChange={(e) => setConvertPlano(e.target.value as "essencial" | "profissional")}
                        className="bg-slate-700 border border-slate-600 text-white text-[10px] rounded px-1 h-5 cursor-pointer">
                        <option value="essencial">Essencial</option>
                        <option value="profissional">Profissional</option>
                      </select>
                      <Button onClick={() => handleConverter(trial, convertPlano)} disabled={busy}
                        className="h-5 px-2 text-[10px] bg-green-600 hover:bg-green-700 text-white">
                        Confirmar
                      </Button>
                      <Button onClick={() => setConvertTarget(null)}
                        className="h-5 px-2 text-[10px] bg-slate-700 hover:bg-slate-600 text-gray-400">
                        X
                      </Button>
                    </div>
                  )}
                  {trial.source === "admin" && (
                    <Button onClick={() => handleRemover(trial)} disabled={busy}
                      className="h-6 px-2 text-[10px] bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20">
                      <Trash2 className="w-3 h-3 mr-1" />Remover
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ActivityIcon({ active, icon: Icon, label }: { active: boolean; icon: typeof Building2; label: string }) {
  return (
    <div className="flex items-center gap-1 text-[10px]">
      {active ? <Check className="w-3 h-3 text-green-400" /> : <XCircle className="w-3 h-3 text-gray-600" />}
      <Icon className={`w-3 h-3 ${active ? "text-green-400" : "text-gray-600"}`} />
      <span className={active ? "text-green-400" : "text-gray-600"}>{label}</span>
    </div>
  )
}
