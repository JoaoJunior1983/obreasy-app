"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthUser } from "@/lib/queries/auth"
import {
  ArrowLeft, Save, Pencil, Trash2, DollarSign,
  MessageSquare, User, Eye, X as XIcon, FileText
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/custom/FileUpload"
import {
  getClientesSupabase,
  updateClienteSupabase,
  getRecebimentosByClienteSupabase,
  saveRecebimentoSupabase,
  updateRecebimentoSupabase,
  deleteRecebimentoSupabase,
  uploadFileToStorage,
  type Cliente
} from "@/lib/storage"
import { getDataHoje } from "@/lib/utils"
import { toast } from "sonner"

const FORMAS_PAGAMENTO = ["Pix", "Dinheiro", "Cartão", "Boleto", "Transferência"]

const fmt = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const formatarMoeda = (valor: string): string => {
  const nums = valor.replace(/\D/g, "")
  if (!nums) return ""
  return (parseFloat(nums) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const removerFormatacao = (v: string): number => {
  const nums = v.replace(/\D/g, "")
  return parseFloat(nums) / 100
}

const formatarData = (data: string) => {
  if (!data) return ""
  const [y, m, d] = data.split("T")[0].split("-")
  return `${d}/${m}/${y}`
}

export default function ClienteDetailPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const searchParams = useSearchParams()
  const clienteId = params.id as string

  const [loading, setLoading] = useState(true)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [recebimentos, setRecebimentos] = useState<any[]>([])
  const [obraId, setObraId] = useState("")
  const [userId, setUserId] = useState("")

  // Edição do cliente
  const [editMode, setEditMode] = useState(searchParams.get("edit") === "1")
  const [salvandoCliente, setSalvandoCliente] = useState(false)
  const [editNome, setEditNome] = useState("")
  const [editContratoValorFmt, setEditContratoValorFmt] = useState("")
  const [editContratoValor, setEditContratoValor] = useState("")
  const [editObservacoes, setEditObservacoes] = useState("")
  const [editContratoFile, setEditContratoFile] = useState<File | null>(null)
  const [editContratoAnexo, setEditContratoAnexo] = useState<string | null>(null)

  // Novo recebimento
  const [showNovoRecebimento, setShowNovoRecebimento] = useState(false)
  const [salvandoRecebimento, setSalvandoRecebimento] = useState(false)
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null)
  const [comprovanteAnexo, setComprovanteAnexo] = useState<string | null>(null)
  const [valorRecFmt, setValorRecFmt] = useState("")
  const [recForm, setRecForm] = useState({
    valor: "", data: getDataHoje(), formaPagamento: "Pix", observacao: ""
  })

  // Edição de recebimento
  const [editandoRec, setEditandoRec] = useState<any | null>(null)
  const [editRecFmt, setEditRecFmt] = useState("")
  const [salvandoEditRec, setSalvandoEditRec] = useState(false)

  // Exclusão
  const [deletandoRecId, setDeletandoRecId] = useState<string | null>(null)
  const [confirmarDeleteRecId, setConfirmarDeleteRecId] = useState<string | null>(null)

  // Visualização de comprovante
  const [comprovanteModal, setComprovanteModal] = useState<string | null>(null)

  const isImageUrl = (url: string) => {
    if (url.startsWith("data:image/")) return true
    return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some(ext => url.toLowerCase().includes(ext))
  }
  const isPdfUrl = (url: string) => {
    if (url.startsWith("data:application/pdf")) return true
    return url.toLowerCase().includes(".pdf")
  }

  const { data: user, isError: authError } = useAuthUser()

  useEffect(() => {
    if (authError) router.push("/login")
  }, [authError, router])

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) { router.push("/login"); return }
    const activeObraId = localStorage.getItem("activeObraId")
    if (!activeObraId) { router.push("/obras"); return }
    setObraId(activeObraId)
  }, [router])

  useEffect(() => {
    if (user?.id) setUserId(user.id)
  }, [user?.id])

  // Clientes e recebimentos disparam em paralelo após auth+obra
  const { data: clientesQuery } = useQuery({
    queryKey: ["clientes", obraId, user?.id],
    enabled: !!obraId && !!user?.id,
    staleTime: 60_000,
    queryFn: () => getClientesSupabase(obraId, user!.id),
  })

  const { data: recebimentosQuery } = useQuery({
    queryKey: ["recebimentos-cliente", clienteId, user?.id],
    enabled: !!clienteId && !!user?.id,
    staleTime: 30_000,
    queryFn: () => getRecebimentosByClienteSupabase(clienteId, user!.id),
  })

  // Sync: cliente derivado dos clientes carregados
  useEffect(() => {
    if (!clientesQuery) return
    const c = clientesQuery.find((x) => x.id === clienteId)
    if (!c) {
      toast.error("Cliente não encontrado")
      router.push("/dashboard/clientes")
      return
    }
    setCliente(c)
    setEditNome(c.nome)
    setEditContratoValor(c.contratoValor ? c.contratoValor.toString() : "")
    setEditContratoValorFmt(
      c.contratoValor
        ? c.contratoValor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "",
    )
    setEditObservacoes(c.observacoes || "")
    setEditContratoAnexo(c.contratoUrl || null)
  }, [clientesQuery, clienteId, router])

  useEffect(() => {
    if (recebimentosQuery) setRecebimentos(recebimentosQuery)
  }, [recebimentosQuery])

  useEffect(() => {
    if (clientesQuery && recebimentosQuery !== undefined) setLoading(false)
  }, [clientesQuery, recebimentosQuery])

  // Refresh: invalida cache do React Query
  const carregarDados = useCallback(async () => {
    await queryClient.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey[0] as string
        return k === "clientes" || k === "recebimentos-cliente"
      },
    })
  }, [queryClient])

  // ── Salvar edição do cliente ──
  const handleSalvarCliente = async () => {
    if (!editNome.trim()) { toast.error("Nome obrigatório"); return }
    setSalvandoCliente(true)
    try {
      let contratoUrl: string | null | undefined = undefined
      if (editContratoFile) {
        const ts = Date.now()
        const ext = editContratoFile.name.split(".").pop()
        contratoUrl = await uploadFileToStorage(editContratoFile, "comprovantes", `${userId}/${obraId}/contratos/${ts}.${ext}`)
      } else if (editContratoAnexo === null) {
        // usuário removeu o contrato existente
        contratoUrl = null
      }

      const ok = await updateClienteSupabase(clienteId, {
        nome: editNome.trim(),
        contratoValor: editContratoValor ? parseFloat(editContratoValor) : null,
        contratoUrl,
        observacoes: editObservacoes.trim() || null
      })
      if (ok) {
        toast.success("Cliente atualizado")
        setEditMode(false)
        setEditContratoFile(null)
        carregarDados()
      } else {
        toast.error("Erro ao atualizar cliente")
      }
    } catch {
      toast.error("Erro ao atualizar cliente")
    }
    setSalvandoCliente(false)
  }

  // ── Salvar novo recebimento ──
  const handleSalvarRecebimento = async () => {
    if (!recForm.valor || parseFloat(recForm.valor) <= 0) { toast.error("Informe o valor"); return }
    if (!recForm.data) { toast.error("Informe a data"); return }

    setSalvandoRecebimento(true)
    try {
      let comprovanteUrl: string | null = null
      if (comprovanteFile) {
        const ts = Date.now()
        const ext = comprovanteFile.name.split(".").pop()
        const fileName = `${obraId}/${ts}.${ext}`
        comprovanteUrl = await uploadFileToStorage(comprovanteFile, "comprovantes", fileName)
      }

      const id = await saveRecebimentoSupabase(
        {
          obraId,
          clienteId,
          valor: parseFloat(recForm.valor),
          data: recForm.data,
          formaPagamento: recForm.formaPagamento,
          observacao: recForm.observacao || null,
          comprovanteUrl
        },
        userId
      )

      if (!id) { toast.error("Erro ao salvar recebimento"); return }

      toast.success("Recebimento registrado!")
      setShowNovoRecebimento(false)
      setRecForm({ valor: "", data: getDataHoje(), formaPagamento: "Pix", observacao: "" })
      setValorRecFmt("")
      setComprovanteFile(null)
      setComprovanteAnexo(null)
      carregarDados()
    } catch {
      toast.error("Erro ao salvar recebimento")
    } finally {
      setSalvandoRecebimento(false)
    }
  }

  // ── Salvar edição de recebimento ──
  const handleSalvarEditRec = async () => {
    if (!editandoRec) return
    setSalvandoEditRec(true)
    const ok = await updateRecebimentoSupabase(editandoRec.id, {
      valor: editandoRec.valor,
      data: editandoRec.data,
      formaPagamento: editandoRec.formaPagamento,
      observacao: editandoRec.observacao
    })
    if (ok) {
      toast.success("Recebimento atualizado")
      setEditandoRec(null)
      carregarDados()
    } else {
      toast.error("Erro ao atualizar recebimento")
    }
    setSalvandoEditRec(false)
  }

  // ── Excluir recebimento ──
  const handleDeleteRec = async (id: string) => {
    setDeletandoRecId(id)
    const ok = await deleteRecebimentoSupabase(id)
    if (ok) {
      toast.success("Recebimento removido")
      carregarDados()
    } else {
      toast.error("Erro ao remover")
    }
    setDeletandoRecId(null)
    setConfirmarDeleteRecId(null)
  }

  const totalRecebido = recebimentos.reduce((s, r) => s + r.valor, 0)
  const saldo = (cliente?.contratoValor || 0) - totalRecebido

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
      </div>
    )
  }

  if (!cliente) return null

  return (
    <>
    <div className="min-h-screen bg-[#0a0a0a] p-3">
      {/* Modal confirmação exclusão recebimento */}
      {confirmarDeleteRecId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f2228] rounded-2xl shadow-2xl max-w-xs w-full p-5 border border-white/[0.1]">
            <p className="text-sm font-bold text-white mb-1">Remover recebimento?</p>
            <p className="text-xs text-gray-400 mb-4">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarDeleteRecId(null)}
                className="flex-1 h-9 !bg-[#2a2d35] hover:!bg-slate-600 !text-gray-300 border border-white/[0.1] rounded-xl text-sm transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDeleteRec(confirmarDeleteRecId)}
                disabled={deletandoRecId === confirmarDeleteRecId}
                className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm disabled:opacity-60 transition-colors">
                {deletandoRecId === confirmarDeleteRecId ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/dashboard/clientes")}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1f2228] hover:bg-[#2a2d35] transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <h1 className="text-base font-bold text-white truncate flex-1">{cliente.nome}</h1>
          {cliente.contratoUrl && (
            <button
              onClick={() => window.open(cliente.contratoUrl!, "_blank")}
              title="Ver contrato"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#0B3064]/20 hover:bg-[#0e3d7a]/30 border border-[#0B3064]/40 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#7eaaee]" />
            </button>
          )}
          <button onClick={() => setEditMode(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1f2228] hover:bg-[#2a2d35] transition-colors">
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Contratado", valor: cliente.contratoValor || 0, color: "text-gray-300" },
            { label: "Recebido", valor: totalRecebido, color: "text-green-400" },
            { label: "Saldo", valor: saldo, color: saldo >= 0 ? "text-[#7eaaee]" : "text-red-400" }
          ].map(item => (
            <Card key={item.label} className="p-2 bg-[#1f2228]/80 border border-white/[0.08] rounded-xl text-center">
              <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-0.5">{item.label}</p>
              <p className={`text-sm font-extrabold leading-snug ${item.color}`}>{fmt(item.valor)}</p>
            </Card>
          ))}
        </div>

        {/* Edição do cliente */}
        {editMode && (
          <Card className="p-3 bg-[#1f2228]/80 border border-[#0B3064]/40 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-[#7eaaee] uppercase tracking-wide">Editar cliente</p>

            <div className="space-y-0.5">
              <Label className="text-xs text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3 text-[#7eaaee]" /> Nome *
              </Label>
              <Input value={editNome} onChange={e => setEditNome(e.target.value)}
                className="h-8 text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] transition-colors" />
            </div>

            <div className="space-y-0.5">
              <Label className="text-xs text-gray-400 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-[#7eaaee]" /> Valor do contrato
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs">R$</span>
                <Input type="text" placeholder="0,00" value={editContratoValorFmt}
                  onChange={e => {
                    const f = formatarMoeda(e.target.value)
                    setEditContratoValorFmt(f)
                    const n = removerFormatacao(f)
                    setEditContratoValor(n > 0 ? n.toString() : "")
                  }}
                  className="h-8 text-sm pl-8 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] transition-colors" />
              </div>
            </div>

            <div className="space-y-0.5">
              <Label className="text-xs text-gray-400 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-[#7eaaee]" /> Observações
              </Label>
              <Textarea value={editObservacoes} onChange={e => setEditObservacoes(e.target.value)}
                rows={2} className="text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] transition-colors resize-none" />
            </div>

            <FileUpload
              label="Contrato (opcional)"
              accept="image/*,application/pdf,.doc,.docx"
              maxSize={10}
              value={editContratoAnexo}
              onChange={(file, preview) => { setEditContratoFile(file); setEditContratoAnexo(preview) }}
            />

            <div className="flex gap-2">
              <button onClick={() => setEditMode(false)}
                className="flex-1 h-8 !bg-[#2a2d35] hover:!bg-slate-600 !text-gray-300 border border-white/[0.1] rounded-lg text-xs transition-colors">
                Cancelar
              </button>
              <button onClick={handleSalvarCliente} disabled={salvandoCliente}
                className="flex-1 h-8 bg-[#0B3064] hover:bg-[#082551] text-white rounded-lg text-xs font-medium flex items-center justify-center disabled:opacity-60 transition-colors">
                <Save className="w-3 h-3 mr-1" />
                {salvandoCliente ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </Card>
        )}

        {/* Recebimentos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recebimentos</p>
          </div>

          {/* Form novo recebimento */}
          {showNovoRecebimento && (
            <Card className="p-3 bg-[#1f2228]/80 border border-green-500/30 rounded-xl space-y-2 mb-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">Novo recebimento para</p>
                <span className="text-xs font-bold text-white bg-green-500/20 border border-green-500/30 px-2 py-0.5 rounded-full">{cliente.nome}</span>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-0.5">
                  <span className="text-[10px] text-gray-400">Data</span>
                  <input type="date" value={recForm.data}
                    onChange={e => setRecForm(p => ({ ...p, data: e.target.value }))}
                    className="w-full h-8 text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg px-2 focus:outline-none focus:border-[#3B82F6] transition-colors [&::-webkit-calendar-picker-indicator]:opacity-60" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <span className="text-[10px] text-gray-400">Valor</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs">R$</span>
                    <Input type="text" placeholder="0,00" value={valorRecFmt}
                      onChange={e => {
                        const f = formatarMoeda(e.target.value)
                        setValorRecFmt(f)
                        setRecForm(p => ({ ...p, valor: removerFormatacao(f) > 0 ? removerFormatacao(f).toString() : "" }))
                      }}
                      className="h-8 pl-7 text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] transition-colors" />
                  </div>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-400">Forma de pagamento</span>
                <Select value={recForm.formaPagamento} onValueChange={v => setRecForm(p => ({ ...p, formaPagamento: v }))}>
                  <SelectTrigger className="h-8 text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-[10px]">
                    {FORMAS_PAGAMENTO.map(f => (
                      <SelectItem key={f} value={f} className="text-[#E5E7EB] hover:bg-[#1D4ED8] focus:bg-[#2563EB] focus:text-white cursor-pointer">{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FileUpload
                label="Comprovante (opcional)"
                accept="image/jpeg,image/png,application/pdf"
                maxSize={10}
                value={comprovanteAnexo}
                onChange={(file, preview) => { setComprovanteFile(file); setComprovanteAnexo(preview) }}
              />

              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-400">Observação (opcional)</span>
                <Textarea value={recForm.observacao}
                  onChange={e => setRecForm(p => ({ ...p, observacao: e.target.value }))}
                  rows={2} placeholder="Observações sobre este recebimento..."
                  className="text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] transition-colors resize-none" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowNovoRecebimento(false)}
                  className="flex-1 h-8 !bg-[#2a2d35] hover:!bg-slate-600 !text-red-400 border border-white/[0.1] rounded-lg text-xs transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSalvarRecebimento} disabled={salvandoRecebimento}
                  className="flex-1 h-8 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-medium disabled:opacity-60 transition-colors">
                  {salvandoRecebimento ? "Salvando..." : "Salvar recebimento"}
                </button>
              </div>
            </Card>
          )}

          {/* Lista */}
          {recebimentos.length === 0 && !showNovoRecebimento && (
            <Card className="p-4 bg-[#1f2228]/50 border border-white/[0.06] rounded-xl text-center">
              <p className="text-xs text-gray-500">Nenhum recebimento registrado ainda.</p>
            </Card>
          )}

          <div className="space-y-1.5">
            {recebimentos.map(rec => (
              <Card key={rec.id} className="p-2.5 bg-[#1f2228]/60 border border-slate-700/25 rounded-xl">
                {editandoRec?.id === rec.id ? (
                  // Form de edição inline
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-0.5">
                        <span className="text-[10px] text-gray-400">Data</span>
                        <input type="date" value={editandoRec.data}
                          onChange={e => setEditandoRec((p: any) => ({ ...p, data: e.target.value }))}
                          className="w-full h-7 text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg px-2 focus:outline-none focus:border-[#3B82F6] [&::-webkit-calendar-picker-indicator]:opacity-60" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <span className="text-[10px] text-gray-400">Valor</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs">R$</span>
                          <Input type="text" value={editRecFmt}
                            onChange={e => {
                              const f = formatarMoeda(e.target.value)
                              setEditRecFmt(f)
                              setEditandoRec((p: any) => ({ ...p, valor: removerFormatacao(f) }))
                            }}
                            className="h-7 pl-7 text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6]" />
                        </div>
                      </div>
                    </div>
                    <Select value={editandoRec.formaPagamento}
                      onValueChange={v => setEditandoRec((p: any) => ({ ...p, formaPagamento: v }))}>
                      <SelectTrigger className="h-7 text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-[10px]">
                        {FORMAS_PAGAMENTO.map(f => (
                          <SelectItem key={f} value={f} className="text-[#E5E7EB] hover:bg-[#1D4ED8] focus:bg-[#2563EB] focus:text-white cursor-pointer">{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <button onClick={() => setEditandoRec(null)}
                        className="flex-1 h-7 !bg-[#2a2d35] hover:!bg-slate-600 !text-gray-300 border border-white/[0.1] rounded-lg text-xs transition-colors">
                        Cancelar
                      </button>
                      <button onClick={handleSalvarEditRec} disabled={salvandoEditRec}
                        className="flex-1 h-7 bg-[#0B3064] hover:bg-[#082551] text-white rounded-lg text-xs disabled:opacity-60 transition-colors">
                        {salvandoEditRec ? "Salvando..." : "Salvar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Exibição normal
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-green-400">{fmt(rec.valor)}</p>
                        <span className="text-[10px] text-gray-500">{rec.formaPagamento}</span>
                      </div>
                      <p className="text-xs text-gray-500">{formatarData(rec.data)}{rec.observacao ? ` · ${rec.observacao}` : ""}</p>
                    </div>
                    {rec.comprovanteUrl && (
                      <button
                        onClick={() => setComprovanteModal(rec.comprovanteUrl)}
                        title="Ver comprovante"
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-[#0B3064]/20 hover:bg-[#0e3d7a]/30 border border-[#0B3064]/40 transition-colors"
                      >
                        <Eye className="w-3 h-3 text-[#7eaaee]" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditandoRec(rec)
                        setEditRecFmt(rec.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-white/[0.08] hover:bg-[#2a2d35] transition-colors">
                      <Pencil className="w-3 h-3 text-gray-400" />
                    </button>
                    <button onClick={() => setConfirmarDeleteRecId(rec.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-white/[0.08] hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Modal de visualização de comprovante */}
    {comprovanteModal && (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="relative w-full h-full max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-200">
          <button
            onClick={() => setComprovanteModal(null)}
            className="absolute top-3 right-3 z-10 w-9 h-9 bg-[#1f2228] hover:bg-[#2a2d35] text-white rounded-full flex items-center justify-center shadow-lg transition-all"
          >
            <XIcon className="w-4 h-4" />
          </button>
          <div className="w-full h-full bg-slate-800/95 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {isImageUrl(comprovanteModal) ? (
              <div className="w-full h-full flex items-center justify-center p-6">
                <img
                  src={comprovanteModal}
                  alt="Comprovante"
                  className="max-w-full max-h-full object-contain"
                  onError={e => {
                    e.currentTarget.style.display = "none"
                    const p = e.currentTarget.parentElement
                    if (p) p.innerHTML = '<p class="text-red-400 text-sm">Erro ao carregar imagem</p>'
                  }}
                />
              </div>
            ) : isPdfUrl(comprovanteModal) ? (
              <iframe src={comprovanteModal} className="w-full h-full" title="Comprovante" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                <Eye className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-white font-medium mb-4">Arquivo de comprovante</p>
                <button
                  onClick={() => window.open(comprovanteModal, "_blank")}
                  className="px-4 py-2 bg-[#0B3064] hover:bg-[#082551] text-white text-sm rounded-lg transition-colors"
                >
                  Abrir em nova aba
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
