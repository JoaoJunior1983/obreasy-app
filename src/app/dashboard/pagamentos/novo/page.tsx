"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Save, X, Plus, CheckCircle2, Home, CreditCard, Users } from "lucide-react"
import { goToObraDashboard } from "@/lib/navigation"
import { FileUpload } from "@/components/custom/FileUpload"
import { BudgetAlertModal } from "@/components/custom/BudgetAlertModal"
import { checkBudgetAfterTransaction } from "@/lib/budget-calculator"
import { checkAndShowPercentualNotifications } from "@/lib/push-notifications"
import { BudgetMilestoneToast } from "@/components/custom/BudgetMilestoneToast"
import { type BudgetAlert } from "@/lib/budget-alerts"
import { avisoAposCriarPagamento } from "@/lib/alert-manager"
import { getDataHoje } from "@/lib/utils"
import { toast } from "sonner"

const FORMAS_PAGAMENTO = ["Pix", "Dinheiro", "Cartão", "Boleto", "Transferência"]

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

const formatarMoeda = (valor: string): string => {
  const apenasNumeros = valor.replace(/\D/g, "")
  if (!apenasNumeros) return ""
  const numero = parseFloat(apenasNumeros) / 100
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const removerFormatacao = (valorFormatado: string): number => {
  const apenasNumeros = valorFormatado.replace(/\D/g, "")
  return parseFloat(apenasNumeros) / 100
}

export default function NovoPagamentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [obraId, setObraId] = useState("")
  const [valorFormatado, setValorFormatado] = useState("")
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [comprovanteAnexo, setComprovanteAnexo] = useState<string | null>(null)
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const primeiroInputRef = useRef<HTMLInputElement>(null)
  const [budgetAlert, setBudgetAlert] = useState<BudgetAlert | null>(null)
  const [pagamentoPendente, setPagamentoPendente] = useState<any>(null)
  const preCheckRef = useRef({ totalPagoProfAntes: 0, totalGastoObraAntes: 0, obraOrcamento: 0 })
  const isSubmittingRef = useRef(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [uuidError, setUuidError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    data: getDataHoje(),
    profissionalId: "",
    valor: "",
    formaPagamento: "Pix",
    observacao: ""
  })

  useEffect(() => {
    const carregarDados = async () => {
      const isAuthenticated = localStorage.getItem("isAuthenticated")
      if (!isAuthenticated) { router.push("/login"); return }

      const activeObraId = localStorage.getItem("activeObraId")
      if (!activeObraId) { router.push("/obras"); return }
      setObraId(activeObraId)

      try {
        const { supabase } = await import("@/lib/supabase")
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.push("/login"); return }

        const { data: profissionaisData, error: profError } = await supabase
          .from("profissionais").select("*").eq("obra_id", activeObraId).eq("user_id", user.id).order("criada_em", { ascending: false })

        if (profError) { toast.error("Erro ao carregar profissionais"); setLoadingDados(false); return }

        const profissionaisObra = (profissionaisData || []).map((p: any) => ({
          id: p.id, obraId: p.obra_id, nome: p.nome, funcao: p.funcao,
          telefone: p.telefone, valorPrevisto: p.valor_previsto, contrato: p.contrato
        }))

        setProfissionais(profissionaisObra)
        if (profissionaisObra.length === 1) {
          setFormData(prev => ({ ...prev, profissionalId: profissionaisObra[0].id }))
        }
        setLoadingDados(false)
      } catch {
        toast.error("Erro ao carregar dados")
        setLoadingDados(false)
      }
    }
    carregarDados()
  }, [router])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fmt = formatarMoeda(e.target.value)
    setValorFormatado(fmt)
    const n = removerFormatacao(fmt)
    setFormData({ ...formData, valor: n > 0 ? n.toString() : "" })
  }

  const limparFormulario = () => {
    setFormData({ data: getDataHoje(), profissionalId: "", valor: "", formaPagamento: "Pix", observacao: "" })
    setValorFormatado("")
    setComprovanteAnexo(null)
    setComprovanteFile(null)
    setSuccess(false)
    setLoading(false)
    setUploadingFile(false)
    setTimeout(() => primeiroInputRef.current?.focus(), 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setLoading(true)
    setUuidError(null)

    try {
      if (!formData.data || !formData.profissionalId || !formData.valor || parseFloat(formData.valor) <= 0) {
        toast.error("Preencha todos os campos obrigatórios (Data, Profissional e Valor)")
        setLoading(false)
        return
      }

      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) { toast.error("Erro de autenticação."); router.push("/login"); setLoading(false); return }

      const { isValidUUID } = await import("@/lib/storage")
      if (!isValidUUID(obraId)) { setUuidError("ID da obra inválido. Recarregue a página."); setLoading(false); return }
      if (!isValidUUID(formData.profissionalId)) {
        const prof = profissionais.find(p => p.id === formData.profissionalId)
        setUuidError(`Profissional (${prof?.nome || 'desconhecido'}) criado em versão antiga. Recadastre o profissional.`)
        setLoading(false); return
      }

      let comprovanteUrl: string | null = null
      if (comprovanteFile) {
        setUploadingFile(true)
        try {
          const { uploadFileToStorage } = await import("@/lib/storage")
          const timestamp = Date.now()
          const extension = comprovanteFile.name.split('.').pop()
          const fileName = `${obraId}/${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`
          comprovanteUrl = await uploadFileToStorage(comprovanteFile, "comprovantes", fileName)
          if (!comprovanteUrl) { toast.error("Erro ao fazer upload do comprovante."); setLoading(false); setUploadingFile(false); return }
        } catch { toast.error("Erro ao fazer upload do comprovante."); setLoading(false); setUploadingFile(false); return }
        finally { setUploadingFile(false) }
      }

      const profissional = profissionais.find(p => p.id === formData.profissionalId)
      const nomeProfissional = profissional?.nome || "Profissional"
      const pagamentoIdLocal = `pag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const pagamento = {
        id: pagamentoIdLocal, obraId, profissionalId: formData.profissionalId,
        data: formData.data, valor: parseFloat(formData.valor),
        formaPagamento: formData.formaPagamento, observacao: formData.observacao || undefined,
        comprovanteUrl
      }

      try {
        const [pagsProfRes, obraRes, pagsObraRes] = await Promise.all([
          supabase.from("pagamentos").select("valor").eq("profissional_id", formData.profissionalId).eq("user_id", user.id),
          supabase.from("obras").select("orcamento").eq("id", obraId).single(),
          supabase.from("pagamentos").select("valor").eq("obra_id", obraId).eq("user_id", user.id)
        ])
        const totalPagoProfAntes = (pagsProfRes.data || []).reduce((s: number, p: any) => s + parseFloat(p.valor || '0'), 0)
        const obraOrcamento = obraRes.data?.orcamento || 0
        const totalPagamentosObra = (pagsObraRes.data || []).reduce((s: number, p: any) => s + parseFloat(p.valor || '0'), 0)
        const despesasLocal = JSON.parse(localStorage.getItem("despesas") || "[]")
        const totalDespesasObra = despesasLocal.filter((d: any) => d.obraId === obraId).reduce((s: number, d: any) => s + (d.valor || 0), 0)
        preCheckRef.current = { totalPagoProfAntes, totalGastoObraAntes: totalPagamentosObra + totalDespesasObra, obraOrcamento }
      } catch { /* não crítico */ }

      const despesasPagamento = {
        id: pagamentoIdLocal, obraId, data: formData.data, category: "mao_obra", categoria: "mao_obra",
        descricao: `Pagamento - ${nomeProfissional}`, valor: parseFloat(formData.valor),
        formaPagamento: formData.formaPagamento, profissionalId: formData.profissionalId,
        professionalId: formData.profissionalId, observacao: formData.observacao || undefined,
        observacoes: formData.observacao || undefined, anexo: comprovanteUrl || undefined
      }

      const despesasExistentes = JSON.parse(localStorage.getItem("despesas") || "[]")
      const obras = JSON.parse(localStorage.getItem("obras") || "[]")
      const obraAtual = obras.find((o: any) => o.id === obraId)

      if (obraAtual?.orcamento > 0) {
        const alert = checkBudgetAfterTransaction(obraId, despesasPagamento, despesasExistentes, profissionais, obraAtual.orcamento)
        if (alert) {
          setPagamentoPendente({ pagamento, despesaPagamento: despesasPagamento })
          setBudgetAlert(alert); setLoading(false); return
        }
      }

      const { savePagamentoSupabase } = await import("@/lib/storage")
      const { id, ...pagamentoSemId } = pagamento
      const savedId = await savePagamentoSupabase(pagamentoSemId, user.id)
      if (!savedId) { toast.error("Erro ao salvar pagamento no banco de dados"); setLoading(false); return }

      const valorPrevisto = profissional?.valorPrevisto || (profissional?.contrato as any)?.valorPrevisto || (profissional?.contrato as any)?.valorTotalPrevisto || 0
      checkAndShowPercentualNotifications({
        profissionalId: formData.profissionalId, profissionalNome: nomeProfissional, valorPrevisto,
        valorPagamento: parseFloat(formData.valor), totalPagoProfAntes: preCheckRef.current.totalPagoProfAntes,
        obraId, obraOrcamento: preCheckRef.current.obraOrcamento,
        totalGastoObraAntes: preCheckRef.current.totalGastoObraAntes, novoGastoObra: parseFloat(formData.valor)
      })

      despesasExistentes.push({ ...despesasPagamento, id: savedId })
      localStorage.setItem("despesas", JSON.stringify(despesasExistentes))
      window.dispatchEvent(new CustomEvent("pagamentoSalvo", { detail: { profissionalId: formData.profissionalId } }))
      avisoAposCriarPagamento(obraId)

      toast.success("Pagamento registrado com sucesso!")
      setSuccess(true)
      setLoading(false)
    } catch (error) {
      toast.error("Erro ao salvar pagamento. Tente novamente.")
      setLoading(false)
    } finally {
      isSubmittingRef.current = false
    }
  }

  const handleConfirmarPagamento = async () => {
    if (!pagamentoPendente) return
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    try {
      setLoading(true)
      setUuidError(null)
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) { toast.error("Erro de autenticação."); router.push("/login"); return }

      const { isValidUUID, savePagamentoSupabase } = await import("@/lib/storage")
      if (!isValidUUID(pagamentoPendente.pagamento.obraId) || !isValidUUID(pagamentoPendente.pagamento.profissionalId)) {
        toast.error("IDs inválidos. Recarregue a página."); setBudgetAlert(null); setPagamentoPendente(null); setLoading(false); return
      }

      const { id, ...pagamentoSemId } = pagamentoPendente.pagamento
      const savedId = await savePagamentoSupabase(pagamentoSemId, user.id)
      if (!savedId) { toast.error("Erro ao salvar pagamento."); setLoading(false); return }

      const profissional = profissionais.find(p => p.id === pagamentoPendente.pagamento.profissionalId)
      const valorPrevisto = profissional?.valorPrevisto || (profissional?.contrato as any)?.valorPrevisto || (profissional?.contrato as any)?.valorTotalPrevisto || 0
      checkAndShowPercentualNotifications({
        profissionalId: pagamentoPendente.pagamento.profissionalId, profissionalNome: profissional?.nome || 'Profissional',
        valorPrevisto, valorPagamento: pagamentoPendente.pagamento.valor,
        totalPagoProfAntes: preCheckRef.current.totalPagoProfAntes, obraId,
        obraOrcamento: preCheckRef.current.obraOrcamento, totalGastoObraAntes: preCheckRef.current.totalGastoObraAntes,
        novoGastoObra: pagamentoPendente.pagamento.valor
      })

      const despesasExistentes = JSON.parse(localStorage.getItem("despesas") || "[]")
      despesasExistentes.push({ ...pagamentoPendente.despesaPagamento, id: savedId })
      localStorage.setItem("despesas", JSON.stringify(despesasExistentes))
      window.dispatchEvent(new CustomEvent("pagamentoSalvo", { detail: { profissionalId: pagamentoPendente.pagamento.profissionalId } }))
      avisoAposCriarPagamento(obraId)

      toast.success("Pagamento registrado com sucesso!")
      setBudgetAlert(null); setPagamentoPendente(null); setSuccess(true); setLoading(false)
    } catch {
      toast.error("Erro ao salvar pagamento. Tente novamente.")
      setLoading(false)
    } finally {
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-4 pb-10 sm:px-6">
      {budgetAlert && <BudgetAlertModal alert={budgetAlert} onConfirm={handleConfirmarPagamento} />}
      <BudgetMilestoneToast />

      <div className="max-w-lg mx-auto space-y-3">

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-3.5 h-3.5 text-[#7eaaee]" />
          </div>
          <h1 className="text-sm font-bold text-white">Novo Pagamento</h1>
        </div>

        {/* Sucesso */}
        {success && (
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs font-semibold text-white">Pagamento registrado com sucesso!</p>
            </div>
            <div className="flex gap-2">
              <button onClick={limparFormulario} className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-xs font-semibold rounded-xl transition-all">
                <Plus className="w-3.5 h-3.5" />
                Novo pagamento
              </button>
              <button onClick={() => goToObraDashboard(router, obraId)} className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 text-xs font-medium rounded-xl border border-white/[0.08] transition-all">
                <Home className="w-3.5 h-3.5" />
                Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Formulário */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Erro UUID */}
            {uuidError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-400 mb-1">Erro de validação</p>
                <p className="text-xs text-red-300 mb-3">{uuidError}</p>
                <button type="button" onClick={() => { setUuidError(null); router.push("/dashboard/profissionais/novo") }}
                  className="flex items-center gap-1.5 h-8 px-3 bg-[#0B3064] hover:bg-[#082551] text-white text-xs font-semibold rounded-lg transition-colors">
                  <Plus className="w-3 h-3" />
                  Cadastrar novo profissional
                </button>
              </div>
            )}

            {loadingDados ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border-2 border-[#0B3064] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : profissionais.length === 0 ? (
              <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-6 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Nenhum profissional cadastrado</p>
                  <p className="text-xs text-gray-500">Cadastre um profissional antes de registrar pagamentos.</p>
                </div>
                <button type="button" onClick={() => router.push("/dashboard/profissionais/novo")}
                  className="flex items-center gap-1.5 h-9 px-4 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-xs font-semibold rounded-xl transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar Profissional
                </button>
              </div>
            ) : (
              <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl overflow-hidden">

                {/* Profissional */}
                <div className="px-3 pt-3 pb-2.5 border-b border-white/[0.06]">
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Profissional *</p>
                  <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#2a2d35]">
                    <select
                      value={formData.profissionalId}
                      onChange={(e) => {
                        if (e.target.value === "__new__") router.push("/dashboard/profissionais/novo")
                        else setFormData({ ...formData, profissionalId: e.target.value })
                      }}
                      required
                      className="w-full h-10 px-3 bg-[#2a2d35] text-sm text-white focus:outline-none appearance-none"
                      style={{ WebkitAppearance: 'none', colorScheme: 'dark' }}
                    >
                      <option value="">Selecione um profissional</option>
                      {profissionais.map(p => (
                        <option key={p.id} value={p.id}>{p.nome} — {p.funcao}</option>
                      ))}
                      <option value="__new__">+ Cadastrar novo profissional</option>
                    </select>
                  </div>
                </div>

                {/* Valor */}
                <div className="px-3 pt-2.5 pb-2.5 border-b border-white/[0.06]">
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Valor *</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium pointer-events-none">R$</span>
                    <input
                      ref={primeiroInputRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={valorFormatado}
                      onChange={handleValorChange}
                      required
                      className="w-full h-10 pl-8 pr-3 bg-[#2a2d35] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0B3064] transition-colors"
                    />
                  </div>
                </div>

                {/* Data */}
                <div className="px-3 pt-2.5 pb-2.5 border-b border-white/[0.06]">
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Data *</p>
                  <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#2a2d35]">
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                      className="w-full h-10 px-3 bg-transparent text-sm text-white focus:outline-none appearance-none"
                      style={{ WebkitAppearance: 'none', fontSize: '13px', lineHeight: '40px', minWidth: 0, colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Forma de pagamento */}
                <div className="px-3 pt-2.5 pb-2.5 border-b border-white/[0.06]">
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Forma de Pagamento</p>
                  <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#2a2d35]">
                    <select
                      value={formData.formaPagamento}
                      onChange={(e) => setFormData({ ...formData, formaPagamento: e.target.value })}
                      className="w-full h-10 px-3 bg-[#2a2d35] text-sm text-white focus:outline-none appearance-none"
                      style={{ WebkitAppearance: 'none', colorScheme: 'dark' }}
                    >
                      {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                {/* Comprovante */}
                <div className="px-3 pt-2.5 pb-2.5 border-b border-white/[0.06]">
                  <FileUpload
                    label="Comprovante de pagamento"
                    accept="image/jpeg,image/png,application/pdf"
                    maxSize={10}
                    value={comprovanteAnexo}
                    onChange={(file, preview) => { setComprovanteFile(file); setComprovanteAnexo(preview) }}
                  />
                </div>

                {/* Observações */}
                <div className="px-3 pt-2.5 pb-3">
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Observações <span className="normal-case text-gray-600">(opcional)</span></p>
                  <textarea
                    placeholder="Informações adicionais sobre este pagamento..."
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-[#2a2d35] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0B3064] transition-colors resize-none"
                  />
                </div>

              </div>
            )}

            {/* Botões */}
            {!loadingDados && profissionais.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goToObraDashboard(router, obraId)}
                  disabled={loading}
                  className="flex-1 h-10 bg-white/[0.07] hover:bg-white/[0.11] text-gray-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingFile}
                  className="flex-1 h-10 bg-[#0B3064] hover:bg-[#082551] active:scale-95 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {uploadingFile
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>
                    : loading
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</>
                    : <><Save className="w-3.5 h-3.5" />Salvar</>
                  }
                </button>
              </div>
            )}

          </form>
        )}
      </div>
    </div>
  )
}
