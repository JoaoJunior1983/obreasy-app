"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown, X, Ban, Clock, History, Tag } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Usuario {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  profile_type: string | null
  plano: string | null
  plano_expira_em: string | null
  status: string | null
  lead_source: string | null
  converted_at: string | null
  cancelled_at: string | null
  last_active_at: string | null
  created_at: string
  bairro: string
  bairros: string[]
  cidade: string
  estado: string
  cidades: string[]
  estados: string[]
  totalObras: number
  orcamentoTotal: number
  totalGasto: number
}

interface UserEvent {
  id: string
  event_type: string
  created_at: string
}

interface SubscriptionHistoryEntry {
  id: string
  plano_anterior: string | null
  plano_novo: string | null
  motivo: string | null
  created_at: string
}

type SortField = "nome" | "cidade" | "estado" | "obras" | "orcamento" | "gasto" | "cadastro" | "status"
type SortDir = "asc" | "desc"

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const EVENT_TRANSLATIONS: Record<string, string> = {
  signup: "Criou conta",
  trial_start: "Iniciou trial",
  profile_selected: "Selecionou perfil",
  first_obra: "Criou primeira obra",
  first_despesa: "Lançou primeira despesa",
  first_report: "Gerou primeiro relatório",
  subscription_started: "Assinou plano",
  plan_changed: "Alterou plano",
  plan_cancelled: "Cancelou plano",
  login: "Fez login",
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  trial: { label: "Trial", className: "bg-purple-500/20 text-purple-400" },
  active: { label: "Ativo", className: "bg-green-500/20 text-green-400" },
  cancelled: { label: "Cancelado", className: "bg-red-500/20 text-red-400" },
  expired: { label: "Expirado", className: "bg-orange-500/20 text-orange-400" },
  churned: { label: "Churned", className: "bg-gray-500/20 text-gray-400" },
}

