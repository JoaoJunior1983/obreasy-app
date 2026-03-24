"use client"

import { useEffect, useState } from "react"
import { Users, Building2, TrendingUp, CreditCard, UserCheck, UserCog, Calendar, Activity } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Metrics {
  totalUsuarios: number
  usuariosOwner: number
  usuariosBuilder: number
  totalObras: number
  obrasEsteMes: number
  planoEssencial: number
  planoProfissional: number
  usuariosUltimos30dias: number
}

const fmt = (n: number) => n.toLocaleString("pt-BR")

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [obrasRecentes, setObrasRecentes] = useState<any[]>([])
  const [usuariosRecentes, setUsuariosRecentes] = useState<any[]>([])

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    const { supabase } = await import("@/lib/supabase")

    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
    const inicio30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: totalUsuarios },
      { count: usuariosOwner },
      { count: usuariosBuilder },
      { count: totalObras },
      { count: obrasEsteMes },
      { count: planoEssencial },
      { count: planoProfissional },
      { count: usuariosUltimos30dias },
      { data: obras30dias },
      { data: usuarios10 },
    ] = await Promise.all([
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }).eq("profile_type", "owner"),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }).eq("profile_type", "builder"),
      supabase.from("obras").select("*", { count: "exact", head: true }),
      supabase.from("obras").select("*", { count: "exact", head: true }).gte("criada_em", inicioMes),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }).eq("plano", "essencial"),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }).eq("plano", "profissional"),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }).gte("created_at", inicio30dias),
      supabase.from("obras").select("nome, localizacao, criada_em").order("criada_em", { ascending: false }).limit(5),
      supabase.from("user_profiles").select("first_name, last_name, profile_type, plano, created_at").order("created_at", { ascending: false }).limit(10),
    ])

    setMetrics({
      totalUsuarios: totalUsuarios ?? 0,
      usuariosOwner: usuariosOwner ?? 0,
      usuariosBuilder: usuariosBuilder ?? 0,
      totalObras: totalObras ?? 0,
      obrasEsteMes: obrasEsteMes ?? 0,
      planoEssencial: planoEssencial ?? 0,
      planoProfissional: planoProfissional ?? 0,
      usuariosUltimos30dias: usuariosUltimos30dias ?? 0,
    })

    setObrasRecentes(obras30dias ?? [])
    setUsuariosRecentes(usuarios10 ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  const statCards = [
    {
      label: "Total de usuários",
      value: fmt(metrics!.totalUsuarios),
      sub: `+${fmt(metrics!.usuariosUltimos30dias)} nos últimos 30 dias`,
      icon: Users,
      color: "blue",
    },
    {
      label: "Donos de obra",
      value: fmt(metrics!.usuariosOwner),
      sub: "Perfil: owner",
      icon: UserCheck,
      color: "green",
    },
    {
      label: "Construtores",
      value: fmt(metrics!.usuariosBuilder),
      sub: "Perfil: builder",
      icon: UserCog,
      color: "purple",
    },
    {
      label: "Total de obras",
      value: fmt(metrics!.totalObras),
      sub: `${fmt(metrics!.obrasEsteMes)} criadas este mês`,
      icon: Building2,
      color: "yellow",
    },
    {
      label: "Plano Essencial",
      value: fmt(metrics!.planoEssencial),
      sub: "Usuários ativos",
      icon: CreditCard,
      color: "slate",
    },
    {
      label: "Plano Profissional",
      value: fmt(metrics!.planoProfissional),
      sub: "Usuários ativos",
      icon: TrendingUp,
      color: "blue",
    },
  ]

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-400",
    green: "bg-green-500/20 text-green-400",
    purple: "bg-purple-500/20 text-purple-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
    slate: "bg-slate-600/40 text-slate-300",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Visão geral do OBREASY</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-3 bg-slate-800/50 border-slate-700/50">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center mb-2 ${colorMap[card.color]}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xl font-bold text-white leading-none">{card.value}</p>
              <p className="text-[11px] font-medium text-gray-400 mt-1 leading-tight">{card.label}</p>
              <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{card.sub}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Usuários recentes */}
        <Card className="p-4 bg-slate-800/50 border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Últimos cadastros</h3>
          </div>
          <div className="space-y-2">
            {usuariosRecentes.length === 0 && (
              <p className="text-xs text-gray-500">Nenhum usuário encontrado</p>
            )}
            {usuariosRecentes.map((u, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/30 last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">{u.first_name} {u.last_name}</p>
                  <p className="text-[10px] text-gray-500">
                    {u.profile_type === "owner" ? "Dono da Obra" : u.profile_type === "builder" ? "Construtor" : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    u.plano === "profissional" ? "bg-blue-500/20 text-blue-400" : "bg-slate-700 text-gray-400"
                  }`}>
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
            <Calendar className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Obras recentes</h3>
          </div>
          <div className="space-y-2">
            {obrasRecentes.length === 0 && (
              <p className="text-xs text-gray-500">Nenhuma obra encontrada</p>
            )}
            {obrasRecentes.map((o, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/30 last:border-0">
                <div>
                  <p className="text-sm text-white font-medium truncate max-w-[160px]">{o.nome}</p>
                  <p className="text-[10px] text-gray-500">
                    {o.localizacao?.cidade ?? "—"}, {o.localizacao?.estado ?? "—"}
                  </p>
                </div>
                <p className="text-[10px] text-gray-500">
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
