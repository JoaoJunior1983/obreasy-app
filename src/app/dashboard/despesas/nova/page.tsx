"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Save, X, Calendar, DollarSign, FileText, CreditCard, User, MessageSquare, Plus, CheckCircle2, Home } from "lucide-react"
import { goToObraDashboard } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/custom/FileUpload"
import { BudgetAlertModal } from "@/components/custom/BudgetAlertModal"
import { checkBudgetAfterTransaction } from "@/lib/budget-calculator"
import { trackFirstEvent, updateLastActive } from "@/lib/track-event"
import { type BudgetAlert } from "@/lib/budget-alerts"
import { checkAndShowPercentualNotifications } from "@/lib/push-notifications"
import { BudgetMilestoneToast } from "@/components/custom/BudgetMilestoneToast"
import { avisoAposCriarDespesa } from "@/lib/alert-manager"
import { getDataHoje } from "@/lib/utils"
import { toast } from "sonner"

const CATEGORIAS = [
  { value: "material", label: "Material de Construção" },
  { value: "ferramentas", label: "Ferramentas e Equipamentos" },
  { value: "licencas", label: "Licenças e Documentação" },
  { value: "transporte", label: "Transporte e Frete" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "limpeza", label: "Limpeza" },
  { value: "seguranca", label: "Segurança e EPIs" },
  { value: "energia_agua", label: "Energia e Água" },
  { value: "aluguel", label: "Aluguel de Equipamentos" },
  { value: "projetos", label: "Projetos e Consultorias" },
  { value: "outros", label: "Outros" }
]

const FORMAS_PAGAMENTO = [
  "Pix",
  "Dinheiro",
  "Cartão",
  "Boleto",
  "Transferência"
]

interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
}

