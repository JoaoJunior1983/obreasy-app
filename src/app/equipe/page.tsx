"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Building2, ChevronRight, HardHat } from "lucide-react"
import { setActiveObraId } from "@/lib/storage"

interface ObraEquipe {
  id: string
  nome: string
  localizacao: string
  totalProfissionais: number
  funcoes: string[]
}

export default function EquipePage() {
  const router = useRouter()
  const [obras, setObras] = useState<ObraEquipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase")
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          const isAuthenticated = localStorage.getItem("isAuthenticated")
          if (isAuthenticated !== "true") {
            router.push("/")
            return
          }
          setLoading(false)
          return
        }

        // Buscar todas as obras do usuário
        const { data: obrasData, error: obrasError } = await supabase
          .from("obras")
          .select("*")
          .eq("user_id", user.id)
          .order("criada_em", { ascending: false })

        if (obrasError || !obrasData || obrasData.length === 0) {
          setObras([])
          setLoading(false)
          return
        }

        const obraIds = obrasData.map((o: any) => o.id)

        // Buscar profissionais de todas as obras de uma vez
        const { data: profissionaisData } = await supabase
          .from("profissionais")
          .select("obra_id, funcao")
          .eq("user_id", user.id)
          .in("obra_id", obraIds)

        // Agregar por obra
        const resumos: ObraEquipe[] = obrasData.map((obra: any) => {
          const profs = (profissionaisData || []).filter((p: any) => p.obra_id === obra.id)

          const funcoes = [...new Set(profs.map((p: any) => p.funcao).filter(Boolean))] as string[]

          const loc = obra.localizacao || {}
          const cidade = loc.cidade || obra.cidade || ""
          const estado = loc.estado || obra.estado || ""
          const locStr = [cidade, estado].filter(Boolean).join(" · ")

          return {
            id: obra.id,
            nome: obra.nome,
            localizacao: locStr,
            totalProfissionais: profs.length,
            funcoes: funcoes.slice(0, 3),
          }
        })

        setObras(resumos)
        setLoading(false)
      } catch (err) {
        console.error("Erro ao carregar equipe:", err)
        setLoading(false)
      }
    }

    load()
  }, [router])

  const handleObraClick = (obraId: string) => {
    setActiveObraId(obraId)
    window.dispatchEvent(new Event("obraAtualizada"))
    router.push("/dashboard/profissionais")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-lg mx-auto px-3 py-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Equipe</h1>
            <p className="text-[10px] text-gray-500">Profissionais por obra</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : obras.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhuma obra encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {obras.map((obra) => (
              <button
                key={obra.id}
                onClick={() => handleObraClick(obra.id)}
                className="w-full text-left bg-slate-800/50 border border-slate-700/30 rounded-xl px-3 py-3 hover:bg-slate-800 hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate leading-tight">{obra.nome}</p>
                    {obra.localizacao && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{obra.localizacao}</p>
                    )}
                    {obra.funcoes.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {obra.funcoes.map((f) => (
                          <span key={f} className="flex items-center gap-0.5 text-[9px] text-gray-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                            <HardHat className="w-2.5 h-2.5 text-orange-400" />
                            {f}
                          </span>
                        ))}
                        {obra.totalProfissionais > 3 && (
                          <span className="text-[9px] text-gray-500">+{obra.totalProfissionais - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: count + arrow */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-white leading-tight">{obra.totalProfissionais}</span>
                      <span className="text-[9px] text-gray-500 leading-tight">profissionais</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
