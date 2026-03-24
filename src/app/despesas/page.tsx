"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, Building2, ChevronRight, Hammer, Package } from "lucide-react"
import { setActiveObraId } from "@/lib/storage"

interface ObraResumo {
  id: string
  nome: string
  localizacao: string
  orcamento: number
  totalMaterial: number
  totalMaoObra: number
  totalGasto: number
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

export default function DespesasResumoPage() {
  const router = useRouter()
  const [obras, setObras] = useState<ObraResumo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase")
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          // Fallback: checar localStorage (modo dev / login simulado)
          const isAuthenticated = localStorage.getItem("isAuthenticated")
          if (isAuthenticated !== "true") {
            router.push("/")
            return
          }
          setLoading(false)
          return
        }

        // Se já há uma obra ativa, ir direto para as despesas sem exibir seleção
        const activeObraId = localStorage.getItem("activeObraId")
        if (activeObraId) {
          router.replace("/dashboard/despesas")
          return
        }

        // Buscar todas as obras do usuário
        const { data: obrasData, error: obrasError } = await supabase
          .from("obras")
          .select("*")
          .eq("user_id", user.id)
          .order("criada_em", { ascending: false })

        if (obrasError) {
          console.error("Erro ao buscar obras:", obrasError)
          setLoading(false)
          return
        }

        if (!obrasData || obrasData.length === 0) {
          setObras([])
          setLoading(false)
          return
        }

        // Buscar todas as despesas do usuário de uma só vez
        const obraIds = obrasData.map((o: any) => o.id)

        const { data: despesasData } = await supabase
          .from("despesas")
          .select("obra_id, valor, categoria, profissional_id")
          .eq("user_id", user.id)
          .in("obra_id", obraIds)

        // Buscar todos os pagamentos do usuário de uma só vez
        const { data: pagamentosData } = await supabase
          .from("pagamentos")
          .select("obra_id, valor")
          .eq("user_id", user.id)
          .in("obra_id", obraIds)

        // Agregar por obra
        const resumos: ObraResumo[] = obrasData.map((obra: any) => {
          const despesasObra = (despesasData || []).filter((d: any) => d.obra_id === obra.id)
          const pagamentosObra = (pagamentosData || []).filter((p: any) => p.obra_id === obra.id)

          let totalMaterial = 0
          let totalMaoObraDespesas = 0

          despesasObra.forEach((d: any) => {
            const cat = String(d.categoria ?? "").toLowerCase()
            const isMaoObra = cat === "mao_obra" || !!d.profissional_id
            if (isMaoObra) {
              totalMaoObraDespesas += parseFloat(d.valor) || 0
            } else {
              totalMaterial += parseFloat(d.valor) || 0
            }
          })

          const totalMaoObraPagamentos = pagamentosObra.reduce(
            (acc: number, p: any) => acc + (parseFloat(p.valor) || 0),
            0
          )

          const totalMaoObra = totalMaoObraDespesas + totalMaoObraPagamentos
          const totalGasto = totalMaterial + totalMaoObra

          // Suporta localizacao como JSON {cidade, estado} ou colunas separadas
          const loc = obra.localizacao || {}
          const cidade = loc.cidade || obra.cidade || ""
          const estado = loc.estado || obra.estado || ""
          const locStr = [cidade, estado].filter(Boolean).join(" · ")

          return {
            id: obra.id,
            nome: obra.nome,
            localizacao: locStr,
            orcamento: parseFloat(obra.orcamento) || 0,
            totalMaterial,
            totalMaoObra,
            totalGasto,
          }
        })

        setObras(resumos)
        setLoading(false)
      } catch (err) {
        console.error("Erro ao carregar resumo de despesas:", err)
        setLoading(false)
      }
    }

    load()
  }, [router])

  const handleObraClick = (obraId: string) => {
    setActiveObraId(obraId)
    window.dispatchEvent(new Event("obraAtualizada"))
    router.push("/dashboard/despesas")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-lg mx-auto px-3 py-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Despesas</h1>
            <p className="text-[10px] text-gray-500">Resumo por obra</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : obras.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhuma obra encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {obras.map((obra) => {
              const pct = obra.orcamento > 0
                ? Math.min(100, (obra.totalGasto / obra.orcamento) * 100)
                : 0
              const overBudget = obra.orcamento > 0 && obra.totalGasto > obra.orcamento

              return (
                <button
                  key={obra.id}
                  onClick={() => handleObraClick(obra.id)}
                  className="w-full text-left bg-slate-800/50 border border-slate-700/30 rounded-xl px-3 py-3 hover:bg-slate-800 hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate leading-tight">{obra.nome}</p>
                      {obra.localizacao && (
                        <p className="text-[10px] text-gray-500 mt-0.5">{obra.localizacao}</p>
                      )}

                      {/* Material / Mão de Obra */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Package className="w-3 h-3 text-blue-400" />
                          {fmt(obra.totalMaterial)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Hammer className="w-3 h-3 text-orange-400" />
                          {fmt(obra.totalMaoObra)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      {obra.orcamento > 0 && (
                        <div className="mt-2">
                          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${overBudget ? "bg-red-500" : "bg-blue-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-gray-600 mt-0.5">
                            {pct.toFixed(0)}% do orçamento · {fmt(obra.orcamento)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: total + arrow */}
                    <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                      <span className={`text-base font-bold ${overBudget ? "text-red-400" : "text-white"}`}>
                        {fmt(obra.totalGasto)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