// Função para formatar valor monetário brasileiro
const formatarMoeda = (valor: string): string => {
  const apenasNumeros = valor.replace(/\D/g, "")
  if (!apenasNumeros) return ""
  const numero = parseFloat(apenasNumeros) / 100
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const removerFormatacao = (valorFormatado: string): number => {
  const apenasNumeros = valorFormatado.replace(/\D/g, "")
  return parseFloat(apenasNumeros) / 100
}

export default function NovaDespesaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [obraId, setObraId] = useState("")
  const [valorFormatado, setValorFormatado] = useState("")
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [comprovanteAnexo, setComprovanteAnexo] = useState<string | null>(null)
  const primeiroInputRef = useRef<HTMLInputElement>(null)
  const [budgetAlert, setBudgetAlert] = useState<BudgetAlert | null>(null)
  const [despesaPendente, setDespesaPendente] = useState<any>(null)
  const preCheckRef = useRef({ totalGastoObraAntes: 0, obraOrcamento: 0 })
  
  const [formData, setFormData] = useState({
    data: getDataHoje(),
    category: "material",
    descricao: "",
    valor: "",
    formaPagamento: "Pix",
    fornecedor: "",
    observacoes: ""
  })

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    // CRÍTICO: Usar activeObraId para garantir que a despesa seja vinculada à obra correta
    const activeObraId = localStorage.getItem("activeObraId")
    if (!activeObraId) {
      router.push("/obras")
      return
    }

    setObraId(activeObraId)

    // Carregar profissionais da obra ativa
    const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
    const profissionaisObra = todosProfissionais.filter((p: Profissional) => p.obraId === activeObraId)
    setProfissionais(profissionaisObra)
  }, [router])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarMoeda(valorDigitado)
    setValorFormatado(valorFormatado)

    const valorNumerico = removerFormatacao(valorFormatado)
    setFormData({ ...formData, valor: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const limparFormulario = () => {
    setFormData({
      data: getDataHoje(),
      category: "material",
      descricao: "",
      valor: "",
      formaPagamento: "Pix",
      fornecedor: "",
      observacoes: ""
    })
    setValorFormatado("")
    setSuccess(false)
    setLoading(false)

    setTimeout(() => {
      primeiroInputRef.current?.focus()
    }, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.data || !formData.category || !formData.valor || parseFloat(formData.valor) <= 0) {
        alert("Por favor, preencha todos os campos obrigatórios (Data, Categoria e Valor)")
        setLoading(false)
        return
      }

      // Verificar autenticação
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        toast.error("Erro de autenticação. Faça login novamente.")
        router.push("/")
        return
      }

      // ID temporário APENAS para verificação de orçamento local
      // NÃO será enviado ao Supabase (removido antes do insert)
      const despesaIdLocal = `desp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const despesa = {
        id: despesaIdLocal, // Temporário, apenas para compatibilidade com checkBudgetAfterTransaction
        obraId: obraId,
        data: formData.data,
        category: formData.category,
        categoria: formData.category,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        formaPagamento: formData.formaPagamento,
        fornecedor: formData.fornecedor || undefined,
        observacoes: formData.observacoes || undefined,
        observacao: formData.observacoes || undefined,
        anexo: comprovanteAnexo || undefined
      }

      // Carregar totais reais do Supabase para verificação de percentuais (antes de salvar)
      try {
        const [obraRes, despesasObraRes] = await Promise.all([
          supabase.from("obras").select("orcamento").eq("id", obraId).single(),
          supabase.from("despesas").select("valor").eq("obra_id", obraId).eq("user_id", user.id)
        ])
        const obraOrcamento = obraRes.data?.orcamento || 0
        const totalGastoObraAntes = (despesasObraRes.data || []).reduce((s: number, d: any) => s + parseFloat(d.valor || '0'), 0)
        preCheckRef.current = { totalGastoObraAntes, obraOrcamento }
      } catch { /* silencioso */ }

      // Verificar alerta de orçamento ANTES de salvar
      const despesasExistentes = JSON.parse(localStorage.getItem("despesas") || "[]")
      const obras = JSON.parse(localStorage.getItem("obras") || "[]")
      const obraAtual = obras.find((o: any) => o.id === obraId)

      if (obraAtual && obraAtual.orcamento > 0) {
        const alert = checkBudgetAfterTransaction(
          obraId,
          despesa,
          despesasExistentes,
          profissionais,
          obraAtual.orcamento
        )

        if (alert) {
          // Exibir modal de alerta e pausar o salvamento
          setDespesaPendente(despesa)
          setBudgetAlert(alert)
          setLoading(false)
          return
        }
      }

      // Salvar despesa no Supabase (remover ID temporário)
      const { saveDespesaSupabase } = await import("@/lib/storage")
      const { id, ...despesaSemId } = despesa // Remove o ID temporário
      const result = await saveDespesaSupabase(despesaSemId, user.id)

      if (!result.id || result.error) {
        console.error("Falha ao salvar despesa:", result.error)
        toast.error(result.error || "Erro ao salvar despesa no banco de dados")
        setLoading(false)
        return
      }

      // Usar o UUID retornado pelo Supabase para salvar no localStorage
      const despesaSalva = {
        ...despesa,
        id: result.id // UUID gerado pelo banco
      }

      // Manter no localStorage para compatibilidade
      despesasExistentes.push(despesaSalva)
      localStorage.setItem("despesas", JSON.stringify(despesasExistentes))

      // Disparar evento de despesa salva
      window.dispatchEvent(new CustomEvent("despesaSalva", {
        detail: { obraId: obraId }
      }))

      trackFirstEvent("first_despesa", { obra_id: obraId }).catch(() => {})
      updateLastActive().catch(() => {})

      // CRÍTICO: Recalcular avisos após criar despesa
      avisoAposCriarDespesa(obraId)

      // Verificar marcos de percentual (pós-save) — push notification
      checkAndShowPercentualNotifications({
        obraId,
        obraOrcamento: preCheckRef.current.obraOrcamento,
        totalGastoObraAntes: preCheckRef.current.totalGastoObraAntes,
        novoGastoObra: parseFloat(formData.valor)
      })

      toast.success("Despesa salva com sucesso!")
      setSuccess(true)
      setLoading(false)

    } catch (error) {
      console.error("Erro ao salvar despesa:", error)
      toast.error("Erro ao salvar despesa. Tente novamente.")
      setLoading(false)
    }
  }

  const handleConfirmarDespesa = async () => {
    if (!despesaPendente) return

    try {
      // Verificar autenticação
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        toast.error("Erro de autenticação. Faça login novamente.")
        router.push("/")
        return
      }

      // Salvar despesa no Supabase (remover ID temporário)
      const { saveDespesaSupabase } = await import("@/lib/storage")
      const { id, ...despesaSemId } = despesaPendente // Remove o ID temporário
      const result = await saveDespesaSupabase(despesaSemId, user.id)

      if (!result.id || result.error) {
        console.error("Falha ao salvar despesa:", result.error)
        toast.error(result.error || "Erro ao salvar despesa no banco de dados")
        return
      }

      // Usar o UUID retornado pelo Supabase
      const despesaSalva = {
        ...despesaPendente,
        id: result.id // UUID gerado pelo banco
      }

      // Salvar a despesa pendente no localStorage
      const despesasExistentes = JSON.parse(localStorage.getItem("despesas") || "[]")
      despesasExistentes.push(despesaSalva)
      localStorage.setItem("despesas", JSON.stringify(despesasExistentes))

      // Disparar evento de despesa salva
      window.dispatchEvent(new CustomEvent("despesaSalva", {
        detail: { obraId: obraId }
      }))

      // CRÍTICO: Recalcular avisos após confirmar despesa
      avisoAposCriarDespesa(obraId)

      // Verificar marcos de percentual (pós-save) — push notification
      checkAndShowPercentualNotifications({
        obraId,
        obraOrcamento: preCheckRef.current.obraOrcamento,
        totalGastoObraAntes: preCheckRef.current.totalGastoObraAntes,
        novoGastoObra: despesaPendente.valor
      })

      toast.success("Despesa salva com sucesso!")
      setBudgetAlert(null)
      setDespesaPendente(null)
      setSuccess(true)
    } catch (error) {
      console.error("Erro ao confirmar despesa:", error)
      toast.error("Erro ao salvar despesa. Tente novamente.")
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3">
      {/* Modal de Alerta de Orçamento */}
      {budgetAlert && (
        <BudgetAlertModal
          alert={budgetAlert}
          onConfirm={handleConfirmarDespesa}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header compacto */}
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-base font-bold text-white">Nova Despesa</h1>
        </div>

        {/* Notificações de marco de orçamento */}
        <BudgetMilestoneToast />

        {/* Mensagem de Sucesso */}
        {success && (
          <Card className="p-3 mb-2 bg-[#1f2228]/80 border border-white/[0.08] shadow-lg rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white leading-tight">Despesa salva com sucesso!</h3>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={limparFormulario}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium h-9 rounded-xl text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Nova despesa
              </Button>
              <Button
                onClick={() => goToObraDashboard(router, obraId)}
                className="flex-1 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 border border-white/[0.1] h-9 rounded-xl text-xs"
              >
                <Home className="w-3.5 h-3.5 mr-1" />
                Dashboard
              </Button>
            </div>
          </Card>
        )}

        {/* Formulário */}
        {!success && (
          <form onSubmit={handleSubmit}>
            <Card className="p-2 bg-[#1f2228]/80 border border-white/[0.08] shadow-lg rounded-xl space-y-1.5">
              {/* Data e Valor */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-10 shrink-0 flex items-center gap-0.5">
                    <Calendar className="w-3 h-3 text-[#7eaaee]" />
                    Data
                  </span>
                  <input
                    ref={primeiroInputRef}
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                    className="flex-1 min-w-0 h-8 text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg px-2 focus:outline-none focus:border-[#3B82F6] transition-colors [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-10 shrink-0 flex items-center gap-0.5">
                    <DollarSign className="w-3 h-3 text-[#7eaaee]" />
                    Valor
                  </span>
                  <div className="flex-1 min-w-0 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm font-medium">
                      R$
                    </span>
                    <Input
                      id="valor"
                      type="text"
                      placeholder="0,00"
                      value={valorFormatado}
                      onChange={handleValorChange}
                      required
                      className="h-8 w-full text-sm pl-9 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-0.5">
                <Label htmlFor="descricao" className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#7eaaee]" />
                  Descrição
                </Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Compra de cimento para fundação"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="h-9 text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors"
                />
              </div>

              {/* Categoria e Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label htmlFor="categoria" className="text-xs text-gray-400 font-medium">
                    Categoria *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger className="h-9 text-sm w-full bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-1 transition-colors [&>span]:text-[#F8FAFC] [&>svg]:text-[#94A3B8]">
                      <SelectValue placeholder="Selecione" className="text-[#64748B]" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-[10px]">
                      {CATEGORIAS.map((categoria) => (
                        <SelectItem
                          key={categoria.value}
                          value={categoria.value}
                          className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer"
                        >
                          {categoria.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-0.5">
                  <Label htmlFor="formaPagamento" className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-[#7eaaee]" />
                    Pagamento
                  </Label>
                  <Select
                    value={formData.formaPagamento}
                    onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}
                  >
                    <SelectTrigger className="h-9 text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-1 transition-colors [&>span]:text-[#F8FAFC] [&>svg]:text-[#94A3B8]">
                      <SelectValue placeholder="Selecione" className="text-[#64748B]" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-[10px]">
                      {FORMAS_PAGAMENTO.map((forma) => (
                        <SelectItem key={forma} value={forma} className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer">
                          {forma}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fornecedor */}
              <div className="space-y-0.5">
                <Label htmlFor="fornecedor" className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <User className="w-3 h-3 text-[#7eaaee]" />
                  Fornecedor (opcional)
                </Label>
                <Input
                  id="fornecedor"
                  placeholder="Ex: Loja de Materiais XYZ"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                  className="h-9 text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors"
                />
              </div>

              {/* Anexar Comprovante */}
              <FileUpload
                label="Comprovante"
                accept="image/jpeg,image/png,application/pdf"
                maxSize={10}
                value={comprovanteAnexo}
                onChange={(file, preview) => setComprovanteAnexo(preview)}
              />

              {/* Observações */}
              <div className="space-y-0.5">
                <Label htmlFor="observacoes" className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-[#7eaaee]" />
                  Observações (opcional)
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={2}
                  className="text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-1.5 border-t border-white/10">
                <Button
                  type="button"
                  onClick={() => router.push("/dashboard/despesas")}
                  className="flex-1 h-9 bg-[#1f2228] hover:bg-[#2a2d35] text-gray-300 border border-white/[0.1] rounded-xl text-sm"
                  disabled={loading}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl text-sm"
                  disabled={loading}
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </Card>
          </form>
        )}
      </div>
    </div>
  )
}
