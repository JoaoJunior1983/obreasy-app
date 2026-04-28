"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, Pencil, Trash2, FileText, Search, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react"
import { goToObraDashboard } from "@/lib/navigation"
import { toast } from "sonner"
import { deleteDespesa } from "@/lib/storage"
import { getAllCategorias, getCategoriaLabel, getCategoriaColor } from "@/lib/despesa-categorias"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Despesa {
  id: string
  obraId: string
  data: string
  tipo: string
  categoria: string
  descricao: string
  valor: number
  formaPagamento: string
  fornecedor?: string
  observacoes?: string
  category?: string
  professionalId?: string
  anexo?: string | null
}

interface Profissional {
  id: string
  obraId: string
  nome: string
  contrato?: {
    valorPrevisto: number
  }
}

interface Pagamento {
  id: string
  valor: number
  profissionalId: string
  data: string
}

interface Obra {
  id: string
  nome: string
  orcamentoTotalObra: number
  userId: string
}

function DespesasPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(true)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [despesaToDelete, setDespesaToDelete] = useState<Despesa | null>(null)

  // Estados de filtros — inicializa já com o param da URL
  const [searchTerm, setSearchTerm] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [sortBy, setSortBy] = useState<"data" | "valor">("data")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const tipoParam = searchParams?.get("tipo")
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "material" | "maoobra">(
    tipoParam === "material" || tipoParam === "maoobra" ? tipoParam : "todos"
  )
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas")

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Verificar autenticação no Supabase
        const { supabase } = await import("@/lib/supabase")
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push("/login")
          return
        }

        // CRÍTICO: Usar activeObraId para manter contexto
        const activeObraId = localStorage.getItem("activeObraId")

        if (!activeObraId) {
          console.log("Nenhuma obra ativa, redirecionando para /obras")
          router.push("/obras")
          return
        }

        // Carregar obra ativa do Supabase
        const { data: obraData, error: obraError } = await supabase
          .from("obras")
          .select("*")
          .eq("id", activeObraId)
          .eq("user_id", user.id)
          .single()

        if (obraError || !obraData) {
          console.error("Erro ao carregar obra:", obraError)
          router.push("/obras")
          return
        }

        const dbObra = obraData as any
        const obraAtiva = {
          id: dbObra.id,
          nome: dbObra.nome,
          orcamentoTotalObra: dbObra.orcamento || 0,
          userId: dbObra.user_id,
        } as Obra

        setObra(obraAtiva)

        // Paralelizar 3 queries independentes — antes eram sequenciais
        const { getProfissionaisSupabase, getDespesasSupabase } = await import("@/lib/storage")
        const [profissionaisRes, despesasRes, pagamentosRes] = await Promise.allSettled([
          getProfissionaisSupabase(obraAtiva.id, user.id),
          getDespesasSupabase(obraAtiva.id, user.id),
          supabase
            .from("pagamentos")
            .select("id, valor, profissional_id, data, data_pagamento")
            .eq("obra_id", obraAtiva.id)
            .eq("user_id", user.id),
        ])

        setProfissionais(profissionaisRes.status === "fulfilled" ? profissionaisRes.value : [])
        setDespesas(despesasRes.status === "fulfilled" ? despesasRes.value : [])

        const pagamentosData =
          pagamentosRes.status === "fulfilled" ? pagamentosRes.value.data : null
        const pagamentosCarregados: Pagamento[] = (pagamentosData || []).map((p: any) => ({
          id: p.id,
          valor: parseFloat(p.valor) || 0,
          profissionalId: p.profissional_id,
          data: p.data || p.data_pagamento || "",
        }))
        setPagamentos(pagamentosCarregados)

        setLoading(false)
      } catch (error: any) {
        console.error("Erro ao carregar dados:", error)
        // Só redireciona se não for erro de localStorage (quota)
        if (error?.name !== "QuotaExceededError") {
          router.push("/obras")
        }
      }
    }

    carregarDados()
  }, [router])

  const handleOpenDeleteModal = (e: React.MouseEvent, despesa: Despesa) => {
    e.preventDefault()
    e.stopPropagation()
    setDespesaToDelete(despesa)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setDespesaToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!despesaToDelete) return

    setExcluindo(despesaToDelete.id)

    try {
      if (despesaToDelete.professionalId) {
        // É um pagamento — deletar da tabela pagamentos
        const { supabase } = await import("@/lib/supabase")
        const { error } = await supabase.from("pagamentos").delete().eq("id", despesaToDelete.id)
        if (error) {
          toast.error("Erro ao excluir pagamento. Tente novamente.")
          return
        }
        setPagamentos(prev => prev.filter(p => p.id !== despesaToDelete.id))
        toast.success("Pagamento excluído com sucesso!")
      } else {
        // É uma despesa comum
        const sucesso = await deleteDespesa(obra?.id || "", despesaToDelete.id)
        if (!sucesso) {
          toast.error("Erro ao excluir despesa. Tente novamente.")
          return
        }
        setDespesas(prev => prev.filter(d => d.id !== despesaToDelete.id))
        toast.success("Despesa excluída com sucesso!")
      }
      handleCloseDeleteModal()
    } catch (error) {
      console.error("Erro ao excluir:", error)
      toast.error("Erro ao excluir. Tente novamente.")
    } finally {
      setExcluindo(null)
    }
  }

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const showLoader = useDelayedLoading(loading || !obra, 400)
  if (loading || !obra) {
    if (!showLoader) return null
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  // Converter pagamentos para o mesmo formato de Despesa
  const pagamentosAsDespesas: Despesa[] = pagamentos.map(p => {
    const prof = profissionais.find(pr => pr.id === p.profissionalId)
    return {
      id: p.id,
      obraId: obra?.id || "",
      data: p.data,
      tipo: "mao_obra",
      categoria: "mao_obra",
      category: "mao_obra",
      descricao: prof ? prof.nome : "Profissional",
      valor: p.valor,
      formaPagamento: "",
      professionalId: p.profissionalId,
    }
  })

  const todosItens = [...despesas, ...pagamentosAsDespesas]

  // Filtrar despesas
  const despesasFiltradas = todosItens
    .filter((despesa) => {
      // Filtro de busca
      if (searchTerm) {
        const termo = searchTerm.toLowerCase()
        const descricao = (despesa.descricao || "").toLowerCase()
        const fornecedor = (despesa.fornecedor || "").toLowerCase()
        const categoria = (despesa.categoria || "").toLowerCase()
        const category = (despesa.category || "").toLowerCase()

        if (!descricao.includes(termo) && !fornecedor.includes(termo) && !categoria.includes(termo) && !category.includes(termo)) {
          return false
        }
      }

      // Filtro de data início
      if (dataInicio) {
        const despesaData = new Date(despesa.data)
        const dataInicioDate = new Date(dataInicio)
        if (despesaData < dataInicioDate) {
          return false
        }
      }

      // Filtro de data fim
      if (dataFim) {
        const despesaData = new Date(despesa.data)
        const dataFimDate = new Date(dataFim)
        if (despesaData > dataFimDate) {
          return false
        }
      }

      return true
    })
    .sort((a, b) => {
      // Ordenação
      if (sortBy === "data") {
        const dataA = new Date(a.data).getTime()
        const dataB = new Date(b.data).getTime()
        return sortOrder === "asc" ? dataA - dataB : dataB - dataA
      } else {
        return sortOrder === "asc" ? a.valor - b.valor : b.valor - a.valor
      }
    })

  // Classificação segura (null-safe)
  const isMaoDeObra = (despesa: Despesa) => {
    // REGRA 1: Se tem professionalId, É mão de obra
    if (despesa?.professionalId) return true

    // REGRA 2: Verificar palavras-chave (com fallback seguro)
    const lowerTipo = (despesa?.tipo ?? "").toString().toLowerCase()
    const lowerCategoria = (despesa?.categoria ?? "").toString().toLowerCase()
    const lowerDescricao = (despesa?.descricao ?? "").toString().toLowerCase()
    const lowerCategory = (despesa?.category ?? "").toString().toLowerCase()

    const maoDeObraKeywords = [
      "mão de obra", "mao de obra", "serviço", "servico",
      "pedreiro", "pintor", "eletricista", "encanador",
      "diaria", "diária", "empreita", "empreitada", "mao_obra"
    ]

    const haystack = `${lowerTipo} ${lowerCategoria} ${lowerDescricao} ${lowerCategory}`
    return maoDeObraKeywords.some((k) => haystack.includes(k))
  }

  // Lista filtrada por tipo (material ou mão de obra)
  const despesasPorTipo = tipoFiltro === "todos"
    ? despesasFiltradas
    : despesasFiltradas.filter(d => tipoFiltro === "material" ? !isMaoDeObra(d) : isMaoDeObra(d))

  // Filtro adicional por categoria específica (só relevante quando não estamos em "maoobra")
  const despesasExibidas = (categoriaFiltro === "todas" || tipoFiltro === "maoobra")
    ? despesasPorTipo
    : despesasPorTipo.filter(d => {
        const cat = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        return cat === categoriaFiltro
      })

  // Totais
  const totalPeriodo = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0)
  const totalMaterialOutros = despesasFiltradas.filter(d => !isMaoDeObra(d)).reduce((sum, d) => sum + d.valor, 0)
  const totalMaoDeObra = despesasFiltradas.filter(d => isMaoDeObra(d)).reduce((sum, d) => sum + d.valor, 0)

  // Orçamento previsto
  const maoDeObraPrevista = profissionais.reduce((sum, p) => sum + (p.contrato?.valorPrevisto || 0), 0)
  const materialPrevisto = Math.max(obra.orcamentoTotalObra - maoDeObraPrevista, 0)

  // Percentuais
  const orcamentoTotalObra = obra.orcamentoTotalObra
  const percentualMaterialOutros = orcamentoTotalObra > 0 ? (totalMaterialOutros / orcamentoTotalObra * 100).toFixed(1) : '—'
  const percentualMaoDeObra = orcamentoTotalObra > 0 ? (totalMaoDeObra / orcamentoTotalObra * 100).toFixed(1) : '—'

  // Distribuição
  const totalRealizado = totalMaterialOutros + totalMaoDeObra
  const percentualDistMaterial = totalRealizado > 0 ? (totalMaterialOutros / totalRealizado * 100).toFixed(1) : '0'
  const percentualDistMao = totalRealizado > 0 ? (totalMaoDeObra / totalRealizado * 100).toFixed(1) : '0'

  const toggleSort = (campo: "data" | "valor") => {
    if (sortBy === campo) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(campo)
      setSortOrder("desc")
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {tipoFiltro === "maoobra" ? "Pagamentos · Mão de Obra" : "Despesas"}
            </h1>
            <p className="text-xs text-gray-500">{obra.nome}</p>
          </div>
          <button
            onClick={() => router.push(tipoFiltro === "maoobra" ? "/dashboard/pagamentos/novo" : "/dashboard/despesas/nova")}
            className={`flex items-center gap-1.5 px-3 h-8 active:scale-95 text-white text-xs font-medium rounded-lg shadow-md transition-all ${tipoFiltro === "maoobra" ? "bg-orange-600 hover:bg-orange-700" : "bg-[#0B3064] hover:bg-[#082551]"}`}
          >
            <Plus className="w-3.5 h-3.5" />
            {tipoFiltro === "maoobra" ? "Novo pagamento" : "Nova despesa"}
          </button>
        </div>

        {/* Totais compactos */}
        <div className="flex gap-1.5 mb-3">
          <div className="flex-1 bg-[#1f2228]/80 border border-white/[0.08] px-3 py-2 rounded-lg">
            <p className="text-[10px] text-gray-500">Total</p>
            <p className="text-sm font-bold text-white">R$ {totalPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="flex-1 bg-[#1f2228]/80 border border-white/[0.08] px-3 py-2 rounded-lg">
            <p className="text-[10px] text-gray-500">Material</p>
            <p className="text-sm font-bold text-[#7eaaee]">R$ {totalMaterialOutros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="flex-1 bg-[#1f2228]/80 border border-white/[0.08] px-3 py-2 rounded-lg">
            <p className="text-[10px] text-gray-500">Mão de Obra</p>
            <p className="text-sm font-bold text-orange-300">R$ {totalMaoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Barra de distribuição */}
        {totalRealizado > 0 && (
          <div className="mb-4">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-[#1f2228]">
              <div className="bg-blue-500 transition-all" style={{ width: `${percentualDistMaterial}%` }} />
              <div className="bg-orange-500 transition-all" style={{ width: `${percentualDistMao}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>Material {percentualDistMaterial}%</span>
              <span>Mão de Obra {percentualDistMao}%</span>
            </div>
          </div>
        )}

        {/* Lista estilo extrato */}
        <div className="bg-[#1f2228]/60 border border-slate-700/25 rounded-xl overflow-hidden">

          {/* Cabeçalho da lista: tabs + ordenação + busca */}
          <div className="px-3 pt-3 pb-2 border-b border-white/[0.08] space-y-2">
            {/* Tabs de tipo — grid de 3 colunas, centralizadas, sem corte em mobile */}
            <div className="grid grid-cols-3 gap-1">
              {(["todos", "material", "maoobra"] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setTipoFiltro(tipo)}
                  className={`flex items-center justify-center px-2 py-1.5 text-xs rounded-md font-medium transition-all whitespace-nowrap ${
                    tipoFiltro === tipo
                      ? tipo === "material"
                        ? "bg-[#0B3064] text-white"
                        : tipo === "maoobra"
                        ? "bg-orange-600 text-white"
                        : "bg-slate-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tipo === "todos" ? "Todos" : tipo === "material" ? "Material" : "Mão de Obra"}
                </button>
              ))}
            </div>
            {/* Ordenação centralizada */}
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => toggleSort("data")}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-all ${
                  sortBy === "data" ? "text-[#7eaaee]" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Data
                {sortBy === "data"
                  ? sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  : <ArrowUpDown className="w-3 h-3" />}
              </button>
              <button
                onClick={() => toggleSort("valor")}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-all ${
                  sortBy === "valor" ? "text-[#7eaaee]" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Valor
                {sortBy === "valor"
                  ? sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  : <ArrowUpDown className="w-3 h-3" />}
              </button>
            </div>
            {/* Busca compacta */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 h-8 bg-white/[0.08] border border-white/[0.08] rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#0B3064]/50"
              />
            </div>
            {/* Filtro por categoria (somente Material/Outros e Todos) */}
            {tipoFiltro !== "maoobra" && (
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger className="w-full h-8 bg-white/[0.08] border border-white/[0.08] text-white text-xs rounded-lg hover:bg-white/[0.12] focus:border-[#0B3064]/50 transition-colors [&>span]:text-white [&>svg]:text-gray-500">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-lg">
                  <SelectItem
                    value="todas"
                    className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer text-xs"
                  >
                    Todas as categorias
                  </SelectItem>
                  {getAllCategorias()
                    .filter((c) => c.value !== "mao_obra")
                    .map((cat) => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                        className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer text-xs"
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Itens */}
          {despesasExibidas.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">
              {searchTerm ? "Nenhum resultado encontrado." : "Nenhuma despesa registrada ainda."}
            </div>
          ) : (
            <div className="divide-y divide-slate-700/20">
              {despesasExibidas.map(despesa => {
                const isPagamento = !!despesa.professionalId
                const isMao = isMaoDeObra(despesa)
                const dataFormatada = despesa.data
                  ? new Date(despesa.data + (despesa.data.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  : '-'

                const catRaw = String(despesa.category || despesa.categoria || despesa.tipo || "")
                const labelPrincipal = isPagamento
                  ? (despesa.descricao || 'Pagamento')
                  : (catRaw && catRaw !== 'mao_obra' ? getCategoriaLabel(catRaw) : (isMao ? 'Mão de obra' : 'Despesa'))
                const descricaoSecundaria = !isPagamento && despesa.descricao ? despesa.descricao : ''
                const colorKey = isPagamento || isMao ? 'mao_obra' : catRaw
                const cor = getCategoriaColor(colorKey)

                return (
                  <div key={despesa.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                    {/* Indicador de categoria */}
                    <span className={`w-1 h-7 rounded-full flex-shrink-0 ${cor.bar}`} />

                    {/* Categoria + meta */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate leading-tight ${cor.text}`}>
                        {labelPrincipal}
                      </p>
                      <p className="text-[10px] text-gray-500 leading-tight truncate">
                        {dataFormatada}
                        {descricaoSecundaria ? ` · ${descricaoSecundaria}` : ""}
                        {despesa.fornecedor ? ` · ${despesa.fornecedor}` : ""}
                      </p>
                    </div>

                    {/* Valor */}
                    <span className="text-sm font-bold text-white flex-shrink-0 tabular-nums">
                      R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>

                    {/* Ações ícones */}
                    <div className="flex gap-0 flex-shrink-0">
                      {!isPagamento ? (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/despesas/${despesa.id}`)}
                            className="p-1.5 text-gray-400 hover:text-[#7eaaee] hover:bg-[#0e3d7a]/10 rounded transition-all"
                            title="Visualizar"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/despesas/${despesa.id}/editar`)}
                            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-all"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenDeleteModal(e, despesa)}
                            disabled={excluindo === despesa.id}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all disabled:opacity-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/pagamentos/${despesa.id}`)}
                            className="p-1.5 text-gray-400 hover:text-[#7eaaee] hover:bg-[#0e3d7a]/10 rounded transition-all"
                            title="Visualizar pagamento"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/pagamentos/${despesa.id}/editar`)}
                            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-all"
                            title="Editar pagamento"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenDeleteModal(e, despesa)}
                            disabled={excluindo === despesa.id}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all disabled:opacity-50"
                            title="Excluir pagamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer com total filtrado */}
          {despesasExibidas.length > 0 && (
            <div className="px-3 py-2 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-[10px] text-gray-500">
                {despesasExibidas.length} {despesasExibidas.length === 1 ? "item" : "itens"}
              </span>
              <span className="text-sm font-bold text-white tabular-nums">
                R$ {despesasExibidas.reduce((s, d) => s + d.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && despesaToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800/90 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-white/10">
            {/* Ícone de alerta */}
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-red-500/30">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Excluir despesa?
            </h2>

            {/* Detalhes da despesa */}
            <div className="bg-[#1f2228]/60 rounded-lg p-4 mb-4 border border-white/[0.08]">
              <p className="text-sm text-gray-400 mb-1">Descrição:</p>
              <p className="font-semibold text-white mb-3">{despesaToDelete.descricao || "Sem descrição"}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Valor</p>
                  <p className="font-semibold text-white">{formatarMoeda(despesaToDelete.valor)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data</p>
                  <p className="font-semibold text-white">
                    {new Date(despesaToDelete.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Texto de aviso */}
            <p className="text-gray-400 text-center mb-6">
              Esta ação é permanente e não pode ser desfeita.
            </p>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-3 border border-white/[0.1] rounded-lg font-medium text-gray-300 hover:bg-[#2a2d35] transition-all"
                disabled={excluindo !== null}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={excluindo !== null}
              >
                {excluindo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DespesasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    }>
      <DespesasPageContent />
    </Suspense>
  )
}
