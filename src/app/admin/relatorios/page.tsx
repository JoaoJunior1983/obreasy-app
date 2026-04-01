"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import {
  FileText, Download, Loader2, XCircle, Users, Building2,
  DollarSign, CreditCard, TrendingUp, FileSpreadsheet,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const fmtCurrency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

interface Filters {
  dataInicio: string
  dataFim: string
  estado: string
  cidade: string
  bairro: string
  perfil: string
  plano: string
  status: string
  valorMin: string
  valorMax: string
}

const EMPTY_FILTERS: Filters = {
  dataInicio: "", dataFim: "", estado: "", cidade: "", bairro: "",
  perfil: "todos", plano: "todos", status: "todos", valorMin: "", valorMax: "",
}

interface ProfileRow {
  id: string
  first_name: string
  last_name: string
  phone: string
  email?: string
  profile_type: string | null
  plano: string | null
  status: string | null
  created_at: string | null
  last_active_at: string | null
}

interface ObraRow {
  id: string
  user_id: string
  nome: string
  localizacao: any
  tipo: string
  orcamento: number | null
  valor_contratado: number | null
  data_inicio: string | null
  data_termino: string | null
  criada_em: string | null
}

interface DespesaRow {
  user_id: string
  obra_id: string
  valor: number
}

interface PagamentoRow {
  user_id: string
  valor: number
}

interface Summary {
  totalClientes: number
  totalObras: number
  somaOrcamentos: number
  totalGasto: number
  ticketMedio: number
}

interface ClientReport {
  profile: ProfileRow
  obras: (ObraRow & { totalGasto: number })[]
  totalOrcamento: number
  totalGasto: number
  totalDespesas: number
  cidade: string
  estado: string
  bairro: string
  nivelAtividade: string
}

function activityLevel(lastActive: string | null): string {
  if (!lastActive) return "Inativo"
  const diff = (Date.now() - new Date(lastActive).getTime()) / 86_400_000
  if (diff <= 7) return "Alto"
  if (diff <= 30) return "Moderado"
  return "Baixo"
}

function obraLocation(loc: any): string {
  if (!loc) return "—"
  const parts = [loc.bairro, loc.cidade, loc.estado].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "—"
}

