"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Printer } from "lucide-react"
import { type Obra, type Despesa, type Profissional, type Recebimento } from "@/lib/storage"

type TipoRelatorio = "geral" | "periodo" | "material" | "mao_obra_total" | "mao_obra_profissional" | "recebimentos"

function RelatorioPreviewPageContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const obraId = params.id as string

  const [obra, setObra] = useState<Obra | null>(null)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [pagamentos, setPagamentos] = useState<{ id: string; valor: number; data: string; profissional_id: string; descricao?: string }[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([])
  const [userProfile, setUserProfile] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Parâmetros do relatório
  const tipo = (searchParams.get("tipo") || "geral") as TipoRelatorio
  const dataInicio = searchParams.get("dataInicio") || ""
  const dataFim = searchParams.get("dataFim") || ""
  const profissionalId = searchParams.get("profissionalId") || ""

  useEffect(() => {
    const carregarDados = async () => {
      console.log("[PREVIEW] Iniciando carregamento dos dados do relatório")
      console.log("[PREVIEW] obraId:", obraId)
      console.log("[PREVIEW] tipo:", tipo)

      const isAuthenticated = localStorage.getItem("isAuthenticated")
      if (!isAuthenticated) {
        console.error("[PREVIEW] Não autenticado, redirecionando")
        router.push("/")
        return
      }

      // Carregar perfil do usuário
      const userData = localStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        setUserProfile(user.profile || null)
      }

      try {
        console.log("[PREVIEW] Carregando obra do Supabase...")
        // Carregar obra do Supabase
        const { supabase } = await import("@/lib/supabase")
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          console.error("[PREVIEW] Usuário não encontrado, redirecionando")
          router.push("/")
          return
        }

        console.log("[PREVIEW] Usuário autenticado:", user.id)

        const { data: dbObra, error: obraError } = await supabase
          .from("obras")
          .select("*")
          .eq("id", obraId)
          .eq("user_id", user.id)
          .single()

        if (obraError || !dbObra) {
          console.error("[PREVIEW] Erro ao carregar obra:", obraError)
          router.push("/obras")
          return
        }

        console.log("[PREVIEW] Obra carregada:", dbObra.nome)

        // Converter para formato esperado
        const obraEncontrada = {
          id: dbObra.id,
          userId: dbObra.user_id,
          nome: dbObra.nome,
          nomeCliente: dbObra.nome_cliente || undefined,
          tipo: dbObra.tipo,
          area: dbObra.area,
          localizacao: dbObra.localizacao,
          orcamento: dbObra.orcamento,
          valorContratado: dbObra.valor_contratado || null,
          dataInicio: dbObra.data_inicio || null,
          dataTermino: dbObra.data_termino || null,
          criadaEm: dbObra.criada_em,
        }

        setObra(obraEncontrada)

        // Carregar despesas do Supabase (excluindo as vinculadas a profissional para evitar duplicação)
        console.log("[PREVIEW] Carregando despesas...")
        const { data: despesasData } = await supabase
          .from("despesas")
          .select("*")
          .eq("obra_id", obraId)
          .eq("user_id", user.id)
          .is("profissional_id", null)
          .order("data", { ascending: false })

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
        }))
        console.log("[PREVIEW] Despesas carregadas:", despesasObra.length)
        setDespesas(despesasObra)

        // Carregar profissionais do Supabase
        console.log("[PREVIEW] Carregando profissionais...")
        const { data: profissionaisData } = await supabase
          .from("profissionais")
          .select("*")
          .eq("obra_id", obraId)
          .eq("user_id", user.id)
          .order("criada_em", { ascending: false })

        if (profissionaisData) {
          const profissionaisObra = profissionaisData.map((p: any) => ({
            id: p.id,
            obraId: p.obra_id,
            nome: p.nome,
            funcao: p.funcao,
            telefone: p.telefone || undefined,
            valorPrevisto: p.valor_previsto || undefined,
            contrato: p.contrato || undefined,
            criadoEm: p.criada_em,
            atualizadoEm: p.atualizada_em
          }))
          console.log("[PREVIEW] Profissionais carregados:", profissionaisObra.length)
          setProfissionais(profissionaisObra)
        }

        // Carregar recebimentos do Supabase
        console.log("[PREVIEW] Carregando recebimentos...")
        const { data: recebimentosData } = await supabase
          .from("recebimentos")
          .select("id, valor, data, forma_pagamento, observacao, comprovante_url, cliente_id")
          .eq("obra_id", obraId)
          .eq("user_id", user.id)
          .order("data", { ascending: false })
        const recebimentosObra = (recebimentosData || []).map((r: any) => ({
          id: r.id,
          obraId,
          clienteId: r.cliente_id,
          valor: parseFloat(r.valor) || 0,
          data: r.data || "",
          formaPagamento: r.forma_pagamento || "",
          observacao: r.observacao || null,
          comprovanteUrl: r.comprovante_url || null,
        }))
        console.log("[PREVIEW] Recebimentos carregados:", recebimentosObra.length)
        setRecebimentos(recebimentosObra)

        // Carregar pagamentos do Supabase
        console.log("[PREVIEW] Carregando pagamentos...")
        console.log("[PREVIEW] 🔍 DEBUG - obraId:", obraId)
        console.log("[PREVIEW] 🔍 DEBUG - user.id:", user.id)

        const { data: pagamentosData, error: pagError } = await supabase
          .from("pagamentos")
          .select("id, valor, data_pagamento, profissional_id")
          .eq("obra_id", obraId)
          .eq("user_id", user.id)
          .order("data_pagamento", { ascending: false })

        console.log("[PREVIEW] 🔍 DEBUG - Supabase Error:", pagError)
        console.log("[PREVIEW] 🔍 DEBUG - Dados retornados:", pagamentosData)
        console.log("[PREVIEW] 🔍 DEBUG - Quantidade de pagamentos:", pagamentosData?.length || 0)

        if (pagamentosData && pagamentosData.length > 0) {
          console.log("[PREVIEW] Pagamentos carregados:", pagamentosData.length)
          const pagamentosProcessados = pagamentosData.map(p => {
            console.log("[PREVIEW] 🔍 Processando pagamento:", p.id, "data_pagamento:", p.data_pagamento)
            return {
              id: p.id,
              valor: parseFloat(p.valor) || 0,
              data: p.data_pagamento,
              profissional_id: p.profissional_id
            }
          })
          console.log("[PREVIEW] 🔍 Pagamentos processados:", pagamentosProcessados)
          setPagamentos(pagamentosProcessados)
        } else {
          console.log("[PREVIEW] ❌ Nenhum pagamento encontrado")
        }

        console.log("[PREVIEW] ✅ Carregamento concluído com sucesso!")
        setLoading(false)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        router.push("/obras")
      }
    }

    carregarDados()
  }, [obraId, router])

  const handleVoltar = () => {
    router.push(`/dashboard/obras/${obraId}/relatorio`)
  }

  const handleImprimir = () => {
    // Construir query params
    const params = new URLSearchParams({
      obraId,
      tipo,
      ...(tipo === "periodo" && { dataInicio, dataFim }),
      ...(tipo === "mao_obra_profissional" && { profissionalId })
    })

    // Navegar para rota de impressão
    router.push(`/relatorios/imprimir?${params.toString()}`)
  }

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const formatarData = (dataISO: string): string => {
    // Para datas ISO simples (YYYY-MM-DD), fazer parse local para evitar timezone
    if (dataISO && !dataISO.includes('T')) {
      const [year, month, day] = dataISO.split('-').map(Number)
      const data = new Date(year, month - 1, day)
      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit"
      })
    }
    // Para datas com horário, usar normalmente
    const data = new Date(dataISO)
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit"
    })
  }

  const filtrarDespesasPorPeriodo = (despesas: Despesa[]): Despesa[] => {
    if (tipo !== "periodo" || !dataInicio || !dataFim) return despesas

    console.log("[FILTRO] Filtrando despesas por período")
    console.log("[FILTRO] Período solicitado:", dataInicio, "até", dataFim)

    const resultado = despesas.filter(d => {
      if (!d.data) return false
      // Extrair apenas a parte da data (YYYY-MM-DD) para comparação
      const dataDespesaStr = d.data.split('T')[0]
      const inclui = dataDespesaStr >= dataInicio && dataDespesaStr <= dataFim
      console.log(`[FILTRO] Despesa data: ${dataDespesaStr}, Incluir: ${inclui}`)
      return inclui
    })

    console.log(`[FILTRO] Total de ${resultado.length} despesas no período`)
    return resultado
  }

  const filtrarRecebimentosPorPeriodo = (recebimentos: Recebimento[]): Recebimento[] => {
    if (tipo !== "periodo" || !dataInicio || !dataFim) return recebimentos

    return recebimentos.filter(r => {
      if (!r.data) return false
      // Extrair apenas a parte da data (YYYY-MM-DD) para comparação
      const dataRecebimentoStr = r.data.split('T')[0]
      return dataRecebimentoStr >= dataInicio && dataRecebimentoStr <= dataFim
    })
  }

  const filtrarPagamentosPorPeriodo = (pagamentos: typeof pagamentos) => {
    if (tipo !== "periodo" || !dataInicio || !dataFim) return pagamentos

    return pagamentos.filter(p => {
      if (!p.data) return false
      // Extrair apenas a parte da data (YYYY-MM-DD) para comparação
      const dataPagamentoStr = p.data.split('T')[0]
      return dataPagamentoStr >= dataInicio && dataPagamentoStr <= dataFim
    })
  }

  const filtrarPagamentosPorProfissional = (pagamentos: typeof pagamentos) => {
    if (tipo !== "mao_obra_profissional" || !profissionalId) return pagamentos
    return pagamentos.filter(p => p.profissional_id === profissionalId)
  }

  const filtrarDespesasPorTipo = (despesas: Despesa[]): Despesa[] => {
    if (tipo === "material") {
      return despesas.filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase().trim()
        const isMaoObra = category.includes("mao") && category.includes("obra")
        const temProfissional = !!d.profissionalId
        return !isMaoObra && !temProfissional
      })
    }

    if (tipo === "mao_obra_total" || tipo === "mao_obra_profissional") {
      let despesasMaoObra = despesas.filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase().trim()
        // Aceitar variações: "mao_obra", "mão de obra", "mao de obra", "mao obra", etc
        const isMaoObra = category.includes("mao") && category.includes("obra")
        const temProfissional = !!d.profissionalId
        return isMaoObra || temProfissional
      })

      if (tipo === "mao_obra_profissional" && profissionalId) {
        despesasMaoObra = despesasMaoObra.filter(d => d.profissionalId === profissionalId)
      }

      return despesasMaoObra
    }

    return despesas
  }

  const calcularTotalGasto = (): number => {
    const despesasFiltradas = filtrarDespesasPorTipo(filtrarDespesasPorPeriodo(despesas))
    const totalDespesas = despesasFiltradas.reduce((acc, d) => acc + (d.valor ?? 0), 0)

    console.log("[RELATORIO] Tipo:", tipo)
    console.log("[RELATORIO] Despesas filtradas:", despesasFiltradas.length, "Total:", totalDespesas)
    console.log("[RELATORIO] Pagamentos totais:", pagamentos.length)

    // Adicionar pagamentos se for relatório de mão de obra
    let totalPagamentos = 0
    if (tipo === "geral" || tipo === "periodo" || tipo === "mao_obra_total" || tipo === "mao_obra_profissional") {
      let pagamentosFiltrados = filtrarPagamentosPorPeriodo(pagamentos)
      if (tipo === "mao_obra_profissional") {
        pagamentosFiltrados = filtrarPagamentosPorProfissional(pagamentosFiltrados)
      }
      totalPagamentos = pagamentosFiltrados.reduce((acc, p) => acc + p.valor, 0)
      console.log("[RELATORIO] Pagamentos filtrados:", pagamentosFiltrados.length, "Total:", totalPagamentos)
    }

    return totalDespesas + totalPagamentos
  }

  const calcularSaldoDisponivel = (): number => {
    if (!obra || !obra.orcamento) return 0
    return obra.orcamento - calcularTotalGasto()
  }

  const calcularCustoPorM2 = (): string => {
    if (!obra || !obra.area) return "R$ 0,00"
    const totalGasto = calcularTotalGasto()
    if (totalGasto === 0) return "R$ 0,00"
    const custo = totalGasto / obra.area
    return formatarMoeda(custo)
  }

  const calcularDistribuicao = () => {
    const despesasFiltradas = filtrarDespesasPorPeriodo(despesas)
    const totalDespesas = despesasFiltradas.reduce((acc, d) => acc + (d.valor ?? 0), 0)

    const maoObraDespesas = despesasFiltradas
      .filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase().trim()
        const isMaoObra = category.includes("mao") && category.includes("obra")
        const temProfissional = !!d.profissionalId
        return isMaoObra || temProfissional
      })
      .reduce((acc, d) => acc + (d.valor ?? 0), 0)

    // Adicionar pagamentos aos profissionais (todos são mão de obra)
    const pagamentosFiltrados = filtrarPagamentosPorPeriodo(pagamentos)
    const totalPagamentos = pagamentosFiltrados.reduce((acc, p) => acc + p.valor, 0)
    const maoObra = maoObraDespesas + totalPagamentos

    const totalGasto = totalDespesas + totalPagamentos
    const materialOutros = totalGasto - maoObra

    const orcamentoTotal = obra?.orcamento || 0
    const baseCalculo = orcamentoTotal > 0 ? orcamentoTotal : totalGasto

    const percMaterialOutros = baseCalculo > 0 ? (materialOutros / baseCalculo) * 100 : 0
    const percMaoObra = baseCalculo > 0 ? (maoObra / baseCalculo) * 100 : 0

    return {
      materialOutros,
      maoObra,
      percMaterialOutros,
      percMaoObra
    }
  }

  const getProfissionalNome = (id: string): string => {
    const prof = profissionais.find(p => p.id === id)
    return prof ? `${prof.nome} - ${prof.funcao}` : "Profissional não encontrado"
  }

  const getTituloRelatorio = (): string => {
    switch (tipo) {
      case "geral":
        return "Relatório Geral da Obra"
      case "periodo":
        return `Relatório por Período (${formatarData(dataInicio)} a ${formatarData(dataFim)})`
      case "material":
        return "Relatório de Material / Outros"
      case "mao_obra_total":
        return "Relatório de Mão de Obra (Total)"
      case "mao_obra_profissional":
        return profissionalId
          ? `Relatório de Mão de Obra - ${getProfissionalNome(profissionalId)}`
          : "Relatório de Mão de Obra por Profissional"
      case "recebimentos":
        return "Relatório de Recebimentos do Cliente"
      default:
        return "Relatório"
    }
  }

  const calcularTotalRecebido = (): number => {
    const recebimentosFiltrados = tipo === "periodo" ? filtrarRecebimentosPorPeriodo(recebimentos) : recebimentos
    return recebimentosFiltrados.reduce((acc, r) => acc + (r.valor ?? 0), 0)
  }

  const calcularSaldoAReceber = (): number => {
    if (!obra || !obra.valorContratado) return 0
    return obra.valorContratado - calcularTotalRecebido()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3064] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!obra) return null

  const totalGasto = calcularTotalGasto()
  const saldoDisponivel = calcularSaldoDisponivel()
  const distribuicao = calcularDistribuicao()
  const despesasFiltradas = filtrarDespesasPorTipo(filtrarDespesasPorPeriodo(despesas))

  // helpers de renderização
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">{children}</p>
  )

  const RowCard = ({ rows }: { rows: { label: string; value: string; valueClass?: string }[] }) => (
    <div className="print-card bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
      {rows.map(({ label, value, valueClass }, i) => (
        <div key={label} className={`flex items-center justify-between px-3 py-2.5 ${i < rows.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
          <span className="text-[11px] text-gray-400">{label}</span>
          <span className={`text-sm font-bold ${valueClass ?? "text-gray-200"}`}>{value}</span>
        </div>
      ))}
    </div>
  )

  const ListCard = ({ items, emptyText }: { items: { left: string; right: string; sub?: string }[]; emptyText: string }) => (
    items.length === 0
      ? <p className="text-xs text-gray-600 italic px-1">{emptyText}</p>
      : <div className="print-card bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
          {items.map(({ left, right, sub }, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2.5 ${i < items.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-xs text-gray-200 truncate">{left}</p>
                {sub && <p className="text-[10px] text-gray-500 truncate">{sub}</p>}
              </div>
              <span className="text-sm font-bold text-gray-200 flex-shrink-0">{right}</span>
            </div>
          ))}
        </div>
  )

  return (
    <>
      {/* Barra topo — oculta na impressão */}
      <div className="no-print sticky top-0 z-10 bg-[#13151a]/95 backdrop-blur border-b border-white/[0.06] px-4 py-2 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{getTituloRelatorio()}</p>
          <p className="text-[10px] text-gray-500 truncate">{obra.nome}</p>
        </div>
        <button
          onClick={handleImprimir}
          className="flex items-center gap-1.5 h-8 px-3 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0 ml-3"
        >
          <Printer className="w-3.5 h-3.5" />
          Imprimir
        </button>
      </div>

      {/* Conteúdo */}
      <div className="bg-[#0a0a0a] min-h-screen px-4 pt-4 pb-12 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Info da obra */}
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
            {[
              { label: "Obra", value: obra.nome },
              { label: "Localização", value: `${obra.localizacao.cidade} / ${obra.localizacao.estado}` },
              { label: "Tipo", value: obra.tipo === "construcao" ? "Construção" : "Reforma" },
              { label: "Área", value: `${obra.area} m²` },
              { label: "Data do relatório", value: formatarData(new Date().toISOString()) },
              ...(tipo === "recebimentos" && obra.nomeCliente ? [{ label: "Cliente", value: obra.nomeCliente }] : []),
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between px-3 py-2 ${i < arr.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{label}</span>
                <span className="text-xs font-semibold text-gray-200 text-right max-w-[60%] truncate">{value}</span>
              </div>
            ))}
          </div>

          {/* ── RECEBIMENTOS ── */}
          {tipo === "recebimentos" && (
            <>
              <SectionTitle>Resumo financeiro</SectionTitle>
              <RowCard rows={[
                { label: "Valor Contratado", value: obra.valorContratado ? formatarMoeda(obra.valorContratado) : "Não definido" },
                { label: "Total Recebido", value: formatarMoeda(calcularTotalRecebido()), valueClass: "text-emerald-400" },
                { label: "Saldo a Receber", value: formatarMoeda(calcularSaldoAReceber()), valueClass: "text-[#7eaaee]" },
              ]} />

              <SectionTitle>Histórico de recebimentos ({recebimentos.length})</SectionTitle>
              <ListCard
                emptyText="Nenhum recebimento registrado."
                items={recebimentos.map(r => ({
                  left: r.data ? formatarData(r.data) : "-",
                  sub: r.formaPagamento || undefined,
                  right: formatarMoeda(r.valor),
                }))}
              />
            </>
          )}

          {/* ── RESUMO FINANCEIRO (geral / periodo) ── */}
          {(tipo === "geral" || tipo === "periodo") && (
            <>
              <SectionTitle>Resumo financeiro</SectionTitle>
              <RowCard rows={[
                { label: "Orçamento Estimado", value: obra.orcamento ? formatarMoeda(obra.orcamento) : "Não definido" },
                { label: "Total Gasto", value: formatarMoeda(totalGasto) },
                { label: "Saldo Disponível", value: obra.orcamento ? formatarMoeda(saldoDisponivel) : "—", valueClass: saldoDisponivel >= 0 ? "text-emerald-400" : "text-red-400" },
                { label: "Custo por m²", value: calcularCustoPorM2() },
              ]} />
            </>
          )}

          {/* ── DISTRIBUIÇÃO (geral / periodo) ── */}
          {(tipo === "geral" || tipo === "periodo") && totalGasto > 0 && (
            <>
              <SectionTitle>Distribuição de gastos</SectionTitle>
              <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-4 space-y-4">
                {[
                  { label: "Material / Outros", total: distribuicao.materialOutros, perc: distribuicao.percMaterialOutros, color: "bg-[#7eaaee]" },
                  { label: "Mão de Obra", total: distribuicao.maoObra, perc: distribuicao.percMaoObra, color: "bg-orange-400" },
                ].map(({ label, total, perc, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-sm ${color}`} />
                        <span className="text-xs text-gray-300 font-medium">{label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-200">{formatarMoeda(total)}</span>
                        <span className="text-[10px] text-gray-500 ml-2">{perc.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="print-bar-track flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                        <div className={`print-bar-fill h-full ${color} transition-all duration-500`} style={{ width: `${perc}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── EVOLUÇÃO MENSAL ── */}
          {(tipo === "geral" || tipo === "periodo") && (() => {
            const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
            const mesesMap: Record<string, number> = {}
            const despesasParaEvolucao = tipo === "periodo" ? filtrarDespesasPorPeriodo(despesas) : despesas
            despesasParaEvolucao.forEach(d => {
              if (!d.data || !d.valor) return
              const parts = (d.data as string).split('T')[0].split('-')
              if (parts.length < 2) return
              const key = `${parts[0]}-${parts[1]}`
              mesesMap[key] = (mesesMap[key] || 0) + d.valor
            })
            const evolucao = Object.entries(mesesMap).sort(([a],[b]) => a.localeCompare(b)).map(([key, total]) => {
              const [year, month] = key.split('-')
              return { key, label: `${MESES_PT[parseInt(month)-1]}/${year.slice(2)}`, total }
            })
            if (evolucao.length === 0) return null
            const maxTotal = Math.max(...evolucao.map(e => e.total))
            return (
              <>
                <SectionTitle>Evolução dos gastos</SectionTitle>
                <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-4 space-y-2.5">
                  {evolucao.map(({ key, label, total }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500 w-10 flex-shrink-0 text-right">{label}</span>
                      <div className="print-bar-track flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                        <div className="print-bar-fill h-full bg-[#7eaaee] rounded-full" style={{ width: `${maxTotal > 0 ? (total/maxTotal)*100 : 0}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-300 w-24 text-right flex-shrink-0">{formatarMoeda(total)}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}

          {/* ── DESPESAS ── */}
          {despesasFiltradas.length > 0 && tipo !== "recebimentos" && (
            <>
              <SectionTitle>{tipo === "periodo" ? "Despesas no período" : "Despesas detalhadas"} ({despesasFiltradas.length})</SectionTitle>
              <ListCard
                emptyText=""
                items={despesasFiltradas.map(d => ({
                  left: d.descricao || "Sem descrição",
                  sub: [d.data ? formatarData(d.data) : null, d.category || d.categoria || null, (tipo === "mao_obra_total" || tipo === "geral") && d.profissionalId ? getProfissionalNome(d.profissionalId) : null].filter(Boolean).join(" · ") || undefined,
                  right: formatarMoeda(d.valor),
                }))}
              />
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-gray-500">Subtotal despesas</span>
                <span className="text-sm font-bold text-gray-300">{formatarMoeda(despesasFiltradas.reduce((acc, d) => acc + (d.valor ?? 0), 0))}</span>
              </div>
            </>
          )}

          {/* ── PAGAMENTOS A PROFISSIONAIS ── */}
          {(() => {
            let pagamentosFiltrados = filtrarPagamentosPorPeriodo(pagamentos)
            if (tipo === "mao_obra_profissional") pagamentosFiltrados = filtrarPagamentosPorProfissional(pagamentosFiltrados)
            if (tipo === "recebimentos" || tipo === "material" || pagamentosFiltrados.length === 0) return null
            return (
              <>
                <SectionTitle>{tipo === "periodo" ? "Pagamentos no período" : "Pagamentos a profissionais"} ({pagamentosFiltrados.length})</SectionTitle>
                <ListCard
                  emptyText=""
                  items={pagamentosFiltrados.map(p => ({
                    left: getProfissionalNome(p.profissional_id),
                    sub: p.data ? formatarData(p.data) : undefined,
                    right: formatarMoeda(p.valor),
                  }))}
                />
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] text-gray-500">Subtotal pagamentos</span>
                  <span className="text-sm font-bold text-[#7eaaee]">{formatarMoeda(pagamentosFiltrados.reduce((acc, p) => acc + p.valor, 0))}</span>
                </div>
              </>
            )
          })()}

          {/* ── POR PROFISSIONAL ── */}
          {tipo === "mao_obra_profissional" && !profissionalId && profissionais.length > 0 && (
            <>
              <SectionTitle>Detalhamento por profissional</SectionTitle>
              {profissionais.map((prof) => {
                const despesasProf = despesasFiltradas.filter(d => d.profissionalId === prof.id)
                const pagamentosProf = pagamentos.filter(p => p.profissional_id === prof.id)
                const totalDespesasProf = despesasProf.reduce((acc, d) => acc + (d.valor ?? 0), 0)
                const totalPagamentosProf = pagamentosProf.reduce((acc, p) => acc + p.valor, 0)
                const totalProf = totalDespesasProf + totalPagamentosProf
                if (totalProf === 0) return null
                return (
                  <div key={prof.id} className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06] bg-[#0B3064]/10">
                      <div>
                        <p className="text-xs font-bold text-white">{prof.nome}</p>
                        <p className="text-[10px] text-gray-500">{prof.funcao}</p>
                      </div>
                      <span className="text-sm font-bold text-[#7eaaee]">{formatarMoeda(totalProf)}</span>
                    </div>
                    {[...despesasProf.map(d => ({ label: d.descricao || "Sem descrição", sub: d.data ? formatarData(d.data) : undefined, value: formatarMoeda(d.valor) })),
                      ...pagamentosProf.map(p => ({ label: "Pagamento", sub: p.data ? formatarData(p.data) : undefined, value: formatarMoeda(p.valor) }))
                    ].map(({ label, sub, value }, i, arr) => (
                      <div key={i} className={`flex items-center justify-between px-3 py-2 ${i < arr.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-[11px] text-gray-300 truncate">{label}</p>
                          {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
                        </div>
                        <span className="text-xs font-bold text-gray-200 flex-shrink-0">{value}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          )}

          {/* ── TOTAL GERAL ── */}
          {tipo !== "recebimentos" && (despesasFiltradas.length > 0 || pagamentos.length > 0) && (
            <div className="bg-[#0B3064]/20 border border-[#0B3064]/40 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total geral gasto</span>
              <span className="text-lg font-bold text-white">{formatarMoeda(totalGasto)}</span>
            </div>
          )}

          {/* ── RECEBIMENTOS NO PERÍODO ── */}
          {tipo === "periodo" && userProfile === "builder" && (
            <>
              <SectionTitle>Recebimentos no período ({filtrarRecebimentosPorPeriodo(recebimentos).length})</SectionTitle>
              <ListCard
                emptyText="Nenhum recebimento registrado neste período."
                items={filtrarRecebimentosPorPeriodo(recebimentos).map(r => ({
                  left: r.data ? formatarData(r.data) : "-",
                  sub: r.formaPagamento || undefined,
                  right: formatarMoeda(r.valor),
                }))}
              />
            </>
          )}

          {/* ── PROFISSIONAIS (geral) ── */}
          {tipo === "geral" && profissionais.length > 0 && (
            <>
              <SectionTitle>Profissionais cadastrados ({profissionais.length})</SectionTitle>
              <ListCard
                emptyText=""
                items={profissionais.map(prof => {
                  const valorPrevisto = prof.valorPrevisto || prof.contrato?.valorPrevisto || prof.contrato?.valorTotalPrevisto || 0
                  return { left: prof.nome, sub: prof.funcao, right: valorPrevisto > 0 ? formatarMoeda(valorPrevisto) : "—" }
                })}
              />
            </>
          )}

          {/* ── RECEBIMENTOS DO CLIENTE (geral + builder) ── */}
          {tipo === "geral" && userProfile === "builder" && (
            <>
              <SectionTitle>Recebimentos do cliente</SectionTitle>
              <RowCard rows={[
                { label: "Cliente", value: obra.nomeCliente || "Não informado" },
                { label: "Valor Contratado", value: obra.valorContratado ? formatarMoeda(obra.valorContratado) : "Não definido" },
                { label: "Total Recebido", value: formatarMoeda(calcularTotalRecebido()), valueClass: "text-emerald-400" },
                { label: "Saldo a Receber", value: formatarMoeda(calcularSaldoAReceber()), valueClass: "text-[#7eaaee]" },
              ]} />
              {recebimentos.length > 0 && (
                <ListCard
                  emptyText=""
                  items={recebimentos.map(r => ({
                    left: r.data ? formatarData(r.data) : "-",
                    sub: r.formaPagamento || undefined,
                    right: formatarMoeda(r.valor),
                  }))}
                />
              )}
            </>
          )}

          {/* Rodapé */}
          <p className="text-center text-[10px] text-gray-600 pt-2">
            Relatório gerado pelo OBREASY · {formatarData(new Date().toISOString())} às {new Date().toLocaleTimeString("pt-BR")}
          </p>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 1.2cm; size: A4 portrait; }

          .no-print { display: none !important; }

          html, body { background: white !important; }

          * {
            color: #111 !important;
            background-color: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            text-shadow: none !important;
            animation: none !important;
          }

          body { background-color: white !important; }

          .print-bar-track { background-color: #e5e5e5 !important; }
          .print-bar-fill  { background-color: #555 !important; }

          .print-card { border: 1px solid #ddd !important; border-radius: 6px !important; page-break-inside: avoid; }
        }
      `}</style>
    </>
  )
}

export default function RelatorioPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0B3064] border-t-transparent rounded-full animate-spin" /></div>}>
      <RelatorioPreviewPageContent />
    </Suspense>
  )
}
