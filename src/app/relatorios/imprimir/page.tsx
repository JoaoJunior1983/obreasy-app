"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { type Obra, type Despesa, type Profissional } from "@/lib/storage"

type TipoRelatorio = "geral" | "periodo" | "material" | "mao_obra_total" | "mao_obra_profissional"

function ImprimirRelatorioContent() {
  const searchParams = useSearchParams()
  const obraId = searchParams.get("obraId") || ""
  const tipo = (searchParams.get("tipo") || "geral") as TipoRelatorio
  const dataInicio = searchParams.get("dataInicio") || ""
  const dataFim = searchParams.get("dataFim") || ""
  const profissionalId = searchParams.get("profissionalId") || ""

  const [obra, setObra] = useState<Obra | null>(null)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [pagamentos, setPagamentos] = useState<{ id: string; valor: number; data: string; profissional_id: string; descricao?: string }[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [recebimentos, setRecebimentos] = useState<{ id: string; valor: number; data: string; formaPagamento: string; observacao: string | null; comprovanteUrl: string | null; clienteNome: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [printTriggered, setPrintTriggered] = useState(false)

  useEffect(() => {
    const carregarDados = async () => {
      console.log("[DEBUG] Iniciando carregamento do relatório para impressão")
      console.log("[DEBUG] Parâmetros:", { obraId, tipo, dataInicio, dataFim, profissionalId })

      if (!obraId) {
        console.error("[DEBUG] obraId não fornecido - print not triggered")
        return
      }

      try {
        // Carregar obra do Supabase
        const { supabase } = await import("@/lib/supabase")
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          console.error("[DEBUG] Usuário não autenticado - print not triggered")
          return
        }

        const { data: dbObra, error: obraError } = await supabase
          .from("obras")
          .select("*")
          .eq("id", obraId)
          .eq("user_id", user.id)
          .single()

        if (obraError || !dbObra) {
          console.error("[DEBUG] Obra não encontrada - print not triggered", obraError)
          return
        }

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

        console.log("[DEBUG] Obra carregada do Supabase:", obraEncontrada.nome)
        setObra(obraEncontrada)

        // Carregar despesas do Supabase (excluindo as vinculadas a profissional para evitar duplicação)
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
        console.log("[DEBUG] Despesas carregadas:", despesasObra.length)
        setDespesas(despesasObra)

        // Carregar profissionais do Supabase
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
          console.log("[DEBUG] Profissionais carregados do Supabase:", profissionaisObra.length)
          setProfissionais(profissionaisObra)
        }

        // Carregar pagamentos do Supabase
        const { data: pagamentosData } = await supabase
          .from("pagamentos")
          .select("id, valor, data_pagamento, profissional_id, observacao")
          .eq("obra_id", obraId)
          .eq("user_id", user.id)
          .order("data_pagamento", { ascending: false })

        if (pagamentosData && pagamentosData.length > 0) {
          console.log("[DEBUG] Pagamentos carregados:", pagamentosData.length)
          setPagamentos(pagamentosData.map((p: any) => ({
            id: p.id,
            valor: parseFloat(p.valor) || 0,
            data: p.data_pagamento,
            profissional_id: p.profissional_id,
            descricao: p.observacao || undefined
          })))
        } else {
          console.log("[DEBUG] Nenhum pagamento encontrado")
        }

        // Carregar recebimentos do Supabase
        const { data: recebimentosData } = await supabase
          .from("recebimentos")
          .select("id, valor, data, forma_pagamento, observacao, comprovante_url, clientes(nome)")
          .eq("obra_id", obraId)
          .eq("user_id", user.id)
          .order("data", { ascending: false })
        if (recebimentosData) {
          setRecebimentos(recebimentosData.map((r: any) => ({
            id: r.id,
            valor: parseFloat(r.valor) || 0,
            data: r.data || "",
            formaPagamento: r.forma_pagamento || "",
            observacao: r.observacao || null,
            comprovanteUrl: r.comprovante_url || null,
            clienteNome: r.clientes?.nome || "—",
          })))
        }

        setLoading(false)
      } catch (error) {
        console.error("[DEBUG] Erro ao carregar dados:", error)
        console.error("[DEBUG] print not triggered - erro no carregamento")
      }
    }

    carregarDados()
  }, [obraId, tipo, dataInicio, dataFim, profissionalId])

  useEffect(() => {
    if (!loading && obra && !printTriggered) {
      console.log("[DEBUG] Relatório renderizado, aguardando 500ms para chamar window.print()")
      
      const timer = setTimeout(() => {
        console.log("[DEBUG] Chamando window.print()")
        setPrintTriggered(true)
        window.print()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [loading, obra, printTriggered])

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

    return despesas.filter(d => {
      if (!d.data) return false
      // Extrair apenas a parte da data (YYYY-MM-DD) para comparação
      const dataDespesaStr = d.data.split('T')[0]
      return dataDespesaStr >= dataInicio && dataDespesaStr <= dataFim
    })
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

  const calcularTotalGasto = (): number => {
    const despesasFiltradas = filtrarDespesasPorTipo(filtrarDespesasPorPeriodo(despesas))
    const totalDespesas = despesasFiltradas.reduce((acc, d) => acc + (d.valor ?? 0), 0)

    // Adicionar pagamentos se for relatório de mão de obra
    let totalPagamentos = 0
    if (tipo === "geral" || tipo === "periodo" || tipo === "mao_obra_total" || tipo === "mao_obra_profissional") {
      let pagamentosFiltrados = filtrarPagamentosPorPeriodo(pagamentos)
      if (tipo === "mao_obra_profissional") {
        pagamentosFiltrados = filtrarPagamentosPorProfissional(pagamentosFiltrados)
      }
      totalPagamentos = pagamentosFiltrados.reduce((acc, p) => acc + p.valor, 0)
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
      default:
        return "Relatório"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando relatório para impressão...</p>
        </div>
      </div>
    )
  }

  if (!obra) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 font-bold">Erro: Obra não encontrada</p>
          <p className="text-gray-600 text-sm mt-2">Verifique o console para mais detalhes</p>
        </div>
      </div>
    )
  }

  const totalGasto = calcularTotalGasto()
  const saldoDisponivel = calcularSaldoDisponivel()
  const distribuicao = calcularDistribuicao()
  const despesasFiltradas = filtrarDespesasPorTipo(filtrarDespesasPorPeriodo(despesas))

  const handleFechar = () => {
    window.close()
    // Se window.close() não funcionar (navegador bloqueia), usar history.back()
    setTimeout(() => {
      window.history.back()
    }, 100)
  }

  return (
    <>
      {/* Botão Fechar - oculto na impressão */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:justify-between shadow-sm z-10">
        <button
          onClick={handleFechar}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          ← Fechar
        </button>
        <p className="text-xs sm:text-sm text-gray-600">Após imprimir ou cancelar, clique em "Fechar" para voltar</p>
      </div>

      <div className="max-w-5xl mx-auto p-3 sm:p-8 bg-white">
        {/* Cabeçalho do relatório */}
        <div className="mb-4 sm:mb-8 pb-3 sm:pb-6 border-b-2 border-gray-800">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
            {getTituloRelatorio()}
          </h1>
          <div className="text-xs sm:text-sm text-gray-700 space-y-0.5 sm:space-y-1">
            <p><strong>Obra:</strong> {obra.nome}</p>
            <p><strong>Localização:</strong> {obra.localizacao.cidade}/{obra.localizacao.estado}</p>
            <p><strong>Tipo:</strong> {obra.tipo === "construcao" ? "Construção" : "Reforma"}</p>
            <p><strong>Área:</strong> {obra.area} m²</p>
            <p><strong>Data do relatório:</strong> {formatarData(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Resumo financeiro - apenas para relatórios gerais e por período */}
        {(tipo === "geral" || tipo === "periodo") && (
          <div className="mb-4 sm:mb-8 page-break-inside-avoid">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Resumo Financeiro</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div className="border-2 border-gray-800 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700 mb-1">Orçamento Estimado</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900">
                  {obra.orcamento ? formatarMoeda(obra.orcamento) : "Não definido"}
                </p>
              </div>
              <div className="border-2 border-gray-800 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700 mb-1">Total Gasto</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900">{formatarMoeda(totalGasto)}</p>
              </div>
              <div className="border-2 border-gray-800 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700 mb-1">Saldo Disponível</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900">
                  {obra.orcamento ? formatarMoeda(saldoDisponivel) : "R$ 0,00"}
                </p>
              </div>
              <div className="border-2 border-gray-800 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700 mb-1">Custo por m²</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900">{calcularCustoPorM2()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Distribuição de gastos - apenas para relatórios gerais e por período */}
        {(tipo === "geral" || tipo === "periodo") && totalGasto > 0 && (
          <div className="mb-4 sm:mb-8 page-break-inside-avoid">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Distribuição de Gastos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div className="border-2 border-gray-800 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700 mb-2">Material / Outros</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900 mb-1">
                  {formatarMoeda(distribuicao.materialOutros)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {distribuicao.percMaterialOutros.toFixed(1)}% do orçamento
                </p>
              </div>
              <div className="border-2 border-gray-800 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700 mb-2">Mão de Obra</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900 mb-1">
                  {formatarMoeda(distribuicao.maoObra)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {distribuicao.percMaoObra.toFixed(1)}% do orçamento
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de despesas */}
        {despesasFiltradas.length > 0 && (
          <div className="mb-4 sm:mb-8">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4">
              Despesas Detalhadas ({despesasFiltradas.length})
            </h2>
            <div className="border-2 border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-gray-800 w-[12%]">Data</th>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-gray-800 w-[30%]">Descrição</th>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-gray-800 w-[18%]">Categoria</th>
                    {(tipo === "mao_obra_total" || tipo === "geral") && (
                      <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-gray-800 w-[22%]">Profissional</th>
                    )}
                    <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-900 border-b-2 border-gray-800 w-[18%]">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {despesasFiltradas.map((despesa, index) => (
                    <tr key={despesa.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-2 py-1.5 text-[9px] text-gray-900 border-b border-gray-300 whitespace-nowrap">
                        {despesa.data ? formatarData(despesa.data) : "-"}
                      </td>
                      <td className="px-2 py-1.5 text-[9px] text-gray-900 border-b border-gray-300 break-words">
                        {despesa.descricao || "Sem descrição"}
                      </td>
                      <td className="px-2 py-1.5 text-[9px] text-gray-700 border-b border-gray-300 break-words">
                        {despesa.category || despesa.categoria || despesa.tipo || "-"}
                      </td>
                      {(tipo === "mao_obra_total" || tipo === "geral") && (
                        <td className="px-2 py-1.5 text-[9px] text-gray-700 border-b border-gray-300 break-words">
                          {despesa.profissionalId ? getProfissionalNome(despesa.profissionalId) : "-"}
                        </td>
                      )}
                      <td className="px-2 py-1.5 text-[9px] text-gray-900 text-right font-bold border-b border-gray-300 break-words">
                        {formatarMoeda(despesa.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-200">
                  <tr>
                    <td colSpan={(tipo === "mao_obra_total" || tipo === "geral") ? 4 : 3} className="px-4 py-3 text-sm font-bold text-gray-900 text-right border-t-2 border-gray-800">
                      Subtotal Despesas:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right border-t-2 border-gray-800">
                      {formatarMoeda(despesasFiltradas.reduce((acc, d) => acc + (d.valor ?? 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Lista de pagamentos a profissionais */}
        {(() => {
          let pagamentosFiltrados = filtrarPagamentosPorPeriodo(pagamentos)
          if (tipo === "mao_obra_profissional") {
            pagamentosFiltrados = filtrarPagamentosPorProfissional(pagamentosFiltrados)
          }
          // Só mostrar pagamentos em relatórios que incluem mão de obra
          const mostrarPagamentos = tipo !== "material" && pagamentosFiltrados.length > 0

          return mostrarPagamentos ? (
            <div className="mb-8 page-break-inside-avoid">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Pagamentos a Profissionais ({pagamentosFiltrados.length})
              </h2>
              <div className="border-2 border-blue-600 rounded-lg overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-blue-600 w-[15%]">Data</th>
                      <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-blue-600 w-[35%]">Descrição</th>
                      <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-blue-600 w-[30%]">Profissional</th>
                      <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-900 border-b-2 border-blue-600 w-[20%]">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentosFiltrados.map((pagamento, index) => (
                      <tr key={pagamento.id} className={index % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                        <td className="px-2 py-1.5 text-[9px] text-gray-900 border-b border-gray-300 whitespace-nowrap">
                          {pagamento.data ? formatarData(pagamento.data) : "-"}
                        </td>
                        <td className="px-2 py-1.5 text-[9px] text-gray-900 border-b border-gray-300 break-words">
                          {pagamento.descricao || "Pagamento"}
                        </td>
                        <td className="px-2 py-1.5 text-[9px] text-gray-700 border-b border-gray-300 break-words">
                          {getProfissionalNome(pagamento.profissional_id)}
                        </td>
                        <td className="px-2 py-1.5 text-[9px] text-blue-700 text-right font-bold border-b border-gray-300 break-words">
                          {formatarMoeda(pagamento.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-100">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 text-right border-t-2 border-blue-600">
                        Subtotal Pagamentos:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-700 text-right border-t-2 border-blue-600">
                        {formatarMoeda(pagamentosFiltrados.reduce((acc, p) => acc + p.valor, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : null
        })()}

        {/* Relatório agrupado por profissional - quando nenhum profissional específico foi selecionado */}
        {tipo === "mao_obra_profissional" && !profissionalId && profissionais.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Detalhamento por Profissional
            </h2>
            {profissionais.map((prof) => {
              // Filtrar despesas deste profissional
              const despesasProfissional = despesasFiltradas.filter(d => d.profissionalId === prof.id)
              // Filtrar pagamentos deste profissional
              const pagamentosProfissional = pagamentos.filter(p => p.profissional_id === prof.id)

              const totalDespesasProf = despesasProfissional.reduce((acc, d) => acc + (d.valor ?? 0), 0)
              const totalPagamentosProf = pagamentosProfissional.reduce((acc, p) => acc + p.valor, 0)
              const totalProf = totalDespesasProf + totalPagamentosProf

              // Só mostrar se houver alguma movimentação
              if (totalProf === 0) return null

              return (
                <div key={prof.id} className="mb-6 border-2 border-blue-600 rounded-lg overflow-hidden overflow-x-auto page-break-inside-avoid">
                  {/* Cabeçalho do profissional */}
                  <div className="bg-blue-100 border-b-2 border-blue-600 p-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {prof.nome} - {prof.funcao}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Total gasto: <span className="font-bold text-blue-700">{formatarMoeda(totalProf)}</span>
                    </p>
                  </div>

                  {/* Despesas do profissional */}
                  {despesasProfissional.length > 0 && (
                    <div className="p-4 bg-white">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Despesas</p>
                      <table className="w-full text-sm min-w-[400px]">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-900 border-b-2 border-gray-800">Data</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-900 border-b-2 border-gray-800">Descrição</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-gray-900 border-b-2 border-gray-800">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {despesasProfissional.map((desp, idx) => (
                            <tr key={desp.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-3 py-2 text-gray-900 border-b border-gray-300">{desp.data ? formatarData(desp.data) : "-"}</td>
                              <td className="px-3 py-2 text-gray-900 border-b border-gray-300">{desp.descricao || "Sem descrição"}</td>
                              <td className="px-3 py-2 text-right font-bold text-gray-900 border-b border-gray-300">{formatarMoeda(desp.valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-200">
                          <tr>
                            <td colSpan={2} className="px-3 py-2 text-xs font-bold text-gray-900 text-right border-t-2 border-gray-800">Subtotal:</td>
                            <td className="px-3 py-2 text-right text-sm font-bold text-gray-900 border-t-2 border-gray-800">{formatarMoeda(totalDespesasProf)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* Pagamentos do profissional */}
                  {pagamentosProfissional.length > 0 && (
                    <div className="p-4 bg-blue-50 border-t-2 border-blue-300">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Pagamentos</p>
                      <table className="w-full text-sm min-w-[400px]">
                        <thead className="bg-blue-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-900 border-b-2 border-blue-600">Data</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-900 border-b-2 border-blue-600">Descrição</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-gray-900 border-b-2 border-blue-600">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagamentosProfissional.map((pag, idx) => (
                            <tr key={pag.id} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                              <td className="px-3 py-2 text-gray-900 border-b border-gray-300">{pag.data ? formatarData(pag.data) : "-"}</td>
                              <td className="px-3 py-2 text-gray-900 border-b border-gray-300">{pag.descricao || "Pagamento"}</td>
                              <td className="px-3 py-2 text-right font-bold text-blue-700 border-b border-gray-300">{formatarMoeda(pag.valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-blue-100">
                          <tr>
                            <td colSpan={2} className="px-3 py-2 text-xs font-bold text-gray-900 text-right border-t-2 border-blue-600">Subtotal:</td>
                            <td className="px-3 py-2 text-right text-sm font-bold text-blue-700 border-t-2 border-blue-600">{formatarMoeda(totalPagamentosProf)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Total Geral (Despesas + Pagamentos) */}
        {(despesasFiltradas.length > 0 || pagamentos.length > 0) && (
          <div className="mb-8 page-break-inside-avoid">
            <div className="bg-green-100 border-4 border-green-600 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">TOTAL GERAL GASTO</h2>
                <p className="text-4xl font-bold text-green-700">{formatarMoeda(totalGasto)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recebimentos dos clientes - relatório geral e por período */}
        {(tipo === "geral" || tipo === "periodo") && recebimentos.length > 0 && (() => {
          const recFiltrados = tipo === "periodo" && dataInicio && dataFim
            ? recebimentos.filter(r => r.data.split("T")[0] >= dataInicio && r.data.split("T")[0] <= dataFim)
            : recebimentos
          if (recFiltrados.length === 0) return null
          const totalRec = recFiltrados.reduce((acc, r) => acc + r.valor, 0)
          return (
            <div className="mb-8 page-break-inside-avoid">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Recebimentos dos Clientes ({recFiltrados.length})
              </h2>
              <div className="border-2 border-green-600 rounded-lg overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-green-600 w-[12%]">Data</th>
                      <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-green-600 w-[25%]">Cliente</th>
                      <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-900 border-b-2 border-green-600 w-[15%]">Valor</th>
                      <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-green-600 w-[18%]">Forma Pgto</th>
                      <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-green-600 w-[30%]">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recFiltrados.map((rec, index) => (
                      <tr key={rec.id} className={index % 2 === 0 ? "bg-white" : "bg-green-50"}>
                        <td className="px-2 py-1.5 text-[9px] text-gray-900 border-b border-gray-300 whitespace-nowrap">
                          {rec.data ? formatarData(rec.data) : "-"}
                        </td>
                        <td className="px-2 py-1.5 text-[9px] text-gray-900 border-b border-gray-300 break-words">
                          {rec.clienteNome}
                        </td>
                        <td className="px-2 py-1.5 text-[9px] text-green-700 text-right font-bold border-b border-gray-300 whitespace-nowrap">
                          {formatarMoeda(rec.valor)}
                        </td>
                        <td className="px-2 py-1.5 text-[9px] text-gray-700 border-b border-gray-300 break-words">
                          {rec.formaPagamento || "-"}
                        </td>
                        <td className="px-2 py-1.5 text-[9px] text-gray-700 border-b border-gray-300 break-words">
                          {rec.observacao || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-green-100">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900 text-right border-t-2 border-green-600">
                        Total Recebido:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-700 text-right border-t-2 border-green-600">
                        {formatarMoeda(totalRec)}
                      </td>
                      <td colSpan={2} className="border-t-2 border-green-600" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )
        })()}

        {/* Profissionais - apenas para relatório geral */}
        {tipo === "geral" && profissionais.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Profissionais Cadastrados ({profissionais.length})
            </h2>
            <div className="border-2 border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-gray-800 w-[40%]">Nome</th>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-900 border-b-2 border-gray-800 w-[30%]">Função</th>
                    <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-900 border-b-2 border-gray-800 w-[30%]">Valor Previsto</th>
                  </tr>
                </thead>
                <tbody>
                  {profissionais.map((prof, index) => {
                    const valorPrevisto = prof.valorPrevisto || prof.contrato?.valorPrevisto || prof.contrato?.valorTotalPrevisto || 0
                    return (
                      <tr key={prof.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-2 py-1.5 text-[9px] text-gray-900 border-b border-gray-300 break-words">{prof.nome}</td>
                        <td className="px-2 py-1.5 text-[9px] text-gray-700 border-b border-gray-300 break-words">{prof.funcao}</td>
                        <td className="px-2 py-1.5 text-[9px] text-gray-900 text-right font-bold border-b border-gray-300 break-words">
                          {formatarMoeda(valorPrevisto)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-12 pt-6 border-t-2 border-gray-800 text-center text-sm text-gray-600">
          <p className="font-bold">Relatório gerado pelo sistema OBREASY</p>
          <p>{formatarData(new Date().toISOString())} às {new Date().toLocaleTimeString("pt-BR")}</p>
        </div>
      </div>

      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            margin: 0;
            padding: 0;
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          @page {
            margin: 1.5cm;
            size: A4;
          }
          
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
        }
        
        @media screen {
          body {
            background: #f3f4f6;
          }
        }
      `}</style>
    </>
  )
}

export default function ImprimirRelatorioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    }>
      <ImprimirRelatorioContent />
    </Suspense>
  )
}
