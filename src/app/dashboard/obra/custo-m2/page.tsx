"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Home, Hammer, Package, Ruler } from "lucide-react"

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
}

export default function CustoM2Page() {
  const router = useRouter()
  const [obra, setObra] = useState<Obra | null>(null)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)

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
          .eq("user_id", user.id)

        const despesasObra = despesasData?.map((d: any) => ({
          id: d.id,
          obraId: d.obra_id,
          valor: parseFloat(d.valor) || 0,
          data: d.data,
          category: d.category,
          categoria: d.categoria,
          descricao: d.descricao
        })) || []

        // Carregar pagamentos do Supabase
        const { data: pagamentosData, error: pagamentosError } = await supabase
          .from("pagamentos")
          .select("*")
          .eq("obra_id", obraAtiva.id)
          .eq("user_id", user.id)

        const pagamentosObra = pagamentosData?.map((p: any) => ({
          id: p.id,
          obraId: p.obra_id,
          valor: parseFloat(p.valor) || 0,
          data: p.data,
          category: "mao_obra",
          categoria: "mao_obra",
          profissionalId: p.profissional_id,
          descricao: "Pagamento a profissional"
        })) || []

        // Combinar despesas + pagamentos
        const todasDespesas = [...despesasObra, ...pagamentosObra]
        setDespesas(todasDespesas)

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

  const calcularTotalGasto = (): number => {
    return despesas.reduce((acc, d) => acc + (d.valor ?? 0), 0)
  }

  const calcularCustoTotalPorM2 = (): number => {
    if (!obra || !obra.area) return 0
    const totalGasto = calcularTotalGasto()
    if (totalGasto === 0) return 0
    return totalGasto / obra.area
  }

  const calcularCustoEstimadoPorM2 = (): number => {
    if (!obra || !obra.area || !obra.orcamento) return 0
    return obra.orcamento / obra.area
  }

  const calcularMaterialPorM2 = (): { total: number; porM2: number; percentual: number } => {
    if (!obra || !obra.area) return { total: 0, porM2: 0, percentual: 0 }

    const materialTotal = despesas
      .filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        const isMaoObra = category === "mao_obra" || category === "mão de obra"
        const temProfissional = !!d.profissionalId
        return !isMaoObra && !temProfissional
      })
      .reduce((acc, d) => acc + (d.valor ?? 0), 0)

    const totalGasto = calcularTotalGasto()
    const percentual = totalGasto > 0 ? (materialTotal / totalGasto) * 100 : 0

    return {
      total: materialTotal,
      porM2: materialTotal / obra.area,
      percentual
    }
  }

  const calcularMaoObraPorM2 = (): { total: number; porM2: number; percentual: number } => {
    if (!obra || !obra.area) return { total: 0, porM2: 0, percentual: 0 }

    const maoObraTotal = despesas
      .filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        const isMaoObra = category === "mao_obra" || category === "mão de obra"
        const temProfissional = !!d.profissionalId
        return isMaoObra || temProfissional
      })
      .reduce((acc, d) => acc + (d.valor ?? 0), 0)

    const totalGasto = calcularTotalGasto()
    const percentual = totalGasto > 0 ? (maoObraTotal / totalGasto) * 100 : 0

    return {
      total: maoObraTotal,
      porM2: maoObraTotal / obra.area,
      percentual
    }
  }

  const calcularDiferenca = (): { valor: number; porcentagem: number; status: "abaixo" | "acima" | "igual" } => {
    const custoAtual = calcularCustoTotalPorM2()
    const custoEstimado = calcularCustoEstimadoPorM2()

    if (custoEstimado === 0) {
      return { valor: 0, porcentagem: 0, status: "igual" }
    }

    const diferenca = custoAtual - custoEstimado
    const porcentagem = (diferenca / custoEstimado) * 100

    if (diferenca < 0) {
      return { valor: Math.abs(diferenca), porcentagem: Math.abs(porcentagem), status: "abaixo" }
    } else if (diferenca > 0) {
      return { valor: diferenca, porcentagem, status: "acima" }
    }

    return { valor: 0, porcentagem: 0, status: "igual" }
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

  const custoTotalPorM2 = calcularCustoTotalPorM2()
  const custoEstimadoPorM2 = calcularCustoEstimadoPorM2()
  const materialData = calcularMaterialPorM2()
  const maoObraData = calcularMaoObraPorM2()
  const diferenca = calcularDiferenca()
  const totalGasto = calcularTotalGasto()

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-4 pb-10 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-3">

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Ruler className="w-3.5 h-3.5 text-[#7eaaee]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Custo por m²</h1>
            {obra.nome && <p className="text-[11px] text-gray-500 truncate">{obra.nome}</p>}
          </div>
        </div>

        {/* Cards resumo — rows */}
        <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
          {[
            { label: "Custo total por m²", value: formatarMoedaDisplay(custoTotalPorM2), sub: `${obra.area} m²`, icon: <Ruler className="w-3.5 h-3.5 text-[#7eaaee]" />, iconBg: "bg-[#0B3064]/20 border-[#0B3064]/30" },
            { label: "Material / Outros", value: formatarMoedaDisplay(materialData.porM2), sub: `${materialData.percentual.toFixed(1)}% do total`, icon: <Package className="w-3.5 h-3.5 text-[#7eaaee]" />, iconBg: "bg-[#0B3064]/20 border-[#0B3064]/30" },
            { label: "Mão de Obra", value: formatarMoedaDisplay(maoObraData.porM2), sub: `${maoObraData.percentual.toFixed(1)}% do total`, icon: <Hammer className="w-3.5 h-3.5 text-orange-400" />, iconBg: "bg-orange-500/15 border-orange-500/20" },
          ].map(({ label, value, sub, icon, iconBg }, i, arr) => (
            <div key={label} className={`flex items-center justify-between px-3 py-2.5 ${i < arr.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{label}</p>
                  <p className="text-[10px] text-gray-600">{sub}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-200">{value}</p>
            </div>
          ))}
        </div>

        {/* Distribuição de Custos */}
        {totalGasto > 0 && (
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-4 space-y-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Distribuição de custos</p>

            {[
              { label: "Material / Outros", percentual: materialData.percentual, total: materialData.total, porM2: materialData.porM2, color: "bg-[#7eaaee]" },
              { label: "Mão de Obra", percentual: maoObraData.percentual, total: maoObraData.total, porM2: maoObraData.porM2, color: "bg-orange-400" },
            ].map(({ label, percentual, total, porM2, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-sm ${color}`} />
                    <span className="text-xs text-gray-300 font-medium">{label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-200">{formatarMoedaDisplay(total)}</span>
                    <span className="text-[10px] text-gray-500 ml-2">{formatarMoedaDisplay(porM2)}/m²</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentual}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-8 text-right">{percentual.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comparação com Orçamento */}
        {obra.orcamento && custoEstimadoPorM2 > 0 && (
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-3 pt-3 pb-2">Vs. orçamento estimado</p>
            {[
              { label: "Custo estimado por m²", value: formatarMoedaDisplay(custoEstimadoPorM2) },
              { label: "Orçamento total", value: formatarMoedaDisplay(obra.orcamento) },
              { label: "Total gasto", value: formatarMoedaDisplay(totalGasto) },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between px-3 py-2 ${i < arr.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
                <span className="text-[11px] text-gray-400">{label}</span>
                <span className="text-sm font-bold text-gray-200">{value}</span>
              </div>
            ))}
            {diferenca.status !== "igual" && (
              <div className={`mx-3 mb-3 mt-1 px-3 py-2 rounded-lg ${diferenca.status === "abaixo" ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                <p className={`text-xs font-semibold ${diferenca.status === "abaixo" ? "text-green-400" : "text-red-400"}`}>
                  {diferenca.status === "abaixo" ? "▼" : "▲"} {formatarMoedaDisplay(diferenca.valor)} · {diferenca.porcentagem.toFixed(1)}% {diferenca.status === "abaixo" ? "abaixo" : "acima"} do estimado
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {totalGasto === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl flex items-center justify-center">
              <Ruler className="w-8 h-8 text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm mb-1">Nenhuma despesa registrada</p>
              <p className="text-xs text-gray-500 max-w-xs">Registre despesas para acompanhar o custo por m²</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/despesas/nova")}
              className="flex items-center gap-2 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            >
              Adicionar Despesa
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