const LEAD_SOURCE_LABELS: Record<string, string> = {
  organic: "Orgânico",
  newlp: "Nova LP",
  lp: "Landing Page",
  direct: "Direto",
  trial_code: "Código Trial",
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterPerfil, setFilterPerfil] = useState("todos")
  const [filterPlano, setFilterPlano] = useState("todos")
  const [filterEstado, setFilterEstado] = useState("todos")
  const [filterCidade, setFilterCidade] = useState("todos")
  const [filterBairro, setFilterBairro] = useState("todos")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [filterOrigem, setFilterOrigem] = useState("todos")
  const [sortField, setSortField] = useState<SortField>("cadastro")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [editingPlano, setEditingPlano] = useState(false)
  const [novoPlano, setNovoPlano] = useState("")
  const [savingPlano, setSavingPlano] = useState(false)

  const [userEvents, setUserEvents] = useState<UserEvent[]>([])
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistoryEntry[]>([])
  const [loadingModal, setLoadingModal] = useState(false)

  useEffect(() => { loadUsuarios() }, [])

  const loadUsuarios = async () => {
    const { supabase } = await import("@/lib/supabase")

    const [profilesRes, obrasRes, pagamentosRes] = await Promise.all([
      (supabase.from("user_profiles") as any).select("id, first_name, last_name, email, phone, profile_type, plano, plano_expira_em, status, lead_source, converted_at, cancelled_at, last_active_at, created_at").order("created_at", { ascending: false }),
      supabase.from("obras").select("id, user_id, orcamento, localizacao"),
      supabase.from("pagamentos").select("user_id, valor"),
    ])

    if (profilesRes.error) { console.error("Erro profiles:", profilesRes.error); setLoading(false); return }

    const profiles = (profilesRes.data ?? []) as any[]
    const obras = (obrasRes.data ?? []) as any[]
    const pagamentos = (pagamentosRes.data ?? []) as any[]

    const obrasPorUser: Record<string, any[]> = {}
    for (const o of obras) {
      if (!obrasPorUser[o.user_id]) obrasPorUser[o.user_id] = []
      obrasPorUser[o.user_id].push(o)
    }

    const gastoPorUser: Record<string, number> = {}
    for (const p of pagamentos) {
      gastoPorUser[p.user_id] = (gastoPorUser[p.user_id] ?? 0) + parseFloat(p.valor ?? "0")
    }

    const lista: Usuario[] = profiles.map(p => {
      const userObras = obrasPorUser[p.id] ?? []
      const obraComLocal = userObras.find((o: any) => o.localizacao?.cidade) ?? userObras[0]
      const toTitle = (s: string) => s.trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      const cidades = [...new Set(userObras.map((o: any) => o.localizacao?.cidade).filter(Boolean).map((c: string) => toTitle(c)))]
      const estados = [...new Set(userObras.map((o: any) => o.localizacao?.estado).filter(Boolean).map((e: string) => toTitle(e)))]
      const bairros = [...new Set(userObras.map((o: any) => o.localizacao?.bairro).filter(Boolean).map((b: string) => toTitle(b)))]
      const orcamentoTotal = userObras.reduce((s: number, o: any) => s + (o.orcamento ?? 0), 0)
      return {
        ...p,
        email: p.email ?? "—",
        bairro: bairros.join(", ") || "—",
        bairros,
        cidade: cidades.join(", ") || "—",
        estado: estados.join(", ") || "—",
        cidades,
        estados,
        totalObras: userObras.length,
        orcamentoTotal,
        totalGasto: gastoPorUser[p.id] ?? 0,
      }
    })

    setUsuarios(lista)
    setLoading(false)
  }

  const loadModalData = useCallback(async (userId: string) => {
    setLoadingModal(true)
    setUserEvents([])
    setSubscriptionHistory([])
    const { supabase } = await import("@/lib/supabase")

    const [eventsRes, historyRes] = await Promise.all([
      (supabase.from("user_events") as any)
        .select("id, event_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      (supabase.from("subscription_history") as any)
        .select("id, plano_anterior, plano_novo, motivo, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ])

    setUserEvents((eventsRes.data ?? []) as UserEvent[])
    setSubscriptionHistory((historyRes.data ?? []) as SubscriptionHistoryEntry[])
    setLoadingModal(false)
  }, [])

  const handleOpenModal = useCallback((u: Usuario) => {
    setSelectedUser(u)
    setNovoPlano(u.plano ?? "essencial")
    setEditingPlano(false)
    loadModalData(u.id)
  }, [loadModalData])

  const perfilLabel = (p: string | null) => {
    if (p === "owner") return "Dono da Obra"
    if (p === "builder") return "Construtor"
    return "—"
  }

  const planoEfetivo = (u: Usuario) => {
    return u.plano ?? "essencial"
  }

  const planoBadge = (plano: string) => {
    if (plano === "profissional") return "bg-blue-500/20 text-blue-400"
    if (plano === "trial") return "bg-purple-500/20 text-purple-400"
    return "bg-slate-700 text-gray-400"
  }

  const statusBadge = (status: string | null) => {
    const cfg = STATUS_CONFIG[status ?? ""] ?? { label: status ?? "—", className: "bg-slate-700 text-gray-400" }
    return cfg
  }

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—"
  const fmtDateTime = (d: string) => {
    const dt = new Date(d)
    return `${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
  }

  const trialStartDate = (u: Usuario): string | null => {
    if (!u.plano_expira_em) return null
    const d = new Date(u.plano_expira_em)
    d.setDate(d.getDate() - 7)
    return d.toISOString()
  }

  const estados = useMemo(() => ["todos", ...Array.from(new Set(usuarios.flatMap(u => u.estados))).sort()], [usuarios])
  const cidades = useMemo(() => {
    const base = filterEstado !== "todos" ? usuarios.filter(u => u.estados.includes(filterEstado)) : usuarios
    return ["todos", ...Array.from(new Set(base.flatMap(u => u.cidades))).sort()]
  }, [usuarios, filterEstado])
  const bairros = useMemo(() => {
    const base = filterCidade !== "todos" ? usuarios.filter(u => u.cidades.includes(filterCidade)) : usuarios
    return ["todos", ...Array.from(new Set(base.flatMap(u => u.bairros))).sort()]
  }, [usuarios, filterCidade])

  const filtered = useMemo(() => {
    let result = usuarios
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(u =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.cidade?.toLowerCase().includes(q) ||
        u.bairro?.toLowerCase().includes(q)
      )
    }
    if (filterPerfil !== "todos") result = result.filter(u => u.profile_type === filterPerfil)
    if (filterPlano !== "todos") result = result.filter(u => planoEfetivo(u) === filterPlano)
    if (filterEstado !== "todos") result = result.filter(u => u.estados.includes(filterEstado))
    if (filterCidade !== "todos") result = result.filter(u => u.cidades.includes(filterCidade))
    if (filterBairro !== "todos") result = result.filter(u => u.bairros.includes(filterBairro))
    if (filterStatus !== "todos") result = result.filter(u => u.status === filterStatus)
    if (filterOrigem !== "todos") result = result.filter(u => u.lead_source === filterOrigem)

    result = [...result].sort((a, b) => {
      let av: any, bv: any
      if (sortField === "nome") { av = `${a.first_name} ${a.last_name}`; bv = `${b.first_name} ${b.last_name}` }
      else if (sortField === "cidade") { av = a.cidade; bv = b.cidade }
      else if (sortField === "estado") { av = a.estado; bv = b.estado }
      else if (sortField === "obras") { av = a.totalObras; bv = b.totalObras }
      else if (sortField === "orcamento") { av = a.orcamentoTotal; bv = b.orcamentoTotal }
      else if (sortField === "gasto") { av = a.totalGasto; bv = b.totalGasto }
      else if (sortField === "status") { av = a.status ?? ""; bv = b.status ?? "" }
      else { av = a.created_at; bv = b.created_at }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return result
  }, [usuarios, search, filterPerfil, filterPlano, filterEstado, filterCidade, filterBairro, filterStatus, filterOrigem, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("asc") }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-600" />
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 ml-1 text-blue-400" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-400" />
  }

  const exportCSV = () => {
    const header = "Nome,Email,Telefone,Bairro,Cidade,Estado,Perfil,Plano,Status,Origem,Obras,Orçamento Total,Total Gasto,Cadastro,Data Conversão,Data Cancelamento"
    const rows = filtered.map(u =>
      `"${u.first_name} ${u.last_name}","${u.email}","${u.phone ?? ""}","${u.bairro}","${u.cidade}","${u.estado}","${u.profile_type ?? ""}","${u.plano ?? "essencial"}","${u.status ?? ""}","${u.lead_source ? (LEAD_SOURCE_LABELS[u.lead_source] ?? u.lead_source) : ""}","${u.totalObras}","${u.orcamentoTotal}","${u.totalGasto}","${new Date(u.created_at).toLocaleDateString("pt-BR")}","${u.converted_at ? new Date(u.converted_at).toLocaleDateString("pt-BR") : ""}","${u.cancelled_at ? new Date(u.cancelled_at).toLocaleDateString("pt-BR") : ""}"`
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `usuarios_obreasy_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSalvarPlano = async () => {
    if (!selectedUser || !novoPlano) return
    setSavingPlano(true)
    const { supabase } = await import("@/lib/supabase")
    await (supabase.from("user_profiles") as any).update({ plano: novoPlano }).eq("id", selectedUser.id)
    setUsuarios(prev => prev.map(u => u.id === selectedUser.id ? { ...u, plano: novoPlano } : u))
    setSelectedUser(prev => prev ? { ...prev, plano: novoPlano } : null)
    setEditingPlano(false)
    setSavingPlano(false)
  }

  const handleCancelarPlano = async () => {
    if (!selectedUser) return
    if (!confirm(`Cancelar o plano de ${selectedUser.first_name}? O usuário voltará para o plano Essencial.`)) return
    setSavingPlano(true)
    const { supabase } = await import("@/lib/supabase")
    await (supabase.from("user_profiles") as any).update({ plano: "essencial", plano_expira_em: null }).eq("id", selectedUser.id)
    setUsuarios(prev => prev.map(u => u.id === selectedUser.id ? { ...u, plano: "essencial", plano_expira_em: null } : u))
    setSelectedUser(prev => prev ? { ...prev, plano: "essencial", plano_expira_em: null } : null)
    setEditingPlano(false)
    setSavingPlano(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} de {usuarios.length} usuários</p>
        </div>
        <Button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white gap-1" style={{ fontSize: "11px", height: "28px", padding: "0 10px" }}>
          <Download className="w-3 h-3" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <Input
            placeholder="Buscar nome, e-mail, telefone, cidade, bairro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 w-full"
          />
        </div>
        {/* Filtros linha 1: perfil, plano, status, origem */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select value={filterPerfil} onChange={e => setFilterPerfil(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-md cursor-pointer px-2" style={{ fontSize: "12px", height: "32px" }}>
            <option value="todos">Todos os perfis</option>
            <option value="owner">Dono da Obra</option>
            <option value="builder">Construtor</option>
          </select>
          <select value={filterPlano} onChange={e => setFilterPlano(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-md cursor-pointer px-2" style={{ fontSize: "12px", height: "32px" }}>
            <option value="todos">Todos os planos</option>
            <option value="essencial">Essencial</option>
            <option value="profissional">Profissional</option>
            <option value="trial">Trial</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-md cursor-pointer px-2" style={{ fontSize: "12px", height: "32px" }}>
            <option value="todos">Todos os status</option>
            <option value="trial">Trial</option>
            <option value="active">Ativo</option>
            <option value="cancelled">Cancelado</option>
            <option value="expired">Expirado</option>
            <option value="churned">Churned</option>
          </select>
          <select value={filterOrigem} onChange={e => setFilterOrigem(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-md cursor-pointer px-2" style={{ fontSize: "12px", height: "32px" }}>
            <option value="todos">Todas as origens</option>
            <option value="organic">Orgânico</option>
            <option value="newlp">Nova LP</option>
            <option value="lp">Landing Page</option>
            <option value="direct">Direto</option>
            <option value="trial_code">Código Trial</option>
          </select>
        </div>
        {/* Filtros linha 2: localização */}
        <div className="grid grid-cols-3 gap-2">
          <select value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setFilterCidade("todos"); setFilterBairro("todos") }} className="bg-slate-800 border border-slate-700 text-white rounded-md cursor-pointer px-2" style={{ fontSize: "12px", height: "32px" }}>
            {estados.map(e => <option key={e} value={e}>{e === "todos" ? "Estado" : e}</option>)}
          </select>
          <select value={filterCidade} onChange={e => { setFilterCidade(e.target.value); setFilterBairro("todos") }} className="bg-slate-800 border border-slate-700 text-white rounded-md cursor-pointer px-2" style={{ fontSize: "12px", height: "32px" }}>
            {cidades.map(c => <option key={c} value={c}>{c === "todos" ? "Cidade" : c}</option>)}
          </select>
          <select value={filterBairro} onChange={e => setFilterBairro(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-md cursor-pointer px-2" style={{ fontSize: "12px", height: "32px" }}>
            {bairros.map(b => <option key={b} value={b}>{b === "todos" ? "Bairro" : b}</option>)}
          </select>
        </div>
      </div>

      {/* Totais resumo */}
      <div className="space-y-2">
        <Card className="bg-slate-800/50 border-slate-700/50 p-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">Orçamento total</p>
          <p className="text-base font-bold text-white">{fmt(filtered.reduce((s, u) => s + u.orcamentoTotal, 0))}</p>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-slate-800/50 border-slate-700/50 p-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">Total obras</p>
            <p className="text-base font-bold text-white">{filtered.reduce((s, u) => s + u.totalObras, 0)}</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 p-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">Total gasto</p>
            <p className="text-base font-bold text-white">{fmt(filtered.reduce((s, u) => s + u.totalGasto, 0))}</p>
          </Card>
        </div>
      </div>

      {/* Tabela */}
      <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-white" onClick={() => toggleSort("nome")}>
                  <span className="flex items-center">Nome <SortIcon field="nome" /></span>
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Contato</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell cursor-pointer hover:text-white" onClick={() => toggleSort("cidade")}>
                  <span className="flex items-center">Localização <SortIcon field="cidade" /></span>
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Perfil</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Plano</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-white" onClick={() => toggleSort("status")}>
                  <span className="flex items-center">Status <SortIcon field="status" /></span>
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell cursor-pointer hover:text-white" onClick={() => toggleSort("obras")}>
                  <span className="flex items-center">Obras <SortIcon field="obras" /></span>
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden xl:table-cell cursor-pointer hover:text-white" onClick={() => toggleSort("orcamento")}>
                  <span className="flex items-center">Orçamento <SortIcon field="orcamento" /></span>
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden xl:table-cell cursor-pointer hover:text-white" onClick={() => toggleSort("gasto")}>
                  <span className="flex items-center">Gasto <SortIcon field="gasto" /></span>
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell cursor-pointer hover:text-white" onClick={() => toggleSort("cadastro")}>
                  <span className="flex items-center">Cadastro <SortIcon field="cadastro" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-500">Nenhum usuário encontrado</td></tr>
              )}
              {filtered.map(u => {
                const sb = statusBadge(u.status)
                return (
                  <tr
                    key={u.id}
                    onClick={() => handleOpenModal(u)}
                    className="border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 text-white font-medium text-xs">{u.first_name} {u.last_name}</td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <div className="space-y-0.5">
                        {u.phone ? (
                          <a href={`https://wa.me/55${u.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-green-400 hover:text-green-300 text-xs">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            {u.phone}
                          </a>
                        ) : <span className="text-gray-500 text-xs">—</span>}
                        {u.email !== "—" && <p className="text-gray-400 text-[10px] truncate max-w-[140px]">{u.email}</p>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <div>
                        <p className="text-gray-300 text-xs">{u.cidade}, {u.estado}</p>
                        {u.bairro !== "—" && <p className="text-gray-500 text-[10px]">{u.bairro}</p>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${u.profile_type === "builder" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                        {perfilLabel(u.profile_type)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${planoBadge(planoEfetivo(u))}`}>
                        {planoEfetivo(u)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sb.className}`}>
                        {sb.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-300 text-xs hidden lg:table-cell">{u.totalObras}</td>
                    <td className="px-3 py-2.5 text-gray-300 text-xs hidden xl:table-cell">{u.orcamentoTotal > 0 ? fmt(u.orcamentoTotal) : "—"}</td>
                    <td className="px-3 py-2.5 text-gray-300 text-xs hidden xl:table-cell">{u.totalGasto > 0 ? fmt(u.totalGasto) : "—"}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs hidden lg:table-cell">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal detalhes */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white">{selectedUser.first_name} {selectedUser.last_name}</h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusBadge(selectedUser.status).className}`}>
                  {statusBadge(selectedUser.status).label}
                </span>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-300 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 mb-4 text-sm">
              {/* Dados de contato */}
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Dados de contato</p>
              {[
                { label: "E-mail", value: selectedUser.email },
                { label: "Telefone", value: selectedUser.phone || "—" },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white text-xs">{item.value}</span>
                </div>
              ))}

              {/* Localização */}
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Localização</p>
              {[
                { label: "Bairro", value: selectedUser.bairro },
                { label: "Cidade", value: selectedUser.cidade },
                { label: "Estado", value: selectedUser.estado },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white text-xs">{item.value}</span>
                </div>
              ))}

              {/* Origem */}
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Origem
              </p>
              <div className="flex justify-between">
                <span className="text-gray-400">Lead source</span>
                <span className="text-white text-xs">
                  {selectedUser.lead_source ? (LEAD_SOURCE_LABELS[selectedUser.lead_source] ?? selectedUser.lead_source) : "—"}
                </span>
              </div>

              {/* Datas-chave */}
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Datas-chave
              </p>
              {[
                { label: "Data cadastro", value: fmtDate(selectedUser.created_at) },
                { label: "Data início trial", value: fmtDate(trialStartDate(selectedUser)) },
                { label: "Data conversão", value: fmtDate(selectedUser.converted_at) },
                { label: "Data cancelamento", value: fmtDate(selectedUser.cancelled_at) },
                { label: "Última atividade", value: fmtDate(selectedUser.last_active_at) },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white text-xs">{item.value}</span>
                </div>
              ))}

              {/* Dados das obras */}
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Dados das obras</p>
              {[
                { label: "Perfil", value: perfilLabel(selectedUser.profile_type) },
                { label: "Total de obras", value: selectedUser.totalObras.toString() },
                { label: "Orçamento total", value: selectedUser.orcamentoTotal > 0 ? fmt(selectedUser.orcamentoTotal) : "—" },
                { label: "Total gasto", value: selectedUser.totalGasto > 0 ? fmt(selectedUser.totalGasto) : "—" },
                ...(selectedUser.orcamentoTotal > 0 && selectedUser.totalGasto > 0 ? [{
                  label: "% consumido",
                  value: `${((selectedUser.totalGasto / selectedUser.orcamentoTotal) * 100).toFixed(1)}%`
                }] : []),
                ...(selectedUser.plano_expira_em ? [{ label: "Plano expira", value: new Date(selectedUser.plano_expira_em).toLocaleDateString("pt-BR") }] : []),
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white text-xs">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Gestão de plano */}
            <div className="border-t border-slate-700 pt-4">
              <p className="text-xs text-gray-400 mb-2">Plano atual</p>
              {!editingPlano ? (
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold px-2 py-1 rounded ${planoBadge(selectedUser.plano ?? "essencial")}`}>
                    {selectedUser.plano ?? "essencial"}
                  </span>
                  <div className="flex gap-2">
                    {(selectedUser.plano === "profissional" || selectedUser.plano === "trial") && (
                      <button
                        onClick={handleCancelarPlano}
                        disabled={savingPlano}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Ban className="w-3 h-3" />
                        Cancelar plano
                      </button>
                    )}
                    <button onClick={() => setEditingPlano(true)} className="text-xs text-blue-400 hover:text-blue-300">
                      Alterar plano
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={novoPlano}
                    onChange={e => setNovoPlano(e.target.value)}
                    className="w-full h-9 text-sm bg-slate-700 border border-slate-600 text-white rounded-md px-2"
                  >
                    <option value="essencial">Essencial</option>
                    <option value="profissional">Profissional</option>
                    <option value="trial">Trial</option>
                  </select>
                  <div className="flex gap-2">
                    <Button onClick={() => setEditingPlano(false)} className="flex-1 h-8 bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600 text-xs">Cancelar</Button>
                    <Button onClick={handleSalvarPlano} disabled={savingPlano} className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
                      {savingPlano ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Histórico de atividade */}
            <div className="border-t border-slate-700 pt-4 mt-4">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <History className="w-3 h-3" /> Histórico de atividade
              </p>
              {loadingModal ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  <span className="text-xs text-gray-500">Carregando...</span>
                </div>
              ) : userEvents.length === 0 ? (
                <p className="text-xs text-gray-600 py-1">Nenhum evento registrado</p>
              ) : (
                <div className="space-y-1.5">
                  {userEvents.map(ev => (
                    <div key={ev.id} className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/50">
                      <span className="text-xs text-gray-300">{EVENT_TRANSLATIONS[ev.event_type] ?? ev.event_type}</span>
                      <span className="text-[10px] text-gray-500 ml-2 flex-shrink-0">{fmtDateTime(ev.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Histórico de plano */}
            <div className="border-t border-slate-700 pt-4 mt-4">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <History className="w-3 h-3" /> Histórico de plano
              </p>
              {loadingModal ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  <span className="text-xs text-gray-500">Carregando...</span>
                </div>
              ) : subscriptionHistory.length === 0 ? (
                <p className="text-xs text-gray-600 py-1">Nenhuma alteração de plano registrada</p>
              ) : (
                <div className="space-y-1.5">
                  {subscriptionHistory.map(sh => (
                    <div key={sh.id} className="py-1.5 px-2 rounded bg-slate-900/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${planoBadge(sh.plano_anterior ?? "essencial")}`}>
                            {sh.plano_anterior ?? "—"}
                          </span>
                          <span className="text-gray-600">→</span>
                          <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${planoBadge(sh.plano_novo ?? "essencial")}`}>
                            {sh.plano_novo ?? "—"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 ml-2 flex-shrink-0">{fmtDateTime(sh.created_at)}</span>
                      </div>
                      {sh.motivo && (
                        <p className="text-[10px] text-gray-500 mt-0.5">Motivo: {sh.motivo}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