export default function AdminRelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingCsv, setGeneratingCsv] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const [allProfiles, setAllProfiles] = useState<ProfileRow[]>([])
  const [allObras, setAllObras] = useState<ObraRow[]>([])
  const [allDespesas, setAllDespesas] = useState<DespesaRow[]>([])
  const [allPagamentos, setAllPagamentos] = useState<PagamentoRow[]>([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { supabase } = await import("@/lib/supabase")

    const [rProfiles, rObras, rDespesas, rPagamentos] = await Promise.all([
      (supabase.from("user_profiles") as any).select(
        "id, first_name, last_name, phone, email, profile_type, plano, status, created_at, last_active_at"
      ),
      (supabase.from("obras") as any).select(
        "id, user_id, nome, localizacao, tipo, orcamento, valor_contratado, data_inicio, data_termino, criada_em"
      ),
      (supabase.from("despesas") as any).select("user_id, obra_id, valor"),
      (supabase.from("pagamentos") as any).select("user_id, valor"),
    ])

    setAllProfiles(rProfiles.data ?? [])
    setAllObras(rObras.data ?? [])
    setAllDespesas(rDespesas.data ?? [])
    setAllPagamentos(rPagamentos.data ?? [])
    setLoading(false)
  }

  const estados = useMemo(() => {
    const set = new Set<string>()
    for (const o of allObras) { if ((o.localizacao as any)?.estado) set.add((o.localizacao as any).estado) }
    return Array.from(set).sort()
  }, [allObras])

  const cidadesFiltradas = useMemo(() => {
    const base = filters.estado
      ? allObras.filter(o => (o.localizacao as any)?.estado === filters.estado)
      : allObras
    const set = new Set<string>()
    for (const o of base) { if ((o.localizacao as any)?.cidade) set.add((o.localizacao as any).cidade) }
    return Array.from(set).sort()
  }, [allObras, filters.estado])

  const bairrosFiltrados = useMemo(() => {
    let base = allObras
    if (filters.estado) base = base.filter(o => (o.localizacao as any)?.estado === filters.estado)
    if (filters.cidade) base = base.filter(o => (o.localizacao as any)?.cidade === filters.cidade)
    const set = new Set<string>()
    for (const o of base) { if ((o.localizacao as any)?.bairro) set.add((o.localizacao as any).bairro) }
    return Array.from(set).sort()
  }, [allObras, filters.estado, filters.cidade])

  const { filteredData, summary } = useMemo(() => {
    const despesaByObra = new Map<string, number>()
    for (const d of allDespesas) despesaByObra.set(d.obra_id, (despesaByObra.get(d.obra_id) ?? 0) + d.valor)

    const despesaCountByUser = new Map<string, number>()
    for (const d of allDespesas) despesaCountByUser.set(d.user_id, (despesaCountByUser.get(d.user_id) ?? 0) + 1)

    let fp = [...allProfiles]
    if (filters.perfil !== "todos") fp = fp.filter(p => p.profile_type === (filters.perfil === "owner" ? "owner" : "builder"))
    if (filters.plano !== "todos") fp = fp.filter(p => p.plano === filters.plano)
    if (filters.status !== "todos") fp = fp.filter(p => p.status === filters.status)

    const reports: ClientReport[] = []

    for (const profile of fp) {
      let userObras = allObras.filter(o => o.user_id === profile.id)

      if (filters.estado) userObras = userObras.filter(o => (o.localizacao as any)?.estado === filters.estado)
      if (filters.cidade) userObras = userObras.filter(o => (o.localizacao as any)?.cidade === filters.cidade)
      if (filters.bairro) userObras = userObras.filter(o => (o.localizacao as any)?.bairro === filters.bairro)

      if (filters.dataInicio) userObras = userObras.filter(o => o.criada_em && o.criada_em >= filters.dataInicio)
      if (filters.dataFim) {
        const end = new Date(filters.dataFim)
        end.setDate(end.getDate() + 1)
        userObras = userObras.filter(o => o.criada_em && o.criada_em < end.toISOString())
      }

      if (filters.valorMin) { const min = parseFloat(filters.valorMin); userObras = userObras.filter(o => (o.orcamento ?? 0) >= min) }
      if (filters.valorMax) { const max = parseFloat(filters.valorMax); userObras = userObras.filter(o => (o.orcamento ?? 0) <= max) }

      const hasLocationOrValueFilter = filters.estado || filters.cidade || filters.bairro || filters.valorMin || filters.valorMax || filters.dataInicio || filters.dataFim
      if (hasLocationOrValueFilter && userObras.length === 0) continue

      const obrasWithGasto = userObras.map(o => ({ ...o, totalGasto: despesaByObra.get(o.id) ?? 0 }))
      const totalOrc = obrasWithGasto.reduce((s, o) => s + (o.orcamento ?? 0), 0)
      const totalGasto = obrasWithGasto.reduce((s, o) => s + o.totalGasto, 0)

      const firstObra = obrasWithGasto[0]
      const cidade = firstObra ? (firstObra.localizacao as any)?.cidade ?? "—" : "—"
      const estado = firstObra ? (firstObra.localizacao as any)?.estado ?? "—" : "—"
      const bairro = firstObra ? (firstObra.localizacao as any)?.bairro ?? "—" : "—"

      reports.push({
        profile, obras: obrasWithGasto, totalOrcamento: totalOrc, totalGasto,
        totalDespesas: despesaCountByUser.get(profile.id) ?? 0,
        cidade, estado, bairro, nivelAtividade: activityLevel(profile.last_active_at),
      })
    }

    const totalClientes = reports.length
    const totalObras = reports.reduce((s, r) => s + r.obras.length, 0)
    const somaOrcamentos = reports.reduce((s, r) => s + r.totalOrcamento, 0)
    const totalGasto = reports.reduce((s, r) => s + r.totalGasto, 0)
    const ticketMedio = totalClientes > 0 ? somaOrcamentos / totalClientes : 0

    return {
      filteredData: reports,
      summary: { totalClientes, totalObras, somaOrcamentos, totalGasto, ticketMedio } as Summary,
    }
  }, [allProfiles, allObras, allDespesas, allPagamentos, filters])

  const handleClearFilters = () => setFilters(EMPTY_FILTERS)

  const updateFilter = (key: keyof Filters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }))

  const handleGenerateCSV = () => {
    setGeneratingCsv(true)
    try {
      const header = "Nome,Email,Telefone,Bairro,Cidade,Estado,Perfil,Plano,Status,Obras,Orçamento Total,Total Gasto,Atividade"
      const rows = filteredData.map(r =>
        `"${r.profile.first_name} ${r.profile.last_name}","${r.profile.email ?? ""}","${r.profile.phone ?? ""}","${r.bairro}","${r.cidade}","${r.estado}","${r.profile.profile_type ?? ""}","${r.profile.plano ?? ""}","${r.profile.status ?? ""}","${r.obras.length}","${r.totalOrcamento}","${r.totalGasto}","${r.nivelAtividade}"`
      )
      const csv = [header, ...rows].join("\n")
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `obreasy-relatorio-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGeneratingCsv(false)
    }
  }

  const handleGeneratePDF = async () => {
    setGenerating(true)
    try {
      const jsPDF = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default

      const doc = new jsPDF("p", "mm", "a4")
      const pageWidth = doc.internal.pageSize.getWidth()
      let y = 15

      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("OBREASY — Relatório Administrativo", pageWidth / 2, y, { align: "center" })
      y += 8

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        pageWidth / 2, y, { align: "center" }
      )
      y += 6

      const activeFilters: string[] = []
      if (filters.dataInicio) activeFilters.push(`De: ${new Date(filters.dataInicio).toLocaleDateString("pt-BR")}`)
      if (filters.dataFim) activeFilters.push(`Até: ${new Date(filters.dataFim).toLocaleDateString("pt-BR")}`)
      if (filters.estado) activeFilters.push(`Estado: ${filters.estado}`)
      if (filters.cidade) activeFilters.push(`Cidade: ${filters.cidade}`)
      if (filters.bairro) activeFilters.push(`Bairro: ${filters.bairro}`)
      if (filters.perfil !== "todos") activeFilters.push(`Perfil: ${filters.perfil === "owner" ? "Dono da Obra" : "Construtor"}`)
      if (filters.plano !== "todos") activeFilters.push(`Plano: ${filters.plano}`)
      if (filters.status !== "todos") activeFilters.push(`Status: ${filters.status}`)
      if (filters.valorMin) activeFilters.push(`Valor mín: ${fmtCurrency(parseFloat(filters.valorMin))}`)
      if (filters.valorMax) activeFilters.push(`Valor máx: ${fmtCurrency(parseFloat(filters.valorMax))}`)

      if (activeFilters.length > 0) {
        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text(`Filtros: ${activeFilters.join(" | ")}`, pageWidth / 2, y, { align: "center" })
        y += 6
      }

      doc.setDrawColor(180)
      doc.setFillColor(245, 245, 245)
      doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, "FD")
      doc.setFontSize(8)
      doc.setTextColor(80)
      doc.setFont("helvetica", "bold")
      const summaryItems = [
        `Clientes: ${summary.totalClientes}`,
        `Obras: ${summary.totalObras}`,
        `Orçamentos: ${fmtCurrency(summary.somaOrcamentos)}`,
        `Gasto: ${fmtCurrency(summary.totalGasto)}`,
        `Ticket: ${fmtCurrency(summary.ticketMedio)}`,
      ]
      const colW = (pageWidth - 28) / summaryItems.length
      summaryItems.forEach((item, i) => {
        doc.text(item, 14 + colW * i + colW / 2, y + 13, { align: "center" })
      })
      y += 28
      doc.setTextColor(0)
      doc.setFont("helvetica", "normal")

      const perfilLabel = (t: string | null) => t === "owner" ? "Dono" : t === "builder" ? "Construtor" : "—"

      const clientRows = filteredData.map(r => [
        `${r.profile.first_name} ${r.profile.last_name}`,
        r.profile.phone ?? "—",
        r.profile.email ?? "—",
        [r.bairro, r.cidade, r.estado].filter(v => v !== "—").join(", ") || "—",
        perfilLabel(r.profile.profile_type),
        r.profile.plano ?? "—",
        r.profile.status ?? "—",
        r.obras.length.toString(),
        fmtCurrency(r.totalOrcamento),
        fmtCurrency(r.totalGasto),
      ])

      autoTable(doc, {
        startY: y,
        head: [["Nome", "Telefone", "Email", "Localização", "Perfil", "Plano", "Status", "Obras", "Orçamento", "Gasto"]],
        body: clientRows,
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 1.5 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold", fontSize: 6.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 },
      })

      y = (doc as any).lastAutoTable.finalY + 8

      for (const client of filteredData) {
        if (client.obras.length === 0) continue

        if (y > doc.internal.pageSize.getHeight() - 50) { doc.addPage(); y = 15 }

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(`${client.profile.first_name} ${client.profile.last_name}`, 14, y)
        y += 4

        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(80)
        const indicators = [
          `Obras: ${client.obras.length}`,
          `Despesas: ${client.totalDespesas}`,
          `Atividade: ${client.nivelAtividade}`,
          `Último acesso: ${client.profile.last_active_at ? new Date(client.profile.last_active_at).toLocaleDateString("pt-BR") : "—"}`,
        ]
        doc.text(indicators.join("  •  "), 14, y)
        doc.setTextColor(0)
        y += 4

        const obraRows = client.obras.map(o => {
          const saldo = (o.orcamento ?? 0) - o.totalGasto
          return [
            o.nome,
            obraLocation(o.localizacao),
            o.tipo,
            fmtCurrency(o.orcamento ?? 0),
            fmtCurrency(o.totalGasto),
            fmtCurrency(saldo),
            o.data_inicio ? new Date(o.data_inicio).toLocaleDateString("pt-BR") : "—",
            o.data_termino ? new Date(o.data_termino).toLocaleDateString("pt-BR") : "—",
          ]
        })

        autoTable(doc, {
          startY: y,
          head: [["Obra", "Localização", "Tipo", "Orçamento", "Gasto", "Saldo", "Início", "Término"]],
          body: obraRows,
          theme: "grid",
          styles: { fontSize: 6.5, cellPadding: 1.5 },
          headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: "bold", fontSize: 6.5 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 18, right: 10 },
        })

        y = (doc as any).lastAutoTable.finalY + 6
      }

      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" })
      }

      doc.save(`obreasy-relatorio-${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (err) {
      console.error("Erro ao gerar PDF:", err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  const summaryCards = [
    { icon: Users, label: "Total de clientes", value: summary.totalClientes.toLocaleString("pt-BR"), color: "bg-blue-500/20 text-blue-400" },
    { icon: Building2, label: "Total de obras", value: summary.totalObras.toLocaleString("pt-BR"), color: "bg-green-500/20 text-green-400" },
    { icon: DollarSign, label: "Soma orçamentos", value: fmtCurrency(summary.somaOrcamentos), color: "bg-emerald-500/20 text-emerald-400" },
    { icon: CreditCard, label: "Total gasto", value: fmtCurrency(summary.totalGasto), color: "bg-red-500/20 text-red-400" },
    { icon: TrendingUp, label: "Ticket médio", value: fmtCurrency(summary.ticketMedio), color: "bg-cyan-500/20 text-cyan-400" },
  ]

  const perfilLabel = (t: string | null) => t === "owner" ? "Dono" : t === "builder" ? "Construtor" : "—"

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Relatórios PDF</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Gere relatórios administrativos com filtros detalhados</p>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <Card className="p-3 sm:p-5 bg-slate-800/50 border-slate-700/50">
        <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">

          <div>
            <Label className="text-xs text-gray-400">Data início</Label>
            <Input type="date" value={filters.dataInicio} onChange={e => updateFilter("dataInicio", e.target.value)}
              className="h-9 text-sm bg-slate-700 border-slate-600 text-white mt-1" />
          </div>
          <div>
            <Label className="text-xs text-gray-400">Data fim</Label>
            <Input type="date" value={filters.dataFim} onChange={e => updateFilter("dataFim", e.target.value)}
              className="h-9 text-sm bg-slate-700 border-slate-600 text-white mt-1" />
          </div>

          <div>
            <Label className="text-xs text-gray-400">Estado</Label>
            <select value={filters.estado}
              onChange={e => { updateFilter("estado", e.target.value); updateFilter("cidade", ""); updateFilter("bairro", "") }}
              className="w-full h-9 mt-1 text-sm bg-slate-700 border border-slate-600 text-white rounded-md px-2 cursor-pointer">
              <option value="">Todos</option>
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Cidade</Label>
            <select value={filters.cidade}
              onChange={e => { updateFilter("cidade", e.target.value); updateFilter("bairro", "") }}
              className="w-full h-9 mt-1 text-sm bg-slate-700 border border-slate-600 text-white rounded-md px-2 cursor-pointer">
              <option value="">Todas</option>
              {cidadesFiltradas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Bairro</Label>
            <select value={filters.bairro}
              onChange={e => updateFilter("bairro", e.target.value)}
              className="w-full h-9 mt-1 text-sm bg-slate-700 border border-slate-600 text-white rounded-md px-2 cursor-pointer">
              <option value="">Todos</option>
              {bairrosFiltrados.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Perfil</Label>
            <select value={filters.perfil} onChange={e => updateFilter("perfil", e.target.value)}
              className="w-full h-9 mt-1 text-sm bg-slate-700 border border-slate-600 text-white rounded-md px-2 cursor-pointer">
              <option value="todos">Todos</option>
              <option value="owner">Dono da Obra</option>
              <option value="builder">Construtor</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Plano</Label>
            <select value={filters.plano} onChange={e => updateFilter("plano", e.target.value)}
              className="w-full h-9 mt-1 text-sm bg-slate-700 border border-slate-600 text-white rounded-md px-2 cursor-pointer">
              <option value="todos">Todos</option>
              <option value="essencial">Essencial</option>
              <option value="profissional">Profissional</option>
              <option value="trial">Trial</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Status</Label>
            <select value={filters.status} onChange={e => updateFilter("status", e.target.value)}
              className="w-full h-9 mt-1 text-sm bg-slate-700 border border-slate-600 text-white rounded-md px-2 cursor-pointer">
              <option value="todos">Todos</option>
              <option value="trial">Trial</option>
              <option value="active">Ativo</option>
              <option value="cancelled">Cancelado</option>
              <option value="expired">Expirado</option>
            </select>
          </div>

          <div>
            <Label className="text-xs text-gray-400">Orçamento mínimo</Label>
            <Input type="number" placeholder="R$ 0" value={filters.valorMin} onChange={e => updateFilter("valorMin", e.target.value)}
              className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-gray-400">Orçamento máximo</Label>
            <Input type="number" placeholder="R$ ∞" value={filters.valorMax} onChange={e => updateFilter("valorMax", e.target.value)}
              className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 mt-1" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-5">
          <Button onClick={handleGeneratePDF} disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm gap-1.5 w-full sm:w-auto">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {generating ? "Gerando..." : "Gerar PDF"}
          </Button>
          <Button onClick={handleGenerateCSV} disabled={generatingCsv}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-1.5 w-full sm:w-auto">
            {generatingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Exportar CSV
          </Button>
          <Button onClick={handleClearFilters}
            className="bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600 text-sm gap-1.5 w-full sm:w-auto">
            <XCircle className="w-3.5 h-3.5" />
            Limpar filtros
          </Button>
        </div>
      </Card>

      {/* ── Summary cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {summaryCards.map(card => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-2.5 sm:p-3 bg-slate-800/50 border-slate-700/50">
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center mb-1.5 sm:mb-2 ${card.color}`}>
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <p className="text-base sm:text-xl font-bold text-white leading-none truncate">{card.value}</p>
              <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 mt-1 leading-tight">{card.label}</p>
            </Card>
          )
        })}
      </div>

      {/* ── Preview table ──────────────────────────────────────────── */}
      <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700/50">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <FileText className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Pré-visualização</h3>
          <span className="text-[10px] text-gray-500 ml-auto">
            {filteredData.length} cliente{filteredData.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filteredData.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">Nenhum cliente encontrado com os filtros aplicados</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {filteredData.slice(0, 50).map(r => (
                <div key={r.profile.id} className="p-2.5 bg-slate-700/30 rounded-lg border border-slate-700/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">{r.profile.first_name} {r.profile.last_name}</span>
                    <div className="flex gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        r.profile.plano === "profissional" ? "bg-purple-500/20 text-purple-400"
                          : r.profile.plano === "trial" ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>{r.profile.plano ?? "—"}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        r.profile.status === "active" ? "bg-green-500/20 text-green-400"
                          : r.profile.status === "cancelled" ? "bg-red-500/20 text-red-400"
                          : r.profile.status === "trial" ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-slate-700 text-gray-400"
                      }`}>{r.profile.status ?? "—"}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {perfilLabel(r.profile.profile_type)} · {[r.bairro, r.cidade, r.estado].filter(v => v !== "—").join(", ") || "—"}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-700/50">
                    <div>
                      <p className="text-[9px] text-gray-500">Obras</p>
                      <p className="text-[11px] font-medium text-white">{r.obras.length}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Orçamento</p>
                      <p className="text-[11px] font-medium text-white">{fmtCurrency(r.totalOrcamento)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Gasto</p>
                      <p className="text-[11px] font-medium text-white">{fmtCurrency(r.totalGasto)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      r.nivelAtividade === "Alto" ? "bg-green-400" : r.nivelAtividade === "Moderado" ? "bg-yellow-400" : "bg-red-400"
                    }`} />
                    <span className="text-[10px] text-gray-400">Atividade: {r.nivelAtividade}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Nome</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Perfil</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Plano</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Localização</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Obras</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Orçamento</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Total gasto</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Atividade</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 50).map(r => (
                    <tr key={r.profile.id} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors">
                      <td className="py-2 px-2 text-white font-medium whitespace-nowrap">{r.profile.first_name} {r.profile.last_name}</td>
                      <td className="py-2 px-2 text-gray-400">{perfilLabel(r.profile.profile_type)}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.profile.plano === "profissional" ? "bg-purple-500/20 text-purple-400"
                            : r.profile.plano === "trial" ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>{r.profile.plano ?? "—"}</span>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.profile.status === "active" ? "bg-green-500/20 text-green-400"
                            : r.profile.status === "cancelled" ? "bg-red-500/20 text-red-400"
                            : r.profile.status === "trial" ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-slate-700 text-gray-400"
                        }`}>{r.profile.status ?? "—"}</span>
                      </td>
                      <td className="py-2 px-2 text-gray-400 max-w-[180px] truncate">
                        {[r.bairro, r.cidade, r.estado].filter(v => v !== "—").join(", ") || "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-300">{r.obras.length}</td>
                      <td className="py-2 px-2 text-right text-gray-300">{fmtCurrency(r.totalOrcamento)}</td>
                      <td className="py-2 px-2 text-right text-gray-300">{fmtCurrency(r.totalGasto)}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            r.nivelAtividade === "Alto" ? "bg-green-400" : r.nivelAtividade === "Moderado" ? "bg-yellow-400" : "bg-red-400"
                          }`} />
                          <span className="text-[10px] text-gray-400">{r.nivelAtividade}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length > 50 && (
              <p className="text-[10px] text-gray-500 text-center mt-2">
                Mostrando 50 de {filteredData.length} — todos serão incluídos no PDF/CSV
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
