"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Calendar, DollarSign, FileText, User, CreditCard, MessageSquare, Trash2, Edit, Eye, FileImage } from "lucide-react"
import { goToObraDashboard } from "@/lib/navigation"
import { toast } from "sonner"
import { deleteDespesa } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { getCategoriaLabel } from "@/lib/despesa-categorias"

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
  observacao?: string
  category?: string
  professionalId?: string
  anexo?: string | null
  comprovanteAnexo?: string
  criadoEm?: string
  atualizadoEm?: string
}

interface Profissional {
  id: string
  nome: string
}

interface Obra {
  id: string
  nome: string
}

// Mapear tipos para exibição (suporta categorias padrão e customizadas)
const getTipoLabel = (tipo: string): string => getCategoriaLabel(tipo)

export default function DetalhesDespesaPage() {
  const router = useRouter()
  const params = useParams()
  const despesaId = params.id as string

  const [despesa, setDespesa] = useState<Despesa | null>(null)
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(true)
  const [excluindo, setExcluindo] = useState(false)
  const [showComprovanteModal, setShowComprovanteModal] = useState(false)
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null)

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

        // Usar activeObraId para manter contexto
        const activeObraId = localStorage.getItem("activeObraId")

        if (!activeObraId) {
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
          toast.error("Obra não encontrada!")
          router.push("/dashboard/despesas")
          return
        }

        const dbObra = obraData as any
        const obraAtiva = {
          id: dbObra.id,
          nome: dbObra.nome,
        } as Obra

        setObra(obraAtiva)

        // Carregar despesas do Supabase
        const { getDespesasSupabase } = await import("@/lib/storage")
        const despesasSupabase = await getDespesasSupabase(activeObraId, user.id)

        // Encontrar a despesa específica
        const despesaEncontrada = despesasSupabase.find((d: Despesa) => d.id === despesaId)

        if (!despesaEncontrada) {
          toast.error("Despesa não encontrada!")
          router.push("/dashboard/despesas")
          return
        }

        setDespesa(despesaEncontrada)

        // Debug: verificar comprovante
        console.log("Despesa carregada:", despesaEncontrada)
        console.log("Comprovante anexo:", despesaEncontrada.anexo)
        console.log("Comprovante comprovanteAnexo:", despesaEncontrada.comprovanteAnexo)

        // Carregar profissional se houver
        if (despesaEncontrada.professionalId) {
          const { getProfissionaisSupabase } = await import("@/lib/storage")
          const profissionaisSupabase = await getProfissionaisSupabase(activeObraId, user.id)
          const profissionalEncontrado = profissionaisSupabase.find((p: Profissional) => p.id === despesaEncontrada.professionalId)
          if (profissionalEncontrado) {
            setProfissional(profissionalEncontrado)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast.error("Erro ao carregar despesa")
        router.push("/dashboard/despesas")
      }
    }

    carregarDados()
  }, [router, despesaId])

  const handleExcluirDespesa = async () => {
    if (!despesa || !despesa.id) {
      toast.error("Despesa inválida")
      return
    }

    if (!confirm("Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.")) {
      return
    }

    setExcluindo(true)

    try {
      // Usar função centralizada de exclusão
      const sucesso = await deleteDespesa(obra?.id || "", despesa.id)

      if (sucesso) {
        toast.success("Despesa excluída com sucesso!")

        // Redirecionar para lista de despesas
        setTimeout(() => {
          router.push("/dashboard/despesas")
        }, 500)
      } else {
        toast.error("Erro ao excluir despesa. Tente novamente.")
        setExcluindo(false)
      }
    } catch (error) {
      console.error("Erro ao excluir despesa:", error)
      toast.error("Erro ao excluir despesa. Tente novamente.")
      setExcluindo(false)
    }
  }

  const handleVisualizarComprovante = () => {
    const url = despesa?.anexo || despesa?.comprovanteAnexo
    if (!url) {
      toast.error("Nenhum comprovante disponível")
      return
    }

    // Verificar se é uma URL válida (começa com http/https ou data:)
    const isValidUrl = url.startsWith('http') || url.startsWith('data:')

    if (!isValidUrl) {
      toast.error("Formato de comprovante inválido")
      return
    }

    console.log('📎 Visualizando comprovante:', url.substring(0, 100) + '...')
    console.log('📎 É imagem?', isImageFile(url))
    console.log('📎 É PDF?', isPdfFile(url))

    setComprovanteUrl(url)
    setShowComprovanteModal(true)
  }

  const handleCloseComprovanteModal = () => {
    setShowComprovanteModal(false)
    setComprovanteUrl(null)
  }

  const isImageFile = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const lowerUrl = url.toLowerCase()
    // Também verificar se é um data URI de imagem
    if (url.startsWith('data:image/')) return true
    return imageExtensions.some(ext => lowerUrl.includes(ext))
  }

  const isPdfFile = (url: string): boolean => {
    if (url.startsWith('data:application/pdf')) return true
    return url.toLowerCase().includes('.pdf')
  }

  if (loading || !despesa || !obra) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            Detalhes da Despesa
          </h1>
          <p className="text-xs text-gray-400">
            {obra.nome}
          </p>
        </div>

        {/* Card de Detalhes */}
        <Card className="p-2 bg-[#0F172A] border border-white/[0.08] shadow-lg rounded-2xl space-y-1.5">
          {/* Tipo */}
          <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
            <FileText className="w-4 h-4 text-[#7eaaee] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[#94A3B8] mb-0.5">Tipo</p>
              <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                (despesa.category === 'mao_obra' || despesa.categoria === 'mao_obra' || despesa.tipo === 'mao_obra')
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-[#0B3064]/20 text-[#7eaaee] border border-[#0B3064]/40'
              }`}>
                {getTipoLabel(despesa.category || despesa.categoria || despesa.tipo || "")}
              </span>
            </div>
          </div>

          {/* Data */}
          <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
            <Calendar className="w-4 h-4 text-[#7eaaee] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[#94A3B8] mb-0.5">Data</p>
              <p className="text-[#F8FAFC] font-medium">
                {new Date(despesa.data).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
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
                R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Descrição */}
          {despesa.descricao && (
            <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
              <FileText className="w-4 h-4 text-[#7eaaee] mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[#94A3B8] mb-0.5">Descrição</p>
                <p className="text-[#F8FAFC]">{despesa.descricao}</p>
              </div>
            </div>
          )}

          {/* Forma de Pagamento */}
          {despesa.formaPagamento && (
            <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
              <CreditCard className="w-4 h-4 text-[#7eaaee] mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[#94A3B8] mb-0.5">Forma de Pagamento</p>
                <p className="text-[#F8FAFC]">{despesa.formaPagamento}</p>
              </div>
            </div>
          )}

          {/* Fornecedor/Profissional */}
          {(despesa.fornecedor || profissional) && (
            <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
              <User className="w-4 h-4 text-[#7eaaee] mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[#94A3B8] mb-0.5">
                  {profissional ? "Profissional" : "Fornecedor"}
                </p>
                <p className="text-[#F8FAFC] font-medium">
                  {profissional ? profissional.nome : despesa.fornecedor}
                </p>
              </div>
            </div>
          )}

          {/* Comprovante */}
          <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
            <FileImage className="w-4 h-4 text-[#7eaaee] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[#94A3B8] mb-0.5">Comprovante</p>
              {(despesa.anexo || despesa.comprovanteAnexo) ? (
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

          {/* Observações */}
          {(despesa.observacoes || despesa.observacao) && (
            <div className="flex items-start gap-1.5 pb-1.5 border-b border-white/10">
              <MessageSquare className="w-4 h-4 text-[#7eaaee] mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[#94A3B8] mb-0.5">Observações</p>
                <p className="text-[#F8FAFC]">{despesa.observacoes || despesa.observacao}</p>
              </div>
            </div>
          )}

          {/* Metadados */}
          {(despesa.criadoEm || despesa.atualizadoEm) && (
            <div className="pt-1.5 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {despesa.criadoEm && (
                  <div>
                    <p className="text-[#94A3B8] mb-0.5">Criado em</p>
                    <p className="text-[#F8FAFC]">{new Date(despesa.criadoEm).toLocaleString('pt-BR')}</p>
                  </div>
                )}
                {despesa.atualizadoEm && (
                  <div>
                    <p className="text-[#94A3B8] mb-0.5">Atualizado em</p>
                    <p className="text-[#F8FAFC]">{new Date(despesa.atualizadoEm).toLocaleString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-1.5 border-t border-white/10 flex flex-row gap-1.5">
            <Button
              onClick={() => router.push(`/dashboard/despesas/${despesa.id}/editar`)}
              className="flex-1 h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg text-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Despesa
            </Button>
            <Button
              onClick={handleExcluirDespesa}
              disabled={excluindo}
              className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {excluindo ? "Excluindo..." : "Excluir Despesa"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal de Visualização de Comprovante */}
      {showComprovanteModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Botão Fechar */}
            <button
              onClick={handleCloseComprovanteModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-[#1f2228] hover:bg-[#2a2d35] text-white rounded-full flex items-center justify-center shadow-lg transition-all"
              title="Fechar"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>

            {/* Conteúdo do Modal */}
            <div className="w-full h-full bg-slate-800/95 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {!comprovanteUrl ? (
                // URL não foi fornecida
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <FileImage className="w-16 h-16 text-red-400 mb-4" />
                  <p className="text-white text-lg mb-2">Comprovante não disponível</p>
                  <p className="text-gray-400 text-sm">O arquivo não foi encontrado ou não foi anexado</p>
                </div>
              ) : isImageFile(comprovanteUrl) ? (
                // Visualização de Imagem
                <div className="w-full h-full flex items-center justify-center p-8">
                  <img
                    src={comprovanteUrl}
                    alt="Comprovante"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('❌ Erro ao carregar imagem:', comprovanteUrl.substring(0, 100))
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="text-white text-center"><p class="text-red-400 text-lg mb-2">Erro ao carregar imagem</p><p class="text-gray-400 text-sm">A imagem pode estar corrompida ou o link expirou</p></div>'
                      }
                    }}
                  />
                </div>
              ) : isPdfFile(comprovanteUrl) ? (
                // Visualização de PDF
                <iframe
                  src={comprovanteUrl}
                  className="w-full h-full"
                  title="Visualização do Comprovante"
                  onError={() => {
                    console.error('❌ Erro ao carregar PDF:', comprovanteUrl.substring(0, 100))
                  }}
                />
              ) : (
                // Fallback para outros tipos de arquivo
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-white text-lg mb-2">Arquivo de comprovante</p>
                  <p className="text-gray-400 text-sm mb-4">Tipo: {comprovanteUrl.split('.').pop()?.toUpperCase() || 'Desconhecido'}</p>
                  <Button
                    onClick={() => window.open(comprovanteUrl, '_blank')}
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
