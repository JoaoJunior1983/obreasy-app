"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Plus, Pencil, Trash2, FileText, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Pagamento {
  id: string
  obraId: string
  data: string
  valor: number
  formaPagamento?: string
  observacao?: string
  observacoes?: string
  profissionalId?: string
  professionalId?: string
  anexo?: string | null
  descricao?: string
}

interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
  valorPrevisto?: number
  contrato?: {
    valorPrevisto?: number
    valorTotalPrevisto?: number
  }
}

export default function PagamentosProfissionalPage() {
  const router = useRouter()
  const params = useParams()
  const profissionalId = params.id as string

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [loading, setLoading] = useState(true)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pagamentoToDelete, setPagamentoToDelete] = useState<Pagamento | null>(null)
  const [sortBy, setSortBy] = useState<"data" | "valor">("data")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const carregarDados = async () => {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/")
        return
      }

      const activeObraId = localStorage.getItem("activeObraId")
      if (!activeObraId) {
        router.push("/obras")
        return
      }

      // Carregar profissional do Supabase
      const { getProfissionaisSupabase } = await import("@/lib/storage")
      const profissionaisSupabase = await getProfissionaisSupabase(activeObraId, user.id)
      const prof = profissionaisSupabase.find((p: any) => p.id === profissionalId)

      if (!prof) {
        router.push("/dashboard/profissionais")
        return
      }

      setProfissional(prof)

      // Carregar pagamentos do Supabase (tabela pagamentos, filtrado por profissional_id)
      const { data: pagamentosData, error: pagErr } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("obra_id", activeObraId)
        .eq("user_id", user.id)
        .eq("profissional_id", profissionalId)
        .order("data", { ascending: false })

      if (pagErr) {
        console.error("Erro ao buscar pagamentos:", pagErr)
        toast.error("Erro ao carregar pagamentos")
      }

      if (pagamentosData) {
        const mapped: Pagamento[] = pagamentosData.map((p: any) => ({
          id: p.id,
          obraId: p.obra_id,
          data: p.data || p.data_pagamento || "",
          valor: parseFloat(p.valor) || 0,
          formaPagamento: p.forma_pagamento || p.formaPagamento || "",
          observacao: p.observacao || p.observacoes || "",
          profissionalId: p.profissional_id,
          anexo: p.anexo || null,
          descricao: p.descricao || "",
        }))
        setPagamentos(mapped)
      }

      setLoading(false)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()

    const handleReload = () => carregarDados()
    window.addEventListener("pagamentoSalvo", handleReload)
    window.addEventListener("pagamentoAtualizado", handleReload)
    return () => {
      window.removeEventListener("pagamentoSalvo", handleReload)
      window.removeEventListener("pagamentoAtualizado", handleReload)
    }
  }, [profissionalId])

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const formatarData = (dataISO: string) => {
    if (!dataISO) return ""
    const data = new Date(dataISO + "T12:00:00")
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0)
  const valorPrevisto = profissional?.valorPrevisto || profissional?.contrato?.valorPrevisto || profissional?.contrato?.valorTotalPrevisto || 0
  const saldoPagar = valorPrevisto - totalPago

  const toggleSort = (campo: "data" | "valor") => {
    if (sortBy === campo) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortBy(campo); setSortOrder("desc") }
  }

  const pagamentosOrdenados = [...pagamentos].sort((a, b) => {
    if (sortBy === "data") {
      const diff = new Date(a.data).getTime() - new Date(b.data).getTime()
      return sortOrder === "asc" ? diff : -diff
    }
    return sortOrder === "asc" ? a.valor - b.valor : b.valor - a.valor
  })

  const handleOpenDeleteModal = (e: React.MouseEvent, pagamento: Pagamento) => {
    e.preventDefault()
    e.stopPropagation()
    setPagamentoToDelete(pagamento)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!pagamentoToDelete) return
    setExcluindo(pagamentoToDelete.id)

    try {
      const { supabase } = await import("@/lib/supabase")
      const { error } = await supabase
        .from("pagamentos")
        .delete()
        .eq("id", pagamentoToDelete.id)

      if (error) {
        toast.error("Erro ao excluir pagamento")
        return
      }

      setPagamentos(prev => prev.filter(p => p.id !== pagamentoToDelete.id))
      setShowDeleteModal(false)
      setPagamentoToDelete(null)
      toast.success("Pagamento excluído!")
      window.dispatchEvent(new CustomEvent("pagamentoAtualizado", { detail: { profissionalId } }))
    } catch (err) {
      console.error(err)
      toast.error("Erro ao excluir pagamento")
    } finally {
      setExcluindo(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!profissional) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Pagamentos</h1>
            <p className="text-xs text-gray-500">{profissional.nome} · {profissional.funcao}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/pagamentos/novo")}
            className="flex items-center gap-1.5 h-8 px-3 bg-[#0B3064] hover:bg-[#082551] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </button>
        </div>

        {/* Resumo — 3 cards em linha */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">Previsto</p>
            <p className="text-xs font-bold text-white">{valorPrevisto > 0 ? formatarMoeda(valorPrevisto) : "—"}</p>
          </div>
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">Pago</p>
            <p className="text-xs font-bold text-emerald-400">{formatarMoeda(totalPago)}</p>
          </div>
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">Saldo</p>
            <p className={`text-xs font-bold ${saldoPagar < 0 ? "text-red-400" : "text-[#cccccc]"}`}>{formatarMoeda(saldoPagar)}</p>
          </div>
        </div>

        {/* Extrato */}
        <div className="bg-[#1f2228]/60 border border-white/[0.08] rounded-xl overflow-hidden">
          {/* Cabeçalho do extrato */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
            <span className="text-xs font-medium text-gray-400">
              Histórico ({pagamentosOrdenados.length})
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => toggleSort("data")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${sortBy === "data" ? "bg-[#0B3064] text-white" : "text-gray-400 hover:text-white"}`}
              >
                Data {sortBy === "data" ? (sortOrder === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />) : <ArrowUpDown className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={() => toggleSort("valor")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${sortBy === "valor" ? "bg-[#0B3064] text-white" : "text-gray-400 hover:text-white"}`}
              >
                Valor {sortBy === "valor" ? (sortOrder === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />) : <ArrowUpDown className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>

          {/* Lista */}
          {pagamentosOrdenados.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-500">Nenhum pagamento registrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/20">
              {pagamentosOrdenados.map((pagamento) => (
                <div key={pagamento.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                  {/* Barra colorida */}
                  <div className="w-0.5 h-8 bg-emerald-500 rounded-full shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">
                      {pagamento.descricao || pagamento.formaPagamento || "Pagamento"}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {formatarData(pagamento.data)}
                      {pagamento.formaPagamento && ` · ${pagamento.formaPagamento}`}
                      {(pagamento.observacao || pagamento.observacoes) && ` · ${pagamento.observacao || pagamento.observacoes}`}
                    </p>
                  </div>

                  {/* Valor */}
                  <span className="text-sm font-bold text-emerald-400 shrink-0">
                    {formatarMoeda(pagamento.valor)}
                  </span>

                  {/* Ações */}
                  <div className="flex gap-0.5 shrink-0">
                    {pagamento.anexo && (
                      <button
                        onClick={() => window.open(pagamento.anexo!, "_blank")}
                        className="p-1.5 text-gray-500 hover:text-[#7eaaee] transition-colors rounded"
                        title="Ver comprovante"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/pagamentos/${pagamento.id}/editar`)}
                      className="p-1.5 text-gray-500 hover:text-[#7eaaee] transition-colors rounded"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleOpenDeleteModal(e, pagamento)}
                      disabled={excluindo === pagamento.id}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal exclusão */}
      {showDeleteModal && pagamentoToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#13151a] rounded-xl shadow-2xl max-w-sm w-full p-5 border border-slate-800">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center mx-auto mb-3 border border-red-500/20">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-base font-bold text-white text-center mb-1">Excluir pagamento?</h2>
            <p className="text-center text-gray-400 text-sm mb-4">
              {formatarMoeda(pagamentoToDelete.valor)} · {formatarData(pagamentoToDelete.data)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteModal(false); setPagamentoToDelete(null) }}
                className="flex-1 h-9 border border-white/[0.1] rounded-lg text-sm text-gray-300 hover:bg-[#1f2228] transition-all"
                disabled={excluindo !== null}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                disabled={excluindo !== null}
              >
                {excluindo ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
