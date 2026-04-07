"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Calendar, DollarSign, FileText, User, CreditCard, MessageSquare, Edit, Eye, FileImage, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Pagamento {
  id: string
  obraId: string
  profissionalId: string
  data: string
  valor: number
  formaPagamento?: string
  observacao?: string
  comprovanteUrl?: string | null
}

interface Profissional {
  id: string
  nome: string
  funcao?: string
}

interface Obra {
  id: string
  nome: string
}

const isImageFile = (url: string): boolean => {
  if (url.startsWith("data:image/")) return true
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]
  return imageExtensions.some((ext) => url.toLowerCase().includes(ext))
}

const isPdfFile = (url: string): boolean => {
  if (url.startsWith("data:application/pdf")) return true
  return url.toLowerCase().includes(".pdf")
}

export default function DetalhesPagamentoPage() {
  const router = useRouter()
  const params = useParams()
  const pagamentoId = params.id as string

  const [pagamento, setPagamento] = useState<Pagamento | null>(null)
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(true)
  const [excluindo, setExcluindo] = useState(false)
  const [showComprovanteModal, setShowComprovanteModal] = useState(false)
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null)

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { supabase } = await import("@/lib/supabase")
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push("/login")
          return
        }

        const activeObraId = localStorage.getItem("activeObraId")
        if (!activeObraId) {
          router.push("/obras")
          return
        }

        // Carregar obra
        const { data: obraData } = await supabase
          .from("obras")
          .select("id, nome")
          .eq("id", activeObraId)
          .eq("user_id", user.id)
          .single()

        if (obraData) {
          setObra({ id: (obraData as any).id, nome: (obraData as any).nome })
        }

        // Carregar pagamento
        const { data: pagData, error: pagError } = await supabase
          .from("pagamentos")
          .select("*")
          .eq("id", pagamentoId)
          .eq("user_id", user.id)
          .single()

        if (pagError || !pagData) {
          toast.error("Pagamento não encontrado!")
          router.push("/dashboard/despesas?tipo=maoobra")
          return
        }

        const p = pagData as any
        const pagamentoCarregado: Pagamento = {
          id: p.id,
          obraId: p.obra_id,
          profissionalId: p.profissional_id,
          data: p.data || p.data_pagamento || "",
          valor: parseFloat(p.valor) || 0,
          formaPagamento: p.forma_pagamento || undefined,
          observacao: p.observacao || undefined,
          comprovanteUrl: p.comprovante_url || null,
        }
        setPagamento(pagamentoCarregado)

        // Carregar profissional
        if (pagamentoCarregado.profissionalId) {
          const { data: profData } = await supabase
            .from("profissionais")
            .select("id, nome, funcao")
            .eq("id", pagamentoCarregado.profissionalId)
            .single()

          if (profData) {
            setProfissional({
              id: (profData as any).id,
              nome: (profData as any).nome,
              funcao: (profData as any).funcao,
            })
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Erro ao carregar pagamento:", error)
        toast.error("Erro ao carregar pagamento")
        router.push("/dashboard/despesas?tipo=maoobra")
      }
    }

    carregarDados()
  }, [router, pagamentoId])

  const handleVisualizarComprovante = () => {
    const url = pagamento?.comprovanteUrl
    if (!url) {
      toast.error("Nenhum comprovante disponível")
      return
    }
    const isValid = url.startsWith("http") || url.startsWith("data:")
    if (!isValid) {
      toast.error("Formato de comprovante inválido")
      return
    }
    setComprovanteUrl(url)
    setShowComprovanteModal(true)
  }

  const handleExcluir = async () => {
    if (!pagamento) return
    if (!confirm("Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.")) return

    setExcluindo(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { error } = await supabase.from("pagamentos").delete().eq("id", pagamento.id)
      if (error) throw error
      toast.success("Pagamento excluído com sucesso!")
      setTimeout(() => router.push("/dashboard/despesas?tipo=maoobra"), 500)
    } catch (error) {
      console.error("Erro ao excluir pagamento:", error)
      toast.error("Erro ao excluir pagamento.")
      setExcluindo(false)
    }
  }

  if (loading || !pagamento || !obra) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1220] p-2 sm:p-3">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-0.5">
            Detalhes do Pagamento
          </h1>
          <p className="text-xs text-gray-400">{obra.nome}</p>
        </div>

        {/* Card de Detalhes */}
        <Card className="p-2 bg-[#0F172A] border border-white/[0.08] shadow-lg rounded-2xl space-y-1.5">
          {/* Tipo */}
          <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
            <FileText className="w-4 h-4 text-orange-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[#94A3B8] mb-0.5">Tipo</p>
              <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Mão de Obra
              </span>
            </div>
          </div>

          {/* Data */}
          <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
            <Calendar className="w-4 h-4 text-[#7eaaee] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[#94A3B8] mb-0.5">Data</p>
              <p className="text-[#F8FAFC] font-medium">
                {new Date(pagamento.data + (pagamento.data.length === 10 ? "T00:00:00" : "")).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Valor */}
          <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
            <DollarSign className="w-4 h-4 text-[#7eaaee] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[#94A3B8] mb-0.5">Valor</p>
              <p className="text-lg font-bold text-[#F8FAFC]">
                R$ {pagamento.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Profissional */}
          {profissional && (
            <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
              <User className="w-4 h-4 text-[#7eaaee] mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[#94A3B8] mb-0.5">Profissional</p>
                <p className="text-[#F8FAFC] font-medium">{profissional.nome}</p>
                {profissional.funcao && (
                  <p className="text-xs text-gray-500">{profissional.funcao}</p>
                )}
              </div>
            </div>
          )}

          {/* Forma de Pagamento */}
          {pagamento.formaPagamento && (
            <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
              <CreditCard className="w-4 h-4 text-[#7eaaee] mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[#94A3B8] mb-0.5">Forma de Pagamento</p>
                <p className="text-[#F8FAFC]">{pagamento.formaPagamento}</p>
              </div>
            </div>
          )}

          {/* Comprovante */}
          <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
            <FileImage className="w-4 h-4 text-[#7eaaee] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[#94A3B8] mb-0.5">Comprovante</p>
              {pagamento.comprovanteUrl ? (
                <Button
                  onClick={handleVisualizarComprovante}
                  className="bg-[#1E293B] hover:bg-[#243552] border border-[#334155] hover:border-[#3B82F6] text-[#F8FAFC] rounded-lg h-8 px-3 text-xs"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar comprovante
                </Button>
              ) : (
                <p className="text-[#64748B] text-sm italic">Nenhum comprovante anexado</p>
              )}
            </div>
          </div>

          {/* Observação */}
          {pagamento.observacao && (
            <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
              <MessageSquare className="w-4 h-4 text-[#7eaaee] mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[#94A3B8] mb-0.5">Observação</p>
                <p className="text-[#F8FAFC]">{pagamento.observacao}</p>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-1.5 border-t border-white/10 flex flex-row gap-1.5">
            <Button
              onClick={() => router.push(`/dashboard/pagamentos/${pagamento.id}/editar`)}
              className="flex-1 h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg text-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Pagamento
            </Button>
            <Button
              onClick={handleExcluir}
              disabled={excluindo}
              className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {excluindo ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal de Visualização de Comprovante */}
      {showComprovanteModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button
              onClick={() => { setShowComprovanteModal(false); setComprovanteUrl(null) }}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-[#1f2228] hover:bg-[#2a2d35] text-white rounded-full flex items-center justify-center shadow-lg transition-all"
              title="Fechar"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>

            <div className="w-full h-full bg-slate-800/95 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {!comprovanteUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <FileImage className="w-16 h-16 text-red-400 mb-4" />
                  <p className="text-white text-lg mb-2">Comprovante não disponível</p>
                  <p className="text-gray-400 text-sm">O arquivo não foi encontrado ou não foi anexado</p>
                </div>
              ) : isImageFile(comprovanteUrl) ? (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <img
                    src={comprovanteUrl}
                    alt="Comprovante"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="text-white text-center"><p class="text-red-400 text-lg mb-2">Erro ao carregar imagem</p><p class="text-gray-400 text-sm">A imagem pode estar corrompida ou o link expirou</p></div>'
                      }
                    }}
                  />
                </div>
              ) : isPdfFile(comprovanteUrl) ? (
                <iframe
                  src={comprovanteUrl}
                  className="w-full h-full"
                  title="Visualização do Comprovante"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-white text-lg mb-2">Arquivo de comprovante</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Tipo: {comprovanteUrl.split(".").pop()?.toUpperCase() || "Desconhecido"}
                  </p>
                  <Button
                    onClick={() => window.open(comprovanteUrl, "_blank")}
                    className="bg-[#0B3064] hover:bg-[#082551] text-white"
                  >
                    Abrir em nova aba
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
