"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Users, HandCoins, Pencil, Trash2, Clock, X, AlertTriangle, FileText, Eye, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/custom/FileUpload"
import {
  getClientesSupabase,
  deleteClienteSupabase,
  saveRecebimentoSupabase,
  uploadFileToStorage,
  type Cliente
} from "@/lib/storage"
import { getDataHoje } from "@/lib/utils"
import { toast } from "sonner"

type RecebimentoFlat = {
  id: string
  valor: number
  data: string
  formaPagamento: string
  observacao: string | null
  comprovanteUrl: string | null
  clienteId: string
  clienteNome: string
}

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

const FORMAS_PAGAMENTO = ["Pix", "Dinheiro", "Cartão", "Boleto", "Transferência"]

export default function ExtratoRecebimentosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [recebimentosPorCliente, setRecebimentosPorCliente] = useState<Record<string, number>>({})
  const [ultimoRecebimento, setUltimoRecebimento] = useState<Record<string, { valor: number; data: string } | null>>({})
  const [obraNome, setObraNome] = useState("")
  const [obraId, setObraId] = useState("")
  const [userId, setUserId] = useState("")
  const [confirmarDeleteId, setConfirmarDeleteId] = useState<string | null>(null)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)
  const [totalRecebidoGeral, setTotalRecebidoGeral] = useState(0)
  const [totalContratoGeral, setTotalContratoGeral] = useState(0)
  const [totalOrfao, setTotalOrfao] = useState(0)
  const [abaAtiva, setAbaAtiva] = useState<"clientes" | "todos">("clientes")
  const [todosRecebimentos, setTodosRecebimentos] = useState<RecebimentoFlat[]>([])
  const [comprovanteModal, setComprovanteModal] = useState<string | null>(null)

  // Modal novo recebimento
  const [showModal, setShowModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [valorFmt, setValorFmt] = useState("")
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null)
  const [recForm, setRecForm] = useState({
    clienteId: "",
    valor: "",
    data: getDataHoje(),
    formaPagamento: "Pix",
    observacao: ""
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/"); return }

      const activeObraId = localStorage.getItem("activeObraId")
      if (!activeObraId) { router.push("/obras"); return }

      setObraId(activeObraId)
      setUserId(user.id)

      const { data: obraData } = await supabase
        .from("obras")
        .select("nome")
        .eq("id", activeObraId)
        .eq("user_id", user.id)
        .single()
      if (obraData) setObraNome((obraData as any).nome || "")

      const clientesData = await getClientesSupabase(activeObraId, user.id)
      setClientes(clientesData)

      const totalContrato = clientesData.reduce((acc, c) => acc + (c.contratoValor || 0), 0)
      setTotalContratoGeral(totalContrato)

      const { data: recData } = await supabase
        .from("recebimentos")
        .select("id, valor, data, cliente_id, forma_pagamento, observacao, comprovante_url")
        .eq("obra_id", activeObraId)
        .eq("user_id", user.id)
        .order("data", { ascending: false })

      if (recData) {
        const clienteIds = new Set(clientesData.map(c => c.id))
        const clienteMap = Object.fromEntries(clientesData.map(c => [c.id, c.nome]))
        const totalMap: Record<string, number> = {}
        const ultimoMap: Record<string, { valor: number; data: string }> = {}
        let totalGeral = 0
        let orfao = 0
        const flat: RecebimentoFlat[] = []

        recData.forEach((r: any) => {
          const valor = parseFloat(r.valor) || 0
          totalGeral += valor
          if (r.cliente_id && clienteIds.has(r.cliente_id)) {
            totalMap[r.cliente_id] = (totalMap[r.cliente_id] || 0) + valor
            if (!ultimoMap[r.cliente_id]) {
              ultimoMap[r.cliente_id] = { valor, data: r.data || "" }
            }
            flat.push({
              id: r.id,
              valor,
              data: r.data || "",
              formaPagamento: r.forma_pagamento || "",
              observacao: r.observacao || null,
              comprovanteUrl: r.comprovante_url || null,
              clienteId: r.cliente_id,
              clienteNome: clienteMap[r.cliente_id] || "Cliente"
            })
          } else {
            orfao += valor
          }
        })

        setRecebimentosPorCliente(totalMap)
        setUltimoRecebimento(ultimoMap)
        setTotalRecebidoGeral(totalGeral)
        setTotalOrfao(orfao)
        setTodosRecebimentos(flat)
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (clienteId: string) => {
    setDeletandoId(clienteId)
    const ok = await deleteClienteSupabase(clienteId)
    if (ok) {
      setClientes(prev => prev.filter(c => c.id !== clienteId))
      toast.success("Cliente removido")
    } else {
      toast.error("Erro ao remover cliente")
    }
    setDeletandoId(null)
    setConfirmarDeleteId(null)
  }

  const abrirModal = () => {
    setRecForm({ clienteId: "", valor: "", data: getDataHoje(), formaPagamento: "Pix", observacao: "" })
    setValorFmt("")
    setComprovanteFile(null)
    setShowModal(true)
  }

  const handleSalvar = async () => {
    if (!recForm.clienteId) { toast.error("Selecione o cliente"); return }
    if (!recForm.valor || parseFloat(recForm.valor) <= 0) { toast.error("Informe o valor"); return }
    if (!recForm.data) { toast.error("Informe a data"); return }

    setSalvando(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error("Sessão expirada. Faça login novamente."); setSalvando(false); return }

      const activeObraId = obraId || localStorage.getItem("activeObraId") || ""

      let comprovanteUrl: string | null = null
      if (comprovanteFile) {
        const ts = Date.now()
        const ext = comprovanteFile.name.split(".").pop()
        comprovanteUrl = await uploadFileToStorage(comprovanteFile, "comprovantes", `${user.id}/${activeObraId}/recebimentos/${ts}.${ext}`)
      }

      const id = await saveRecebimentoSupabase(
        {
          obraId: activeObraId,
          clienteId: recForm.clienteId,
          valor: parseFloat(recForm.valor),
          data: recForm.data,
          formaPagamento: recForm.formaPagamento,
          observacao: recForm.observacao || null,
          comprovanteUrl
        },
        user.id
      )

      if (!id) { toast.error("Erro ao salvar recebimento"); return }

      const nomeCliente = clientes.find(c => c.id === recForm.clienteId)?.nome || "cliente"
      toast.success(`Recebimento de ${fmt(parseFloat(recForm.valor))} vinculado a ${nomeCliente}`)
      window.dispatchEvent(new Event("recebimentoSalvo"))
      setShowModal(false)
      await carregarDados()
    } catch {
      toast.error("Erro ao salvar recebimento")
    } finally {
      setSalvando(false)
    }
  }

  const saldoGeralAReceber = totalContratoGeral - totalRecebidoGeral

  const isImageUrl = (url: string) => {
    if (url.startsWith("data:image/")) return true
    return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some(ext => url.toLowerCase().includes(ext))
  }
  const isPdfUrl = (url: string) => {
    if (url.startsWith("data:application/pdf")) return true
    return url.toLowerCase().includes(".pdf")
  }

  const formatarData = (data: string) => {
    if (!data) return ""
    const [y, m, d] = data.split("T")[0].split("-")
    return `${d}/${m}/${y}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-4 pb-24 px-4 sm:px-6">

      {/* Modal confirmação exclusão */}
      {confirmarDeleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f2228] rounded-2xl shadow-2xl max-w-xs w-full p-5 border border-white/[0.1]">
            <p className="text-sm font-bold text-white mb-1">Remover cliente?</p>
            <p className="text-xs text-gray-400 mb-4">Os recebimentos vinculados serão desvinculados mas não excluídos.</p>
            <div className="flex gap-2">
              <Button
                onClick={() => setConfirmarDeleteId(null)}
                className="flex-1 h-9 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 border border-white/[0.1] rounded-xl text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDelete(confirmarDeleteId)}
                disabled={deletandoId === confirmarDeleteId}
                className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm"
              >
                {deletandoId === confirmarDeleteId ? "Removendo..." : "Remover"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal novo recebimento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => { if (!salvando) setShowModal(false) }}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full bg-[#1f2228] border-t border-white/[0.08] rounded-t-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
              <h2 className="text-sm font-bold text-white">Registrar Recebimento</h2>
              <button onClick={() => { if (!salvando) setShowModal(false) }} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
              {/* Cliente */}
              <div className="space-y-1">
                <label className="block text-[11px] text-gray-500 font-medium uppercase tracking-wide">Cliente *</label>
                <Select value={recForm.clienteId} onValueChange={v => setRecForm(prev => ({ ...prev, clienteId: v }))}>
                  <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base">
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-white">{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {recForm.clienteId && (
                  <div className="bg-[#0B3064]/15 border border-[#0B3064]/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Users className="w-3 h-3 text-[#7eaaee] flex-shrink-0" />
                    <p className="text-xs text-gray-400">
                      <span className="font-semibold text-white">{clientes.find(c => c.id === recForm.clienteId)?.nome}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Valor + Data lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] text-gray-500 font-medium uppercase tracking-wide">Valor *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={valorFmt}
                      onChange={e => {
                        const f = formatarMoeda(e.target.value)
                        setValorFmt(f)
                        const n = removerFormatacao(f)
                        setRecForm(prev => ({ ...prev, valor: n > 0 ? n.toString() : "" }))
                      }}
                      placeholder="0,00"
                      style={{ width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '8px', fontSize: '16px', color: 'white', background: '#2a2d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-gray-500 font-medium uppercase tracking-wide">Data *</label>
                  <div className="overflow-hidden">
                    <input
                      type="date"
                      value={recForm.data}
                      onChange={e => setRecForm(prev => ({ ...prev, data: e.target.value }))}
                      style={{ WebkitAppearance: 'none', appearance: 'none', width: '100%', minWidth: '0', maxWidth: '100%', boxSizing: 'border-box', display: 'block', height: '40px', padding: '0 8px', fontSize: '16px', lineHeight: '40px', color: 'white', background: '#2a2d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Forma de pagamento */}
              <div className="space-y-1">
                <label className="block text-[11px] text-gray-500 font-medium uppercase tracking-wide">Forma de pagamento *</label>
                <Select value={recForm.formaPagamento} onValueChange={v => setRecForm(prev => ({ ...prev, formaPagamento: v }))}>
                  <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                    {FORMAS_PAGAMENTO.map(f => (
                      <SelectItem key={f} value={f} className="text-white">{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Observação */}
              <div className="space-y-1">
                <label className="block text-[11px] text-gray-500 font-medium uppercase tracking-wide">Observação <span className="normal-case text-gray-700">(opcional)</span></label>
                <input
                  type="text"
                  value={recForm.observacao}
                  onChange={e => setRecForm(prev => ({ ...prev, observacao: e.target.value }))}
                  placeholder="Ex: Parcela 1, sinal..."
                  style={{ width: '100%', height: '40px', padding: '0 12px', fontSize: '16px', color: 'white', background: '#2a2d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Comprovante */}
              <FileUpload
                label="Comprovante (opcional)"
                accept="image/*,application/pdf"
                maxSize={10}
                onChange={(file) => setComprovanteFile(file)}
              />
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-white/[0.06] flex-shrink-0">
              <button
                onClick={() => { if (!salvando) setShowModal(false) }}
                className="flex-1 h-11 bg-white/[0.07] hover:bg-white/[0.1] text-gray-300 text-sm font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="flex-1 h-11 bg-[#0B3064] hover:bg-[#082551] disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {salvando ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</> : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1f2228] rounded-lg flex items-center justify-center border border-white/[0.1]">
                <HandCoins className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Recebimentos</h1>
                {obraNome && <p className="text-sm text-gray-400">{obraNome}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Resumo financeiro */}
        {(totalContratoGeral > 0 || totalRecebidoGeral > 0) && (
          <Card className="p-3 bg-[#1f2228]/80 border-white/[0.08] mb-4">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Contratado</p>
                <p className="text-sm font-bold text-gray-300 break-all">{fmt(totalContratoGeral)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Recebido</p>
                <p className="text-sm font-bold text-green-400 break-all">{fmt(totalRecebidoGeral)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Saldo</p>
                <p className="text-sm font-bold text-[#7eaaee] break-all">{fmt(Math.max(0, saldoGeralAReceber))}</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 border-t border-white/[0.08] pt-1.5">
              {todosRecebimentos.length} {todosRecebimentos.length === 1 ? "recebimento" : "recebimentos"} · {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
            </p>
          </Card>
        )}

        {/* Aviso: recebimentos sem cliente vinculado */}
        {totalOrfao > 0 && (
          <Card className="p-3 mb-4 bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-300">
                  {fmt(totalOrfao)} sem cliente vinculado
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Existem recebimentos registrados que não estão associados a nenhum cliente cadastrado. Isso pode ter ocorrido se o cliente foi removido ou se o lançamento foi feito antes de um cliente ser criado. Registre novamente vinculando ao cliente correto.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        {(clientes.length > 0 || todosRecebimentos.length > 0) && (
          <div className="flex gap-1 mb-4 bg-[#1f2228]/80 border border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => setAbaAtiva("clientes")}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors ${abaAtiva === "clientes" ? "bg-[#2a2d35] text-white shadow" : "text-gray-400 hover:text-gray-300"}`}
            >
              <Users className="w-3.5 h-3.5" />
              Por Cliente
            </button>
            <button
              onClick={() => setAbaAtiva("todos")}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors ${abaAtiva === "todos" ? "bg-[#2a2d35] text-white shadow" : "text-gray-400 hover:text-gray-300"}`}
            >
              <List className="w-3.5 h-3.5" />
              Todos ({todosRecebimentos.length})
            </button>
          </div>
        )}

        {/* Aba: Todos os recebimentos */}
        {abaAtiva === "todos" && (
          <div className="space-y-1.5">
            {todosRecebimentos.length === 0 ? (
              <Card className="p-6 bg-[#1f2228]/50 border border-white/[0.06] rounded-xl text-center">
                <p className="text-xs text-gray-500">Nenhum recebimento registrado ainda.</p>
              </Card>
            ) : (
              todosRecebimentos.map(rec => (
                <Card key={rec.id} className="p-2.5 bg-[#1f2228]/60 border border-slate-700/25 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-green-400">{fmt(rec.valor)}</p>
                        <span className="text-[10px] text-gray-500">{rec.formaPagamento}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium truncate">{rec.clienteNome}</p>
                      <p className="text-[10px] text-gray-500">
                        {formatarData(rec.data)}{rec.observacao ? ` · ${rec.observacao}` : ""}
                      </p>
                    </div>
                    {rec.comprovanteUrl && (
                      <button
                        onClick={() => setComprovanteModal(rec.comprovanteUrl!)}
                        title="Ver comprovante"
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-[#0B3064]/20 hover:bg-[#0e3d7a]/30 border border-[#0B3064]/40 transition-colors flex-shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#7eaaee]" />
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/clientes/${rec.clienteId}`)}
                      title="Ver extrato do cliente"
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white/[0.08] hover:bg-[#2a2d35] transition-colors flex-shrink-0"
                    >
                      <HandCoins className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Aba: Por cliente */}
        {abaAtiva === "clientes" && (
          <>
            {clientes.length === 0 ? (
              <Card className="p-8 bg-[#13151a]/90 border border-slate-800 shadow-lg">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-16 h-16 bg-[#1f2228] rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/[0.1]">
                    <Users className="w-8 h-8 text-[#999999]" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Nenhum cliente cadastrado</h2>
                  <p className="text-gray-400 mb-6 text-sm">
                    Cadastre clientes para organizar recebimentos, acompanhar contratos e saldos.
                  </p>
                  <Button
                    onClick={() => router.push("/dashboard/clientes/novo")}
                    className="bg-[#0B3064] hover:bg-[#082551] text-white font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar primeiro cliente
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {clientes.map(cliente => {
                  const totalRecebido = recebimentosPorCliente[cliente.id] || 0
                  const contratoValor = cliente.contratoValor || 0
                  const saldo = contratoValor - totalRecebido
                  const ult = ultimoRecebimento[cliente.id]

                  return (
                    <Card key={cliente.id} className="p-3 bg-[#1f2228]/80 border border-white/[0.08] hover:border-slate-600/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-white truncate flex-1 mr-2">{cliente.nome}</p>
                        {ult && (
                          <span className="text-[10px] text-gray-500 flex-shrink-0 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-green-400" />
                            {ult.data.split("T")[0].split("-").reverse().join("/")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mb-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9px] text-gray-500 uppercase tracking-wide flex-shrink-0">Contratado</p>
                          <p className="text-sm font-semibold text-gray-300 text-right break-all">{contratoValor > 0 ? fmt(contratoValor) : "—"}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9px] text-gray-500 uppercase tracking-wide flex-shrink-0">Recebido</p>
                          <p className="text-sm font-semibold text-green-400 text-right break-all">{fmt(totalRecebido)}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9px] text-gray-500 uppercase tracking-wide flex-shrink-0">Saldo</p>
                          <p className={`text-sm font-semibold text-right break-all ${contratoValor > 0 ? (saldo < 0 ? "text-red-400" : "text-[#cccccc]") : "text-gray-600"}`}>
                            {contratoValor > 0 ? fmt(saldo) : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.08]">
                        <button
                          onClick={() => router.push(`/dashboard/clientes/${cliente.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 h-7 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-medium rounded-lg transition-colors"
                        >
                          <HandCoins className="w-3.5 h-3.5" />
                          Extrato
                        </button>
                        {cliente.contratoUrl && (
                          <button
                            onClick={() => window.open(cliente.contratoUrl!, "_blank")}
                            title="Ver contrato"
                            className="flex items-center justify-center gap-1 h-7 px-2.5 bg-[#0B3064]/15 hover:bg-[#0e3d7a]/25 text-[#7eaaee] text-xs rounded-lg transition-colors border border-[#0B3064]/30"
                          >
                            <FileText className="w-3 h-3" />
                            Contrato
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/dashboard/clientes/${cliente.id}?edit=1`)}
                          className="flex-1 flex items-center justify-center gap-1.5 h-7 bg-white/[0.08] hover:bg-[#2a2d35] text-gray-400 text-xs rounded-lg transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmarDeleteId(cliente.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 h-7 bg-white/[0.08] hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-xs rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remover
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer fixo com ações */}
      {clientes.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#13151a]/95 backdrop-blur border-t border-white/[0.06] px-3 py-2">
          <div className="max-w-3xl mx-auto flex gap-2">
            <button
              onClick={abrirModal}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-[#2a2d35] hover:bg-white/[0.13] active:scale-95 text-gray-300 text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150"
            >
              <HandCoins className="w-3.5 h-3.5" />
              Novo Recebimento
            </button>
            <button
              onClick={() => router.push("/dashboard/clientes/novo")}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-[#2a2d35] hover:bg-white/[0.13] active:scale-95 text-gray-300 text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150"
            >
              <Users className="w-3.5 h-3.5" />
              Novo Cliente
            </button>
          </div>
        </div>
      )}

      {/* Modal comprovante */}
      {comprovanteModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setComprovanteModal(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 bg-[#1f2228] hover:bg-[#2a2d35] text-white rounded-full flex items-center justify-center shadow-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-full h-full bg-slate-800/95 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {isImageUrl(comprovanteModal) ? (
                <div className="w-full h-full flex items-center justify-center p-6">
                  <img src={comprovanteModal} alt="Comprovante" className="max-w-full max-h-full object-contain" />
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
    </div>
  )
}
