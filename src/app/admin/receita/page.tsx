"use client"

import { useEffect, useState, useMemo } from "react"
import {
  DollarSign, Users, TrendingUp, CreditCard, XCircle, Clock,
  Loader2, BarChart3,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

const fmtCurrency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const fmtPct = (n: number) => `${n.toFixed(1)}%`

const MONTH_NAMES_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

type ChartRange = "3m" | "6m" | "12m"

const CHART_RANGES: { key: ChartRange; label: string; months: number }[] = [
  { key: "3m", label: "3 meses", months: 3 },
  { key: "6m", label: "6 meses", months: 6 },
  { key: "12m", label: "12 meses", months: 12 },
]

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  plano: string | null
  status: string | null
  created_at: string | null
  cancelled_at: string | null
  converted_at: string | null
}

interface SubHistory {
  user_id: string
  plano_anterior: string | null
  plano_novo: string
  motivo: string | null
  created_at: string | null
}

interface ChurnRow {
  nome: string
  plano_anterior: string
  data_cadastro: string
  data_cancelamento: string
  tempo_vida: number
  motivo: string
}

interface MonthRevenue {
  month: string
  essencial: number
  profissional: number
}

export default function AdminReceitaPage() {
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [history, setHistory] = useState<SubHistory[]>([])
  const [chartRange, setChartRange] = useState<ChartRange>("6m")

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { supabase } = await import("@/lib/supabase")

    const [rProfiles, rHistory] = await Promise.all([
      (supabase.from("user_profiles") as any).select(
        "id, first_name, last_name, plano, status, created_at, cancelled_at, converted_at"
      ),
      (supabase.from("subscription_history") as any)
        .select("user_id, plano_anterior, plano_novo, motivo, created_at")
        .order("created_at", { ascending: false }),
    ])

    setProfiles(rProfiles.data ?? [])
    setHistory(rHistory.data ?? [])
    setLoading(false)
  }

  const metrics = useMemo(() => {
    const activeEss = profiles.filter(p => p.plano === "essencial" && p.status !== "cancelled")
    const activePro = profiles.filter(p => p.plano === "profissional" && p.status !== "cancelled")

    const essCount = activeEss.length
    const proCount = activePro.length
    const revenueEss = essCount * 29
    const revenuePro = proCount * 49
    const mrrVal = revenueEss + revenuePro
    const totalSubs = essCount + proCount
    const ticketVal = totalSubs > 0 ? mrrVal / totalSubs : 0

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const cancelledThisMonth = profiles.filter(p => {
      if (!p.cancelled_at) return false
      return new Date(p.cancelled_at) >= monthStart
    }).length

    const totalAtMonthStart = profiles.filter(p => {
      if (!p.created_at) return false
      if (new Date(p.created_at) >= monthStart) return false
      if (p.plano !== "essencial" && p.plano !== "profissional") return false
      if (p.cancelled_at && new Date(p.cancelled_at) < monthStart) return false
      return true
    }).length

    const churnRate = totalAtMonthStart > 0 ? (cancelledThisMonth / totalAtMonthStart) * 100 : 0

    const cancelledUsers = profiles.filter(p => p.cancelled_at && p.created_at)
    let avgCancelDays = 0
    if (cancelledUsers.length > 0) {
      const totalDays = cancelledUsers.reduce((sum, p) => {
        return sum + (new Date(p.cancelled_at!).getTime() - new Date(p.created_at!).getTime()) / 86_400_000
      }, 0)
      avgCancelDays = Math.round(totalDays / cancelledUsers.length)
    }

    return { essCount, proCount, revenueEss, revenuePro, mrrVal, ticketVal, churnRate, avgCancelDays, cancelledUsers }
  }, [profiles])

  const chartData = useMemo(() => {
    const now = new Date()
    const rangeMonths = CHART_RANGES.find(r => r.key === chartRange)?.months ?? 6
    const months: MonthRevenue[] = []

    for (let i = rangeMonths - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)
      const label = `${MONTH_NAMES_PT[monthDate.getMonth()]}/${monthDate.getFullYear().toString().slice(2)}`

      let essInMonth = 0
      let proInMonth = 0

      for (const p of profiles) {
        if (!p.created_at) continue
        const created = new Date(p.created_at)
        if (created > monthEnd) continue

        const wasCancelledBefore = p.cancelled_at && new Date(p.cancelled_at) < monthDate
        if (wasCancelledBefore) continue

        const isPayingPlan = p.plano === "essencial" || p.plano === "profissional"
        const wasConvertedByThen = p.converted_at && new Date(p.converted_at) <= monthEnd

        if (!isPayingPlan && !wasConvertedByThen) continue

        if (p.plano === "profissional") proInMonth++
        else essInMonth++
      }

      months.push({ month: label, essencial: essInMonth * 29, profissional: proInMonth * 49 })
    }

    return months
  }, [profiles, chartRange])

  const churnTable = useMemo(() => {
    const historyByUser = new Map<string, SubHistory>()
    for (const h of history) {
      if (!historyByUser.has(h.user_id)) historyByUser.set(h.user_id, h)
    }

    return metrics.cancelledUsers
      .sort((a, b) => new Date(b.cancelled_at!).getTime() - new Date(a.cancelled_at!).getTime())
      .map(p => {
        const created = new Date(p.created_at!)
        const cancelled = new Date(p.cancelled_at!)
        const days = Math.round((cancelled.getTime() - created.getTime()) / 86_400_000)
        const hist = historyByUser.get(p.id)
        return {
          nome: `${p.first_name} ${p.last_name}`,
          plano_anterior: hist?.plano_anterior ?? p.plano ?? "—",
          data_cadastro: created.toLocaleDateString("pt-BR"),
          data_cancelamento: cancelled.toLocaleDateString("pt-BR"),
          tempo_vida: days,
          motivo: hist?.motivo ?? "—",
        }
      })
  }, [metrics.cancelledUsers, history])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  const kpis = [
    { icon: Users, label: "Essencial", value: metrics.essCount.toLocaleString("pt-BR"), sub: fmtCurrency(metrics.revenueEss) + "/mês", color: "blue" },
    { icon: Users, label: "Profissional", value: metrics.proCount.toLocaleString("pt-BR"), sub: fmtCurrency(metrics.revenuePro) + "/mês", color: "purple" },
    { icon: DollarSign, label: "MRR Estimado", value: fmtCurrency(metrics.mrrVal), color: "emerald" },
    { icon: CreditCard, label: "Ticket Médio", value: fmtCurrency(metrics.ticketVal), color: "cyan" },
    { icon: TrendingUp, label: "Churn Rate", value: fmtPct(metrics.churnRate), sub: "Mês atual", color: "red" },
    { icon: Clock, label: "Tempo até Cancelamento", value: `${metrics.avgCancelDays} dias`, sub: "Média", color: "yellow" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Receita e Planos</h1>
        <p className="text-sm text-gray-400 mt-0.5">Análise financeira e métricas de assinatura</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      <Card className="p-4 bg-slate-800/50 border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Receita por plano</h3>
          <div className="flex gap-1 ml-auto bg-slate-900/50 rounded-lg p-0.5">
            {CHART_RANGES.map(r => (
              <button key={r.key} onClick={() => setChartRange(r.key)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                  chartRange === r.key ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white hover:bg-slate-700/50"
                }`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} width={60}
                tickFormatter={v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }} formatter={(value: number) => [fmtCurrency(value)]} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar dataKey="essencial" name="Essencial (R$29)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profissional" name="Profissional (R$49)" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 bg-slate-800/50 border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-white">Usuários cancelados</h3>
          <span className="text-[10px] text-gray-500 ml-auto">
            {churnTable.length} registro{churnTable.length !== 1 ? "s" : ""}
          </span>
        </div>
        {churnTable.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">Nenhum cancelamento registrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">Nome</th>
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">Plano anterior</th>
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">Data cadastro</th>
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">Data cancelamento</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-medium">Tempo de vida</th>
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {churnTable.map((row, i) => (
                  <tr key={i} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors">
                    <td className="py-2 px-2 text-white font-medium">{row.nome}</td>
                    <td className="py-2 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        row.plano_anterior === "profissional" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                      }`}>{row.plano_anterior}</span>
                    </td>
                    <td className="py-2 px-2 text-gray-400">{row.data_cadastro}</td>
                    <td className="py-2 px-2 text-gray-400">{row.data_cancelamento}</td>
                    <td className="py-2 px-2 text-right text-gray-300">{row.tempo_vida} dias</td>
                    <td className="py-2 px-2 text-gray-400 max-w-[200px] truncate">{row.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; color: string
}) {
  const palette: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-400", green: "bg-green-500/20 text-green-400",
    purple: "bg-purple-500/20 text-purple-400", cyan: "bg-cyan-500/20 text-cyan-400",
    red: "bg-red-500/20 text-red-400", emerald: "bg-emerald-500/20 text-emerald-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
  }
  return (
    <Card className="p-3 bg-slate-800/50 border-slate-700/50">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center mb-2 ${palette[color] ?? palette.blue}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-xl font-bold text-white leading-none">{value}</p>
      <p className="text-[11px] font-medium text-gray-400 mt-1 leading-tight">{label}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{sub}</p>}
    </Card>
  )
}
