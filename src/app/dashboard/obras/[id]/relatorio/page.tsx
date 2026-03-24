"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { FileText, Calendar, Hammer, Users, FileBarChart, HandCoins } from "lucide-react"
import { type Obra, type Profissional } from "@/lib/storage"

type TipoRelatorio = "geral" | "periodo" | "material" | "mao_obra_profissional" | "recebimentos"

const TIPOS = [
  {
    id: "geral" as TipoRelatorio,
    icon: FileBarChart,
    label: "Relatório Geral da Obra",
    desc: "Visão completa com todas as informações financeiras e de progresso",
  },
  {
    id: "periodo" as TipoRelatorio,
    icon: Calendar,
    label: "Relatório por Período",
    desc: "Despesas e movimentações em um intervalo de datas específico",
  },
  {
    id: "material" as TipoRelatorio,
    icon: Hammer,
    label: "Apenas Material / Outros",
    desc: "Relatório focado em despesas de materiais e outros custos",
  },
  {
    id: "mao_obra_profissional" as TipoRelatorio,
    icon: Users,
    label: "Mão de Obra por Profissional",
    desc: "Detalhamento de custos por profissional (todos ou específico)",
  },
]

export default function EscolhaRelatorioPage() {
  const router = useRouter()
  const params = useParams()
  const obraId = params.id as string

  const [obra, setObra] = useState<Obra | null>(null)
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [userProfile, setUserProfile] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>("geral")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [profissionalId, setProfissionalId] = useState("")

  useEffect(() => {
    const carregarDados = async () => {
      const isAuthenticated = localStorage.getItem("isAuthenticated")
      if (!isAuthenticated) { router.push("/"); return }

      const userData = localStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        setUserProfile(user.profile || null)
      }

      try {
        const { supabase } = await import("@/lib/supabase")
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push("/"); return }

        const { data: dbObra, error: obraError } = await supabase
          .from("obras").select("*").eq("id", obraId).eq("user_id", user.id).single()

        if (obraError || !dbObra) { router.push("/obras"); return }

        setObra({
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
        })

        const { data: profissionaisData } = await supabase
          .from("profissionais").select("*").eq("obra_id", obraId).eq("user_id", user.id).order("criada_em", { ascending: false })

        if (profissionaisData) {
          setProfissionais(profissionaisData.map((p: any) => ({
            id: p.id, obraId: p.obra_id, nome: p.nome, funcao: p.funcao,
            telefone: p.telefone || undefined, valorPrevisto: p.valor_previsto || undefined,
            contrato: p.contrato || undefined, criadoEm: p.criada_em, atualizadoEm: p.atualizada_em
          })))
        }

        setLoading(false)
      } catch (error) {
        router.push("/obras")
      }
    }
    carregarDados()
  }, [obraId, router])

  const handleGerarRelatorio = () => {
    if (!obra) return
    if (tipoRelatorio === "periodo" && (!dataInicio || !dataFim)) {
      alert("Por favor, preencha as datas de início e fim para o relatório por período.")
      return
    }
    const urlParams = new URLSearchParams({
      tipo: tipoRelatorio,
      ...(tipoRelatorio === "periodo" && { dataInicio, dataFim }),
      ...(tipoRelatorio === "mao_obra_profissional" && profissionalId && profissionalId !== "all" && { profissionalId })
    })
    router.push(`/dashboard/obras/${obraId}/relatorio/preview?${urlParams.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3064] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!obra) return null

  const tiposVisiveis = userProfile === "builder"
    ? [...TIPOS, { id: "recebimentos" as TipoRelatorio, icon: HandCoins, label: "Recebimentos do Cliente", desc: "Visão detalhada de todos os valores recebidos do cliente, com histórico e totais" }]
    : TIPOS

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-4 pb-10 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-3">

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-3.5 h-3.5 text-[#7eaaee]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Gerar Relatório</h1>
            {obra.nome && <p className="text-[11px] text-gray-500 truncate">{obra.nome}</p>}
          </div>
        </div>

        {/* Tipos de relatório */}
        <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
          {tiposVisiveis.map(({ id, icon: Icon, label, desc }, i, arr) => {
            const active = tipoRelatorio === id
            return (
              <div key={id}>
                <div
                  onClick={() => setTipoRelatorio(id)}
                  className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors ${active ? "bg-[#0B3064]/15" : "hover:bg-white/[0.03]"} ${i < arr.length - 1 ? "border-b border-white/[0.06]" : ""}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${active ? "bg-[#0B3064]/20 border-[#0B3064]/30" : "bg-white/[0.04] border-white/[0.08]"}`}>
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-[#7eaaee]" : "text-gray-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${active ? "text-white" : "text-gray-300"}`}>{label}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${active ? "border-[#7eaaee] bg-[#0B3064]" : "border-white/20"}`}>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-[#7eaaee]" />}
                  </div>
                </div>

                {/* Período: datas inline */}
                {active && id === "periodo" && (
                  <div className="px-3 pb-3 grid grid-cols-2 gap-3 bg-[#0B3064]/10 border-b border-white/[0.06]">
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 mt-2">Data inicial</p>
                      <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#2a2d35]">
                        <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                          className="w-full h-9 px-3 bg-transparent text-sm text-white focus:outline-none appearance-none"
                          style={{ WebkitAppearance: 'none', fontSize: '13px', lineHeight: '36px', minWidth: 0 }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 mt-2">Data final</p>
                      <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#2a2d35]">
                        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                          className="w-full h-9 px-3 bg-transparent text-sm text-white focus:outline-none appearance-none"
                          style={{ WebkitAppearance: 'none', fontSize: '13px', lineHeight: '36px', minWidth: 0 }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Profissional: select inline */}
                {active && id === "mao_obra_profissional" && (
                  <div className="px-3 pb-3 bg-[#0B3064]/10 border-b border-white/[0.06]">
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 mt-2">Profissional</p>
                    <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#2a2d35]">
                      <select value={profissionalId} onChange={e => setProfissionalId(e.target.value)}
                        className="w-full h-9 px-3 bg-transparent text-sm text-white focus:outline-none appearance-none"
                        style={{ WebkitAppearance: 'none' }}>
                        <option value="">Todos os profissionais</option>
                        <option value="all">Todos os profissionais</option>
                        {profissionais.map(prof => (
                          <option key={prof.id} value={prof.id}>{prof.nome} — {prof.funcao}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Botão gerar */}
        <button
          onClick={handleGerarRelatorio}
          className="w-full flex items-center justify-center gap-2 h-11 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <FileText className="w-4 h-4" />
          Gerar Relatório
        </button>

      </div>
    </div>
  )
}
