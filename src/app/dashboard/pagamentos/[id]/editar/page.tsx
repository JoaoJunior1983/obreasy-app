"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Save, X, Calendar, DollarSign, CreditCard, MessageSquare, FileText } from "lucide-react"
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
import { type BudgetAlert } from "@/lib/budget-alerts"
import { getDataHoje } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"

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

const numeroParaFormatado = (valor: number): string => {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export default function EditarPagamentoPage() {
  const router = useRouter()
  const params = useParams()
  const pagamentoId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingPagamento, setLoadingPagamento] = useState(true)
  const [obraId, setObraId] = useState("")
  const [valorFormatado, setValorFormatado] = useState("")
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [comprovanteAnexo, setComprovanteAnexo] = useState<string | null>(null)
  const [pagamentoOriginal, setPagamentoOriginal] = useState<Pagamento | null>(null)
  const primeiroInputRef = useRef<HTMLInputElement>(null)
  const [budgetAlert, setBudgetAlert] = useState<BudgetAlert | null>(null)
  const [pagamentoPendente, setPagamentoPendente] = useState<any>(null)

  const [formData, setFormData] = useState({
    data: getDataHoje(),
    profissionalId: "",
    valor: "",
    formaPagamento: "Pix",
    observacao: ""
  })

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

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

    // Carregar dados do pagamento
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")
    const pagamento = todasDespesas.find((d: Pagamento) => d.id === pagamentoId)

    if (!pagamento) {
      toast.error("Pagamento não encontrado")
      router.push("/dashboard/obra")
      return
    }

    setPagamentoOriginal(pagamento)

    // Preencher formulário com dados do pagamento
    const profId = pagamento.profissionalId || pagamento.professionalId || ""
    const obs = pagamento.observacao || pagamento.observacoes || ""

    setFormData({
      data: pagamento.data,
      profissionalId: profId,
      valor: pagamento.valor.toString(),
      formaPagamento: pagamento.formaPagamento || "Pix",
      observacao: obs
    })

    setValorFormatado(numeroParaFormatado(pagamento.valor))
    setComprovanteAnexo(pagamento.anexo || null)
    setLoadingPagamento(false)
  }, [router, pagamentoId])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarMoeda(valorDigitado)
    setValorFormatado(valorFormatado)

    const valorNumerico = removerFormatacao(valorFormatado)
    setFormData({ ...formData, valor: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const handleVoltar = () => {
    if (pagamentoOriginal) {
      router.push(`/dashboard/profissionais/${pagamentoOriginal.profissionalId || pagamentoOriginal.professionalId}/pagamentos`)
    } else {
      router.push("/dashboard/obra")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.data || !formData.profissionalId || !formData.valor || parseFloat(formData.valor) <= 0) {
        toast.error("Por favor, preencha todos os campos obrigatórios (Data, Profissional e Valor)")
        setLoading(false)
        return
      }

      // VALIDAÇÃO CRÍTICA: Validar UUIDs antes de salvar
      const { isValidUUID } = await import("@/lib/storage")

      console.log("[EDIÇÃO] Validando UUIDs...")
      console.log("[EDIÇÃO] pagamento_id:", pagamentoId)
      console.log("[EDIÇÃO] obra_id:", obraId)
      console.log("[EDIÇÃO] profissional_id:", formData.profissionalId)

      if (!isValidUUID(pagamentoId)) {
        console.error("[EDIÇÃO] UUID do pagamento inválido:", pagamentoId)
        toast.error("ID do pagamento inválido. Recarregue a página.")
        setLoading(false)
        return
      }

      if (!isValidUUID(obraId)) {
        console.error("[EDIÇÃO] UUID da obra inválido:", obraId)
        toast.error("ID da obra inválido. Recarregue a página.")
        setLoading(false)
        return
      }

      if (!isValidUUID(formData.profissionalId)) {
        console.error("[EDIÇÃO] UUID do profissional inválido:", formData.profissionalId)
        const profissional = profissionais.find(p => p.id === formData.profissionalId)
        toast.error(`⚠️ Este profissional (${profissional?.nome || 'desconhecido'}) foi criado em uma versão antiga. Recadastre o profissional para continuar.`, {
          duration: 6000
        })
        setLoading(false)
        return
      }

      console.log("[EDIÇÃO] Validação de UUIDs OK")

      // Buscar nome do profissional
      const profissional = profissionais.find(p => p.id === formData.profissionalId)
      const nomeProfissional = profissional ? profissional.nome : "Profissional"

      const pagamentoAtualizado = {
        ...pagamentoOriginal,
        id: pagamentoId,
        obraId: obraId,
        data: formData.data,
        category: "mao_obra",
        categoria: "mao_obra",
        descricao: `Pagamento - ${nomeProfissional}`,
        valor: parseFloat(formData.valor),
        formaPagamento: formData.formaPagamento,
        profissionalId: formData.profissionalId,
        professionalId: formData.profissionalId,
        observacao: formData.observacao || undefined,
        observacoes: formData.observacao || undefined,
        anexo: comprovanteAnexo || undefined
      }

      // Verificar alerta de orçamento ANTES de salvar
      const despesasExistentes = JSON.parse(localStorage.getItem("despesas") || "[]")
      const index = despesasExistentes.findIndex((d: Pagamento) => d.id === pagamentoId)

      if (index !== -1) {
        const despesasExcluindoAtual = despesasExistentes.filter((_: any, i: number) => i !== index)

        const obras = JSON.parse(localStorage.getItem("obras") || "[]")
        const obraAtual = obras.find((o: any) => o.id === obraId)

        if (obraAtual && obraAtual.orcamento > 0) {
          const alert = checkBudgetAfterTransaction(
            obraId,
            pagamentoAtualizado,
            despesasExcluindoAtual,
            profissionais,
            obraAtual.orcamento
          )

          if (alert) {
            // Exibir modal de alerta e pausar o salvamento
            setPagamentoPendente({ ...pagamentoAtualizado, index })
            setBudgetAlert(alert)
            setLoading(false)
            return
          }
        }

        // Se não houver alerta, atualizar normalmente
        despesasExistentes[index] = pagamentoAtualizado
        localStorage.setItem("despesas", JSON.stringify(despesasExistentes))

        // Disparar evento de pagamento atualizado
        window.dispatchEvent(new CustomEvent("pagamentoAtualizado", {
          detail: { profissionalId: formData.profissionalId }
        }))

        toast.success("Pagamento atualizado com sucesso!")

        // Voltar para a página de pagamentos do profissional
        setTimeout(() => {
          router.push(`/dashboard/profissionais/${formData.profissionalId}/pagamentos`)
        }, 500)
      } else {
        toast.error("Erro ao atualizar pagamento")
        setLoading(false)
      }

    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error)
      toast.error("Erro ao atualizar pagamento. Tente novamente.")
      setLoading(false)
    }
  }

  const handleConfirmarPagamento = () => {
    if (!pagamentoPendente) return

    // Atualizar o pagamento pendente
    const despesasExistentes = JSON.parse(localStorage.getItem("despesas") || "[]")
    despesasExistentes[pagamentoPendente.index] = pagamentoPendente

    localStorage.setItem("despesas", JSON.stringify(despesasExistentes))

    // Disparar evento de pagamento atualizado
    window.dispatchEvent(new CustomEvent("pagamentoAtualizado", {
      detail: { profissionalId: pagamentoPendente.profissionalId }
    }))

    toast.success("Pagamento atualizado com sucesso!")
    setBudgetAlert(null)
    setPagamentoPendente(null)

    setTimeout(() => {
      router.push(`/dashboard/profissionais/${pagamentoPendente.profissionalId}/pagamentos`)
    }, 500)
  }

  if (loadingPagamento) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando pagamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-8">
      {/* Modal de Alerta de Orçamento */}
      {budgetAlert && (
        <BudgetAlertModal
          alert={budgetAlert}
          onConfirm={handleConfirmarPagamento}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Editar Pagamento
            </h1>
            <p className="text-base text-gray-400">
              Atualize as informações do pagamento
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <Card className="p-8 bg-[#1f2228]/80 border border-white/[0.08] shadow-lg rounded-2xl space-y-8">
            {/* Data e Profissional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="data" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#7eaaee]" />
                  Data *
                </Label>
                <Input
                  ref={primeiroInputRef}
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                  className="h-12 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-[10px] hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="profissional" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#7eaaee]" />
                  Profissional *
                </Label>
                <Select
                  value={formData.profissionalId}
                  onValueChange={(value) => setFormData({ ...formData, profissionalId: value })}
                  required
                  disabled
                >
                  <SelectTrigger className="h-12 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-[10px] hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors data-[state=open]:border-[#3B82F6] data-[state=open]:ring-2 data-[state=open]:ring-[#3B82F680] [&>span]:text-[#F8FAFC] [&>svg]:text-[#94A3B8] hover:[&>svg]:text-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed">
                    <SelectValue placeholder="Selecione um profissional" className="text-[#64748B]" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-[10px]">
                    {profissionais.map((profissional) => (
                      <SelectItem
                        key={profissional.id}
                        value={profissional.id}
                        className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer"
                      >
                        {profissional.nome} - {profissional.funcao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Valor e Forma de Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="valor" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#7eaaee]" />
                  Valor *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] font-medium">
                    R$
                  </span>
                  <Input
                    id="valor"
                    type="text"
                    placeholder="0,00"
                    value={valorFormatado}
                    onChange={handleValorChange}
                    required
                    className="h-12 pl-14 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-[10px] hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="formaPagamento" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#7eaaee]" />
                  Forma de Pagamento
                </Label>
                <Select
                  value={formData.formaPagamento}
                  onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}
                >
                  <SelectTrigger className="h-12 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-[10px] hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors data-[state=open]:border-[#3B82F6] data-[state=open]:ring-2 data-[state=open]:ring-[#3B82F680] [&>span]:text-[#F8FAFC] [&>svg]:text-[#94A3B8] hover:[&>svg]:text-[#3B82F6]">
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

            {/* Anexar Comprovante */}
            <FileUpload
              label="Anexar comprovante de pagamento"
              accept="image/jpeg,image/png,application/pdf"
              maxSize={10}
              value={comprovanteAnexo}
              onChange={(file, preview) => setComprovanteAnexo(preview)}
            />

            {/* Observações */}
            <div className="space-y-3">
              <Label htmlFor="observacao" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#7eaaee]" />
                Observações (opcional)
              </Label>
              <Textarea
                id="observacao"
                placeholder="Informações adicionais sobre este pagamento..."
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                rows={4}
                className="bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-[10px] hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
              <Button
                type="button"
                onClick={handleVoltar}
                className="flex-1 h-12 bg-[#1f2228] hover:bg-[#2a2d35] text-gray-300 border-2 border-white/[0.1] rounded-xl shadow-md"
                disabled={loading}
              >
                <X className="w-5 h-5 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg"
                disabled={loading}
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
