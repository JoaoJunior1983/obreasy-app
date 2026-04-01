"use client"

import { useEffect, useState } from "react"
import {
  Users,
  Building2,
  TrendingUp,
  CreditCard,
  UserCheck,
  Activity,
  Clock,
  XCircle,
  RefreshCw,
  DollarSign,
  Target,
  Loader2,
  Filter,
  BarChart3,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type Period = "today" | "7d" | "30d" | "90d"

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
]

const FUNNEL_STEPS = [
  { label: "Criou conta", event: "signup" },
  { label: "Iniciou trial", event: "trial_start" },
  { label: "Selecionou perfil", event: "profile_selected" },
  { label: "Criou obra", event: "first_obra" },
  { label: "Lançou despesa", event: "first_despesa" },
  { label: "Gerou relatório", event: "first_report" },
  { label: "Assinou plano", event: "subscription_started" },
]

const fmt = (n: number) => n.toLocaleString("pt-BR")
const fmtCurrency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const fmtPct = (n: number) => `${n.toFixed(1)}%`

function getPeriodDays(period: Period): number {
  if (period === "today") return 0
  return period === "7d" ? 7 : period === "30d" ? 30 : 90
}

function getPeriodStart(period: Period): string {
  const now = new Date()
  if (period === "today")
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const days = getPeriodDays(period)
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

function getPeriodLabel(period: Period): string {
  if (period === "today") return "Hoje"
  const d = getPeriodDays(period)
  return `Últimos ${d} dias`
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("30d")
  const [loading, setLoading] = useState(true)

  const [totalUsers, setTotalUsers] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const [newInPeriod, setNewInPeriod] = useState(0)
  const [owners, setOwners] = useState(0)
  const [builders, setBuilders] = useState(0)

  const [trialsStarted, setTrialsStarted] = useState(0)
  const [trialsActive, setTrialsActive] = useState(0)
  const [trialsExpired, setTrialsExpired] = useState(0)
  const [converted, setConverted] = useState(0)

  const [essencialCount, setEssencialCount] = useState(0)
  const [profissionalCount, setProfissionalCount] = useState(0)
  const [cancelledCount, setCancelledCount] = useState(0)

  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([])
  const [funnelData, setFunnelData] = useState<{ label: string; count: number }[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentObras, setRecentObras] = useState<any[]>([])

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  async function loadAll() {
    setLoading(true)
    const { supabase } = await import("@/lib/supabase")

    const nowISO = new Date().toISOString()
    const pStart = getPeriodStart(period)
    const days = getPeriodDays(period)
    const chartDays = days === 0 ? 1 : days

    const sb = supabase as any

    const [
      rTotal,
      rActive,
      rNew,
      rOwners,
      rBuilders,
      rTrialsStarted,
      rTrialsActive,
      rTrialsExpired,
      rConverted,
      rEssencial,
      rProfissional,
      rCancelled,
      rChart,
      rEvents,
      rUsers,
      rObras,
    ] = await Promise.all([
      sb.from("user_profiles").select("*", { count: "exact", head: true }),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).gte("last_active_at", pStart),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).gte("created_at", pStart),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).eq("profile_type", "owner"),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).eq("profile_type", "builder"),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).gte("created_at", pStart).or("status.eq.trial,plano.eq.trial"),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).eq("plano", "trial").gt("plano_expira_em", nowISO),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).eq("plano", "trial").lt("plano_expira_em", nowISO).gte("plano_expira_em", pStart),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).gte("converted_at", pStart).not("converted_at", "is", null),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).eq("plano", "essencial").neq("status", "cancelled"),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).eq("plano", "profissional").neq("status", "cancelled"),
      sb.from("user_profiles").select("*", { count: "exact", head: true }).gte("cancelled_at", pStart),
      sb.from("user_profiles").select("created_at").gte("created_at", pStart).order("created_at"),
      sb.from("user_events").select("user_id, event_type, created_at").gte("created_at", pStart),
      sb.from("user_profiles").select("first_name, last_name, profile_type, plano, status, created_at").gte("created_at", pStart).order("created_at", { ascending: false }).limit(10),
      sb.from("obras").select("nome, localizacao, criada_em").gte("criada_em", pStart).order("criada_em", { ascending: false }).limit(5),
    ])

    setTotalUsers(rTotal.count ?? 0)
    setActiveUsers(rActive.count ?? 0)
    setNewInPeriod(rNew.count ?? 0)
    setOwners(rOwners.count ?? 0)
    setBuilders(rBuilders.count ?? 0)

    setTrialsStarted(rTrialsStarted.count ?? 0)
    setTrialsActive(rTrialsActive.count ?? 0)
    setTrialsExpired(rTrialsExpired.count ?? 0)
    setConverted(rConverted.count ?? 0)

    setEssencialCount(rEssencial.count ?? 0)
    setProfissionalCount(rProfissional.count ?? 0)
    setCancelledCount(rCancelled.count ?? 0)

    const buckets: Record<string, number> = {}
    const today = new Date()
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      buckets[d.toISOString().split("T")[0]] = 0
    }
    ;(rChart.data ?? []).forEach((row: any) => {
      const key = new Date(row.created_at).toISOString().split("T")[0]
      if (key in buckets) buckets[key]++
    })
    setChartData(
      Object.entries(buckets).map(([iso, count]) => ({
        date: new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        count,
      })),
    )

    const sets: Record<string, Set<string>> = {}
    FUNNEL_STEPS.forEach((s) => (sets[s.event] = new Set()))
    ;(rEvents.data ?? []).forEach((e: any) => {
      if (sets[e.event_type]) sets[e.event_type].add(e.user_id)
    })
    setFunnelData(
      FUNNEL_STEPS.map((s) => ({ label: s.label, count: sets[s.event].size })),
    )

    setRecentUsers(rUsers.data ?? [])
    setRecentObras(rObras.data ?? [])
    setLoading(false)
  }

  const activeSubs = essencialCount + profissionalCount
  const mrr = essencialCount * 29 + profissionalCount * 49
  const ticket = activeSubs > 0 ? mrr / activeSubs : 0
  const convRate = trialsStarted > 0 ? (converted / trialsStarted) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header + period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
          <p className="text-sm text-gray-400 mt-0.5">Visão geral do OBREASY</p>
        </div>
        <div className="flex gap-1 bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p.key
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1 — Usuarios */}
      <section>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Usuários
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={Users} label="Total cadastrados" value={fmt(totalUsers)} color="blue" />
          <KpiCard icon={Activity} label="Usuários ativos" value={fmt(activeUsers)} sub={getPeriodLabel(period)} color="green" />
          <KpiCard icon={TrendingUp} label="Novos no período" value={fmt(newInPeriod)} color="cyan" />
          <KpiCard icon={UserCheck} label="Donos / Construtores" value={`${fmt(owners)} / ${fmt(builders)}`} color="purple" />
        </div>
      </section>

      {/* Row 2 — Trials e Conversão */}
      <section>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Trials e Conversão
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={Clock} label="Trials iniciados" value={fmt(trialsStarted)} color="blue" />
          <KpiCard icon={RefreshCw} label="Trials ativos" value={fmt(trialsActive)} color="green" />
          <KpiCard icon={XCircle} label="Trials expirados" value={fmt(trialsExpired)} color="red" />
          <KpiCard icon={Target} label="Taxa de conversão" value={fmtPct(convRate)} color="emerald" />
        </div>
      </section>

      {/* Row 3 — Assinaturas e Receita */}
      <section>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Assinaturas e Receita
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={CreditCard} label="Assinaturas ativas" value={fmt(activeSubs)} color="blue" />
          <KpiCard icon={XCircle} label="Cancelados" value={fmt(cancelledCount)} color="red" />
          <KpiCard icon={DollarSign} label="MRR estimado" value={fmtCurrency(mrr)} color="emerald" />
          <KpiCard icon={TrendingUp} label="Ticket médio" value={fmtCurrency(ticket)} color="cyan" />
        </div>
      </section>

      {/* Line chart — cadastros ultimos 30 dias */}
      <Card className="p-4 bg-slate-800/50 border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Novos cadastros por dia</h3>
          <span className="text-[10px] text-gray-500 ml-auto">{getPeriodLabel(period)}</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#60a5fa" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Cadastros"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Funnel */}
      <Card className="p-4 bg-slate-800/50 border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Funil de conversão</h3>
          <span className="text-[10px] text-gray-500 ml-auto">{getPeriodLabel(period)}</span>
        </div>
        <div className="space-y-2.5">
          {funnelData.map((step, i) => {
            const max = funnelData[0]?.count || 1
            const prev = i > 0 ? funnelData[i - 1].count : step.count
            const pctPrev = prev > 0 ? (step.count / prev) * 100 : 0
            const barW = max > 0 ? Math.max((step.count / max) * 100, 3) : 3

            return (
              <div key={step.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-36 shrink-0 text-right truncate">
                  {step.label}
                </span>
                <div className="flex-1 bg-slate-700/30 rounded-full h-7 relative overflow-hidden">
                  <div
                    className="bg-blue-500/80 h-full rounded-full transition-all duration-500"
                    style={{ width: `${barW}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3 gap-2">
                    <span className="text-xs font-semibold text-white">
                      {fmt(step.count)}
                    </span>
                    {i > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {fmtPct(pctPrev)} do anterior
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Two lists side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Últimos cadastros */}
        <Card className="p-4 bg-slate-800/50 border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Cadastros no período</h3>
          </div>
          <div className="space-y-1">
            {recentUsers.length === 0 && (
              <p className="text-xs text-gray-500">Nenhum usuário encontrado</p>
            )}
            {recentUsers.map((u: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-slate-700/30 last:border-0"
              >
                <div>
                  <p className="text-sm text-white font-medium">
                    {u.first_name} {u.last_name}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {u.profile_type === "owner"
                      ? "Dono da Obra"
                      : u.profile_type === "builder"
                        ? "Construtor"
                        : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      u.plano === "profissional"
                        ? "bg-blue-500/20 text-blue-400"
                        : u.plano === "trial"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-slate-700 text-gray-400"
                    }`}
                  >
                    {u.plano ?? "essencial"}
                  </span>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Obras recentes */}
        <Card className="p-4 bg-slate-800/50 border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Obras no período</h3>
          </div>
          <div className="space-y-1">
            {recentObras.length === 0 && (
              <p className="text-xs text-gray-500">Nenhuma obra encontrada</p>
            )}
            {recentObras.map((o: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-slate-700/30 last:border-0"
              >
                <div>
                  <p className="text-sm text-white font-medium truncate max-w-[200px]">
                    {o.nome}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {o.localizacao?.cidade ?? "—"}, {o.localizacao?.estado ?? "—"}
                  </p>
                </div>
                <p className="text-[10px] text-gray-500 shrink-0">
                  {new Date(o.criada_em).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  color: string
}) {
  const palette: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-400",
    green: "bg-green-500/20 text-green-400",
    purple: "bg-purple-500/20 text-purple-400",
    cyan: "bg-cyan-500/20 text-cyan-400",
    red: "bg-red-500/20 text-red-400",
    emerald: "bg-emerald-500/20 text-emerald-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
  }

  return (
    <Card className="p-3 bg-slate-800/50 border-slate-700/50">
      <div
        className={`w-7 h-7 rounded-md flex items-center justify-center mb-2 ${palette[color] ?? palette.blue}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-xl font-bold text-white leading-none">{value}</p>
      <p className="text-[11px] font-medium text-gray-400 mt-1 leading-tight">
        {label}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{sub}</p>
      )}
    </Card>
  )
}
