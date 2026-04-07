"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Wallet, FileText, Search, ArrowUpDown, ArrowUp, ArrowDown, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Obra {
  id: string
  userId: string
  nome: string
  tipo: string
  area: number
  localizacao: {
    estado: string
    cidade: string
    bairro?: string
  }
  orcamento: number | null
  dataInicio?: string | null
  dataTermino?: string | null
  criadaEm: string
}

interface Despesa {
  id: string
  obraId: string
  valor: number
  data: string
  tipo?: string
  category?: string
  categoria?: string
  profissionalId?: string
  descricao?: string
  anexo?: string | null
  fornecedor?: string
  observacoes?: string
  observacao?: string
}

interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
}

export default function ExtratoGeralPage() {
  const router = useRouter()
  const [obra, setObra] = useState<Obra | null>(null)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para busca e ordenação
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"data" | "valor">("data")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

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
        const obraAtiva: Obra = {
          id: dbObra.id,
          userId: dbObra.user_id,
          nome: dbObra.nome,
          tipo: dbObra.tipo,
          area: dbObra.area,
          localizacao: dbObra.localizacao,
          orcamento: dbObra.orcamento,
          dataInicio: dbObra.data_inicio || null,
          dataTermino: dbObra.data_termino || null,
          criadaEm: dbObra.criada_em,
        }

        setObra(obraAtiva)

        // Carregar despesas do Supabase
        const { data: despesasData, error: despesasError } = await supabase
          .from("despesas")
          .select("*")
          .eq("obra_id", obraAtiva.id)
          .order("data", { ascending: false })

        if (despesasError) {
          console.error("❌ Erro ao carregar despesas:", despesasError)
        }

        const despesasObra = (despesasData || []).map((d: any) => ({
          id: d.id,
          obraId: d.obra_id,
          valor: d.valor,
          data: d.data,
          tipo: d.tipo,
          category: d.categoria || d.tipo,
          categoria: d.categoria || d.tipo,
          profissionalId: d.profissional_id,
          descricao: d.descricao,
          fornecedor: d.fornecedor,
          observacoes: d.observacoes,
          observacao: d.observacoes,
          anexo: d.comprovante_url
        }))

        console.log("✅ EXTRATO GERAL - Despesas carregadas do Supabase:", despesasObra.length)

        // Carregar pagamentos de mão de obra do Supabase
        const { data: pagamentosData, error: pagamentosError } = await supabase
          .from("pagamentos")
          .select("id, valor, profissional_id, data, comprovante_url")
          .eq("obra_id", obraAtiva.id)

        if (pagamentosError) {
          console.error("❌ Erro ao carregar pagamentos:", pagamentosError)
        }

        const pagamentosComoDespesas = (pagamentosData || []).map((p: any) => ({
          id: p.id,
          obraId: obraAtiva.id,
          valor: p.valor,
          data: p.data,
          tipo: "mao_obra",
          category: "mao_obra",
          categoria: "mao_obra",
          profissionalId: p.profissional_id,
          descricao: "Pagamento de mão de obra",
          anexo: p.comprovante_url || null,
        }))

        console.log("✅ EXTRATO GERAL - Pagamentos carregados:", pagamentosComoDespesas.length)

        const todasDespesas = [...despesasObra, ...pagamentosComoDespesas].sort((a, b) =>
          new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime()
        )

        setDespesas(todasDespesas)

        // Carregar profissionais do Supabase
        const { data: profissionaisData, error: profError } = await supabase
          .from("profissionais")
          .select("*")
          .eq("obra_id", obraAtiva.id)

        const profissionaisObra = (profissionaisData || []).map((p: any) => ({
          id: p.id,
          obraId: p.obra_id,
          nome: p.nome,
          funcao: p.funcao
        }))

        setProfissionais(profissionaisObra)

        setLoading(false)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        router.push("/obras")
      }
    }

    carregarDados()
  }, [router])

  const formatarMoedaDisplay = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const formatarData = (dataISO: string): string => {
    const data = new Date(dataISO)
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const getProfissionalNome = (profissionalId: string) => {
    const prof = profissionais.find(p => p.id === profissionalId)
    return prof ? prof.nome : "Desconhecido"
  }

  const getTipoLabel = (despesa: Despesa): string => {
    const category = String(despesa.category ?? despesa.categoria ?? despesa.tipo ?? "").toLowerCase()

    if (despesa.profissionalId || category === "mao_obra" || category === "mão de obra") {
      return "Mão de Obra"
    }

    if (category === "material") {
      return "Material"
    }

    return "Outros"
  }

  const getTipoColor = (tipo: string): string => {
    if (tipo === "Mão de Obra") return "text-orange-400"
    if (tipo === "Material") return "text-[#7eaaee]"
    return "text-purple-400"
  }

  // Função para filtrar e ordenar despesas
  const getFilteredAndSortedDespesas = () => {
    let despesasFiltradas = [...despesas]

    // Aplicar busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      despesasFiltradas = despesasFiltradas.filter(d => {
        // Buscar na descrição
        const descricao = (d.descricao || "").toLowerCase()
        if (descricao.includes(query)) return true

        // Buscar no nome do profissional
        if (d.profissionalId) {
          const prof = profissionais.find(p => p.id === d.profissionalId)
          if (prof && prof.nome.toLowerCase().includes(query)) return true
        }

        // Buscar no fornecedor
        const fornecedor = (d.fornecedor || "").toLowerCase()
        if (fornecedor.includes(query)) return true

        // Buscar no tipo
        const tipo = getTipoLabel(d).toLowerCase()
        if (tipo.includes(query)) return true

        return false
      })
    }

    // Aplicar ordenação
    if (sortBy === "data") {
      despesasFiltradas.sort((a, b) => {
        const dataA = new Date(a.data || 0).getTime()
        const dataB = new Date(b.data || 0).getTime()

        if (sortOrder === "asc") {
          return dataA - dataB
        }
        return dataB - dataA
      })
    } else if (sortBy === "valor") {
      despesasFiltradas.sort((a, b) => {
        if (sortOrder === "asc") {
          return (a.valor ?? 0) - (b.valor ?? 0)
        }
        return (b.valor ?? 0) - (a.valor ?? 0)
      })
    }

    return despesasFiltradas
  }

  // Função para alternar ordenação
  const handleSort = (field: "data" | "valor") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const calcularTotalGasto = (): number => {
    return despesas.reduce((acc, d) => acc + (d.valor ?? 0), 0)
  }

  const handleVisualizarDespesa = (despesa: Despesa) => {
    const tipo = getTipoLabel(despesa)

    if (tipo === "Mão de Obra" && despesa.profissionalId) {
      // Redirecionar para a página de pagamentos do profissional
      router.push(`/dashboard/profissionais/${despesa.profissionalId}/pagamentos`)
    } else {
      // Redirecionar para a página de detalhes da despesa
      router.push(`/dashboard/despesas/${despesa.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3064] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!obra) {
    return null
  }

  const totalGasto = calcularTotalGasto()
  const despesasFiltradas = getFilteredAndSortedDespesas()

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-4 pb-10 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-3">

        {/* Card Total Gasto — compacto */}
        <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wallet className="w-3.5 h-3.5 text-[#7eaaee]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Total Gasto</p>
              {obra.orcamento && (
                <p className="text-[10px] text-gray-600">{((totalGasto / obra.orcamento) * 100).toFixed(1)}% do orçamento</p>
              )}
            </div>
          </div>
          <p className="text-lg font-bold text-gray-200">{formatarMoedaDisplay(totalGasto)}</p>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por descrição, profissional..."
            className="w-full h-9 pl-9 pr-8 bg-[#1f2228]/80 border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0B3064]/50 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros e Ordenação */}
        <div className="flex items-center gap-2">
          {/* Pills tipo */}
          <div className="flex items-center gap-0.5 bg-[#1f2228]/80 border border-white/[0.08] rounded-lg p-0.5 flex-shrink-0">
            {(["data", "valor"] as const).map(campo => (
              <button
                key={campo}
                onClick={() => handleSort(campo)}
                style={{ padding: '3px 7px', minHeight: 0, minWidth: 0, margin: 0 }}
                className={`no-min-height no-touch-padding rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                  sortBy === campo ? "bg-[#0B3064] text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {campo === "data" ? "Data" : "Valor"}
              </button>
            ))}
          </div>

          {/* Ordenação asc/desc */}
          <div className="flex items-center gap-1 bg-[#1f2228]/80 border border-white/[0.08] rounded-lg px-2 h-8 ml-auto flex-shrink-0">
            <ArrowUpDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => {
                const [field, order] = e.target.value.split("-") as ["data" | "valor", "asc" | "desc"]
                setSortBy(field)
                setSortOrder(order)
              }}
              className="bg-transparent text-[11px] text-gray-300 focus:outline-none cursor-pointer"
              style={{ minHeight: 0, appearance: 'none', WebkitAppearance: 'none', colorScheme: 'dark' }}
            >
              <option value="data-desc" className="bg-[#1f2228]">Mais recente</option>
              <option value="data-asc" className="bg-[#1f2228]">Mais antigo</option>
              <option value="valor-desc" className="bg-[#1f2228]">Maior valor</option>
              <option value="valor-asc" className="bg-[#1f2228]">Menor valor</option>
            </select>
          </div>
        </div>

        {/* Contagem */}
        <p className="text-[11px] text-gray-600 px-0.5">
          {despesasFiltradas.length} {despesasFiltradas.length === 1 ? "registro" : "registros"}
        </p>

        {/* Lista de Despesas */}
        <div className="space-y-1.5">
            {despesasFiltradas.length > 0 ? (
              despesasFiltradas.map((despesa) => {
                const tipo = getTipoLabel(despesa)
                const tipoColor = getTipoColor(tipo)

                return (
                  <div
                    key={despesa.id}
                    onClick={() => handleVisualizarDespesa(despesa)}
                    className="flex items-center gap-3 p-3 bg-[#1f2228]/60 rounded-lg hover:bg-[#1f2228]/90 transition-all cursor-pointer border border-white/[0.08] hover:border-slate-600/50"
                  >
                    {/* Ícone */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tipo === "Mão de Obra" ? "bg-orange-500/20" :
                      tipo === "Material" ? "bg-[#0B3064]/20" : "bg-purple-500/20"
                    }`}>
                      {tipo === "Mão de Obra" ? (
                        <Users className={`w-5 h-5 ${tipoColor}`} />
                      ) : (
                        <Wallet className={`w-5 h-5 ${tipoColor}`} />
                      )}
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {despesa.descricao || "Sem descrição"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                            <span className={`font-medium ${tipoColor}`}>
                              {tipo}
                            </span>
                            {despesa.profissionalId && (
                              <>
                                <span>•</span>
                                <span>{getProfissionalNome(despesa.profissionalId)}</span>
                              </>
                            )}
                            {despesa.fornecedor && (
                              <>
                                <span>•</span>
                                <span>{despesa.fornecedor}</span>
                              </>
                            )}
                            {despesa.anexo && (
                              <>
                                <span>•</span>
                                <FileText className="w-3 h-3 inline" />
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-white whitespace-nowrap">
                            {formatarMoedaDisplay(despesa.valor)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {despesa.data ? formatarData(despesa.data) : "Sem data"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : searchQuery.trim() ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">
                  Nenhuma despesa encontrada
                </p>
                <p className="text-gray-500 text-sm">
                  Tente buscar por outro termo: "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  Nenhuma despesa registrada ainda
                </p>
                <Button
                  onClick={() => router.push("/dashboard/despesas/nova")}
                  className="mt-4 bg-[#0B3064] hover:bg-[#082551] text-white"
                >
                  Adicionar primeira despesa
                </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
