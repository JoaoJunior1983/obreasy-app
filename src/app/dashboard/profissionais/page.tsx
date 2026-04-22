"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Users, Trash2, FileText, Clock, X, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { getPagamentosByProfissional, getActiveObraId } from "@/lib/storage"

interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
  telefone?: string
  observacoes?: string
  valorPrevisto?: number
  contrato?: {
    tipoCobranca: string
    valorCombinado: number
    quantidadeBase: number
    valorTotalPrevisto: number
    dataInicio?: string
    dataTermino?: string
    valorPrevisto?: number
  }
  pagamentos?: Array<{
    id: string
    data: string
    valor: number
    formaPagamento: string
    observacao?: string
  }>
  extras?: Array<{
    id: string
    data: string
    descricao: string
    valor: number
    status: "Pendente" | "Aprovado" | "Rejeitado"
    observacao?: string
  }>
  despesas?: Array<{
    id: string
    data: string
    descricao: string
    valor: number
    category: string
  }>
}

interface Obra {
  id: string
  nome: string
}

export default function ProfissionaisPage() {
  const router = useRouter()
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(true)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [profissionalToDelete, setProfissionalToDelete] = useState<Profissional | null>(null)
  const [showContratoModal, setShowContratoModal] = useState(false)
  const [contratoUrl, setContratoUrl] = useState<string | null>(null)
  const [ultimosPagamentos, setUltimosPagamentos] = useState<Record<string, { valor: number; data: string; criadoEm: string } | null>>({})
  const [totalPagoPorProfissional, setTotalPagoPorProfissional] = useState<Record<string, number>>({})
  const [obsAberta, setObsAberta] = useState<Profissional | null>(null)

  const carregarProfissionais = async () => {
    try {
      // Verificar autenticação no Supabase
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/login")
        return []
      }

      // CRÍTICO: Usar activeObraId para manter contexto
      const activeObraId = getActiveObraId()
      if (!activeObraId) {
        console.log("Nenhuma obra ativa, redirecionando para /obras")
        router.push("/obras")
        return []
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
        return []
      }

      const dbObra = obraData as any
      setObra({
        id: dbObra.id,
        nome: dbObra.nome,
      })

      // Carregar profissionais do Supabase
      console.log("[PROFISSIONAIS] Buscando profissionais no Supabase. obra_id:", activeObraId, "user_id:", user.id)

      const { getProfissionaisSupabase, isValidUUID } = await import("@/lib/storage")
      const profissionaisSupabase = await getProfissionaisSupabase(activeObraId, user.id)

      console.log(`[PROFISSIONAIS] ${profissionaisSupabase.length} profissionais carregados do Supabase`)
      console.log("[PROFISSIONAIS] Profissionais retornados:", profissionaisSupabase.map(p => ({
        id: p.id,
        nome: p.nome,
        funcao: p.funcao,
        tem_contrato: !!p.contrato,
        valor_previsto: p.valorPrevisto
      })))

      // CRÍTICO: Filtrar profissionais com IDs temporários (criados em versão antiga)
      const profissionaisValidos = profissionaisSupabase.filter((prof: any) => {
        const isValid = isValidUUID(prof.id)
        if (!isValid) {
          console.warn(`[PROFISSIONAIS] Profissional com ID inválido ignorado: ${prof.id} (${prof.nome})`)
        }
        return isValid
      })

      if (profissionaisValidos.length < profissionaisSupabase.length) {
        const ignorados = profissionaisSupabase.length - profissionaisValidos.length
        console.log(`[PROFISSIONAIS] ${ignorados} profissionais com IDs antigos foram ignorados`)
      }

      console.log(`[PROFISSIONAIS] ${profissionaisValidos.length} profissionais válidos disponíveis`)

      return profissionaisValidos
    } catch (error) {
      console.error("Erro ao carregar profissionais:", error)
      router.push("/obras")
      return []
    }
  }

  useEffect(() => {
    const carregarDados = async () => {
      const profissionaisCarregados = await carregarProfissionais()
      setProfissionais(profissionaisCarregados)

      // Buscar último pagamento por profissional
      try {
        const { supabase } = await import("@/lib/supabase")
        const { data: { user } } = await supabase.auth.getUser()
        const activeObraId = localStorage.getItem("activeObraId")

        if (user && activeObraId) {
          const { data: pagamentosData, error: pagErr } = await supabase
            .from("pagamentos")
            .select("*")
            .eq("obra_id", activeObraId)
            .eq("user_id", user.id)
            .order("data", { ascending: false })

          if (pagErr) console.error("Erro ao buscar pagamentos:", pagErr)

          if (pagamentosData && pagamentosData.length > 0) {
            const ultimoMap: Record<string, { valor: number; data: string; criadoEm: string }> = {}
            const totalMap: Record<string, number> = {}

            pagamentosData.forEach((p: any) => {
              if (!p.profissional_id) return
              // Último pagamento (já vem ordenado desc por data)
              if (!ultimoMap[p.profissional_id]) {
                ultimoMap[p.profissional_id] = {
                  valor: parseFloat(p.valor) || 0,
                  data: p.data || p.data_pagamento || "",
                  criadoEm: p.criado_em || p.created_at || "",
                }
              }
              // Total pago acumulado
              totalMap[p.profissional_id] = (totalMap[p.profissional_id] || 0) + (parseFloat(p.valor) || 0)
            })

            setUltimosPagamentos(ultimoMap)
            setTotalPagoPorProfissional(totalMap)
          }
        }
      } catch (err) {
        console.error("Erro ao buscar últimos pagamentos:", err)
      }

      setLoading(false)
    }

    carregarDados()
  }, [router])

  // Recarregar profissionais quando a página receber foco (volta de outra página)
  useEffect(() => {
    const handleFocus = async () => {
      const profissionaisAtualizados = await carregarProfissionais()
      setProfissionais(profissionaisAtualizados)
    }

    // Listener para mudanças no localStorage (quando pagamento é salvo em outra aba/página)
    const handleStorageChange = async (e: Event) => {
      const storageEvent = e as StorageEvent
      if (storageEvent.key === "despesas") {
        const profissionaisAtualizados = await carregarProfissionais()
        setProfissionais(profissionaisAtualizados)
      }
    }

    // Listener para eventos customizados de pagamento
    const handlePagamentoSalvo = async () => {
      const profissionaisAtualizados = await carregarProfissionais()
      setProfissionais(profissionaisAtualizados)
    }

    const handlePagamentoAtualizado = async () => {
      const profissionaisAtualizados = await carregarProfissionais()
      setProfissionais(profissionaisAtualizados)
    }

    window.addEventListener("focus", handleFocus)
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("pagamentoSalvo", handlePagamentoSalvo)
    window.addEventListener("pagamentoAtualizado", handlePagamentoAtualizado)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("pagamentoSalvo", handlePagamentoSalvo)
      window.removeEventListener("pagamentoAtualizado", handlePagamentoAtualizado)
    }
  }, [])

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const calcularValorPago = (profissional: Profissional): number => {
    // Usar total do Supabase (pagamentos table) como fonte primária
    if (totalPagoPorProfissional[profissional.id] !== undefined) {
      return totalPagoPorProfissional[profissional.id]
    }
    // Fallback: localStorage (enquanto Supabase ainda carrega)
    const pagamentos = getPagamentosByProfissional(profissional.obraId, profissional.id)
    return pagamentos.reduce((acc, p) => acc + p.valor, 0)
  }

  const calcularValorPrevisto = (profissional: Profissional): number => {
    // Priorizar valorPrevisto direto do profissional, depois do contrato
    return profissional.valorPrevisto || profissional.contrato?.valorPrevisto || profissional.contrato?.valorTotalPrevisto || 0
  }

  const calcularSaldoPagar = (profissional: Profissional): number => {
    const valorPrevisto = calcularValorPrevisto(profissional)
    const valorPago = calcularValorPago(profissional)
    return valorPrevisto - valorPago
  }

  const getCorSaldo = (saldo: number): string => {
    // REGRA CORRIGIDA: Cinza/neutro se >= 0, vermelho se < 0
    return saldo < 0 ? "text-red-400" : "text-[#cccccc]"
  }

  const handleOpenDeleteModal = (e: React.MouseEvent, profissional: Profissional) => {
    e.preventDefault()
    e.stopPropagation()
    setProfissionalToDelete(profissional)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setProfissionalToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!profissionalToDelete) return

    setExcluindo(profissionalToDelete.id)

    try {
      // Remover do localStorage
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const novosProfissionais = todosProfissionais.filter((p: Profissional) => p.id !== profissionalToDelete.id)
      localStorage.setItem("profissionais", JSON.stringify(novosProfissionais))

      // Atualizar estado local
      setProfissionais(profissionais.filter(p => p.id !== profissionalToDelete.id))

      handleCloseDeleteModal()
      toast.success("Profissional excluído com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir profissional:", error)
      toast.error("Erro ao excluir profissional. Tente novamente.")
    } finally {
      setExcluindo(null)
    }
  }

  const handleVisualizarContrato = (e: React.MouseEvent, profissional: Profissional) => {
    e.preventDefault()
    e.stopPropagation()

    // Validar se existe contrato e anexo
    if (!profissional.contrato || !(profissional.contrato as any).anexo) {
      toast.error("Nenhum contrato anexado")
      return
    }

    const anexo = (profissional.contrato as any).anexo as string
    setContratoUrl(anexo)
    setShowContratoModal(true)
  }

  const handleCloseContratoModal = () => {
    setShowContratoModal(false)
    setContratoUrl(null)
  }

  const isImageFile = (url: string): boolean => {
    if (url.startsWith('data:image/')) return true
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const lowerUrl = url.toLowerCase()
    return imageExtensions.some(ext => lowerUrl.includes(ext))
  }

  const isPdfFile = (url: string): boolean => {
    if (url.startsWith('data:application/pdf')) return true
    return url.toLowerCase().includes('.pdf')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3064] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-4 pb-24 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-3">

        {profissionais.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm mb-1">Nenhum profissional cadastrado</p>
              <p className="text-xs text-gray-500 max-w-xs">Cadastre profissionais para controlar pagamentos e serviços</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/profissionais/novo")}
              className="flex items-center gap-2 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              Cadastrar primeiro profissional
            </button>
          </div>
        ) : (
          profissionais.map((profissional) => {
            const valorPago = calcularValorPago(profissional)
            const valorPrevisto = calcularValorPrevisto(profissional)
            const saldoPagar = calcularSaldoPagar(profissional)
            const ult = ultimosPagamentos[profissional.id]
            const ts = ult?.criadoEm ? new Date(ult.criadoEm) : ult?.data ? new Date(ult.data + "T12:00:00") : null
            const dataFmt = ts ? ts.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""

            return (
              <div key={profissional.id} className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">
                {/* Nome + funcao + contrato */}
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-3.5 h-3.5 text-[#7eaaee]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{profissional.nome}</p>
                      <p className="text-[10px] text-gray-500">{profissional.funcao}{profissional.telefone ? ` · ${profissional.telefone}` : ""}</p>
                      {profissional.observacoes && profissional.observacoes.trim() !== "" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setObsAberta(profissional)
                          }}
                          className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-[10px] font-medium rounded-md transition-colors"
                          aria-label="Ver observação"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Ver observação
                        </button>
                      )}
                    </div>
                  </div>
                  {(profissional.contrato as any)?.anexo && (
                    <button
                      onClick={(e) => handleVisualizarContrato(e, profissional)}
                      className="flex items-center gap-1 text-[10px] text-[#7eaaee] bg-[#0B3064]/15 border border-[#0B3064]/30 px-2 py-1 rounded-lg transition-colors flex-shrink-0"
                    >
                      <FileText className="w-3 h-3" />
                      Contrato
                    </button>
                  )}
                </div>

                {/* Valores */}
                <div className="border-t border-white/[0.06]">
                  {[
                    { label: "Previsto", value: valorPrevisto > 0 ? formatarMoeda(valorPrevisto) : "—", color: "text-gray-300" },
                    { label: "Pago", value: formatarMoeda(valorPago), color: "text-emerald-400" },
                    { label: "Saldo", value: valorPrevisto > 0 ? formatarMoeda(saldoPagar) : "—", color: valorPrevisto > 0 ? getCorSaldo(saldoPagar) : "text-gray-600" },
                  ].map(({ label, value, color }, i, arr) => (
                    <div key={label} className={`flex items-center justify-between px-3 py-2 ${i < arr.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{label}</span>
                      <span className={`text-sm font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Último pagamento */}
                <div className="px-3 py-2 border-t border-white/[0.06]">
                  {ult ? (
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#7eaaee] flex-shrink-0" />
                      Último pagamento: <span className="text-emerald-400 font-medium">{formatarMoeda(ult.valor)}</span>
                      {dataFmt && <span className="text-gray-600">· {dataFmt}</span>}
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      Nenhum pagamento registrado
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-1.5 px-3 pb-3 pt-1">
                  <button
                    onClick={() => router.push(`/dashboard/profissionais/${profissional.id}/pagamentos`)}
                    className="flex-1 h-8 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    Pagamentos
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/profissionais/${profissional.id}?edit=true`)}
                    className="flex-1 h-8 bg-white/[0.07] hover:bg-white/[0.11] text-gray-300 text-xs font-medium rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => handleOpenDeleteModal(e, profissional)}
                    disabled={excluindo === profissional.id}
                    className="flex-1 h-8 bg-white/[0.07] hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#13151a]/95 backdrop-blur border-t border-white/[0.06] px-3 py-2">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push("/dashboard/profissionais/novo")}
            className="w-full flex items-center justify-center gap-1.5 h-10 bg-[#2a2d35] hover:bg-white/[0.13] active:scale-95 text-gray-300 text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Profissional
          </button>
        </div>
      </div>

      {/* Modal exclusão — bottom sheet */}
      {showDeleteModal && profissionalToDelete && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={handleCloseDeleteModal}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full bg-[#1f2228] border-t border-white/[0.08] rounded-t-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-bold text-white">Excluir profissional?</h2>
              <button onClick={handleCloseDeleteModal} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="bg-white/[0.04] rounded-xl px-3 py-2.5 mb-4">
                <p className="text-sm font-semibold text-white">{profissionalToDelete.nome}</p>
                <p className="text-xs text-gray-500">{profissionalToDelete.funcao}</p>
              </div>
              <p className="text-xs text-gray-500 mb-4">Esta ação é permanente e não pode ser desfeita.</p>
              <div className="flex gap-2">
                <button onClick={handleCloseDeleteModal} disabled={excluindo !== null} className="flex-1 h-11 bg-white/[0.07] text-gray-300 text-sm font-medium rounded-xl transition-colors">
                  Cancelar
                </button>
                <button onClick={handleConfirmDelete} disabled={excluindo !== null} className="flex-1 h-11 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {excluindo ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Excluindo...</> : <><Trash2 className="w-4 h-4" />Excluir</>}
                </button>
              </div>
            </div>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* Modal contrato */}
      {showContratoModal && contratoUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
            <button onClick={handleCloseContratoModal} className="absolute top-3 right-3 z-10 w-9 h-9 bg-[#1f2228] hover:bg-[#2a2d35] text-white rounded-full flex items-center justify-center shadow-lg transition-all border border-white/[0.08]">
              <X className="w-4 h-4" />
            </button>
            <div className="w-full h-full bg-[#1f2228] rounded-2xl overflow-hidden border border-white/[0.08]">
              {isImageFile(contratoUrl) ? (
                <div className="w-full h-full flex items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={contratoUrl} alt="Contrato" className="max-w-full max-h-full object-contain" />
                </div>
              ) : isPdfFile(contratoUrl) ? (
                <iframe src={contratoUrl} className="w-full h-full" title="Contrato" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-500 mb-3" />
                  <p className="text-white font-medium mb-4">Arquivo de contrato</p>
                  <button onClick={() => window.open(contratoUrl, '_blank')} className="px-4 py-2 bg-[#0B3064] hover:bg-[#082551] text-white text-sm rounded-xl transition-colors">
                    Abrir em nova aba
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal observação do profissional */}
      {obsAberta && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setObsAberta(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#1f2228] border border-white/[0.08] rounded-xl shadow-2xl"
          >
            <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-white/[0.08]">
              <div className="min-w-0">
                <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Observação</p>
                <p className="text-sm font-bold text-white truncate">{obsAberta.nome}</p>
              </div>
              <button
                onClick={() => setObsAberta(null)}
                className="text-gray-400 hover:text-white flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {obsAberta.observacoes}
              </p>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={() => router.push(`/dashboard/profissionais/${obsAberta.id}?edit=true`)}
                className="flex-1 h-9 bg-[#0B3064] hover:bg-[#082551] text-white text-xs font-medium rounded-lg transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => setObsAberta(null)}
                className="flex-1 h-9 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 text-xs font-medium rounded-lg border border-white/[0.08] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
