"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Save, X, Calendar, DollarSign, FileText, CreditCard, User, MessageSquare } from "lucide-react"
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
import { toast } from "sonner"
import { getAllCategorias, addCustomCategoria } from "@/lib/despesa-categorias"
import { uploadComprovante } from "@/lib/upload-comprovante"

const FORMAS_PAGAMENTO = [
  "Pix",
  "Dinheiro",
  "Cartão",
  "Boleto",
  "Transferência"
]

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

const numeroParaMoedaFormatada = (valor: number): string => {
  return (valor * 100).toString().replace(/\D/g, "")
}

export default function EditarDespesaPage() {
  const router = useRouter()
  const params = useParams()
  const despesaId = params?.id as string

  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [valorFormatado, setValorFormatado] = useState("")
  const [comprovanteAnexo, setComprovanteAnexo] = useState<string | null>(null)
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null)
  const [budgetAlert, setBudgetAlert] = useState<BudgetAlert | null>(null)
  const [despesaPendente, setDespesaPendente] = useState<any>(null)
  const [obraId, setObraId] = useState("")
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState(() => getAllCategorias())
  const [showNovaCategoria, setShowNovaCategoria] = useState(false)
  const [novaCategoriaLabel, setNovaCategoriaLabel] = useState("")

  const handleCriarCategoria = () => {
    const criada = addCustomCategoria(novaCategoriaLabel)
    if (!criada) {
      toast.error("Informe um nome válido para a categoria")
      return
    }
    setCategoriasDisponiveis(getAllCategorias())
    setFormData((prev) => ({ ...prev, tipo: criada.value }))
    setShowNovaCategoria(false)
    setNovaCategoriaLabel("")
    toast.success(`Categoria "${criada.label}" criada!`)
  }

  const [formData, setFormData] = useState({
    data: "",
    tipo: "",
    descricao: "",
    valor: "",
    formaPagamento: "",
    fornecedor: "",
    observacoes: ""
  })

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

        // Salvar obraId
        setObraId(activeObraId)

        // Carregar despesas do Supabase
        const { getDespesasSupabase } = await import("@/lib/storage")
        const despesasSupabase = await getDespesasSupabase(activeObraId, user.id)

        // Encontrar a despesa específica
        const despesa = despesasSupabase.find((d: any) => d.id === despesaId)

        if (!despesa) {
          toast.error("Despesa não encontrada")
          router.push("/dashboard/despesas")
          return
        }

        // Preencher formulário
        setFormData({
          data: despesa.data,
          tipo: despesa.category || despesa.categoria || despesa.tipo || "",
          descricao: despesa.descricao || "",
          valor: despesa.valor.toString(),
          formaPagamento: despesa.formaPagamento || "",
          fornecedor: despesa.fornecedor || "",
          observacoes: despesa.observacoes || despesa.observacao || ""
        })

        // Carregar comprovante se houver
        if (despesa.anexo || despesa.comprovanteAnexo) {
          setComprovanteAnexo(despesa.anexo || despesa.comprovanteAnexo)
        }

        // Formatar valor para exibição
        const valorEmCentavos = numeroParaMoedaFormatada(despesa.valor)
        setValorFormatado(formatarMoeda(valorEmCentavos))

        setCarregando(false)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast.error("Erro ao carregar despesa")
        router.push("/dashboard/despesas")
      }
    }

    carregarDados()
  }, [despesaId, router])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarMoeda(valorDigitado)
    setValorFormatado(valorFormatado)

    const valorNumerico = removerFormatacao(valorFormatado)
    setFormData({ ...formData, valor: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações
      if (!formData.data || !formData.tipo || !formData.valor || parseFloat(formData.valor) <= 0) {
        toast.error("Por favor, preencha todos os campos obrigatórios (Data, Tipo e Valor)")
        setLoading(false)
        return
      }

      // Obter usuário autenticado
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Usuário não autenticado")
        setLoading(false)
        return
      }

      // Se o usuário anexou um novo arquivo, faz upload para o Storage e usa a URL pública.
      // Caso contrário, mantém o valor atual (URL do DB ou null).
      let anexoUrl: string | null = comprovanteAnexo
      if (comprovanteFile) {
        const upload = await uploadComprovante(comprovanteFile, user.id, "despesas")
        if (upload.error || !upload.url) {
          toast.error(upload.error || "Falha ao enviar comprovante. Tente novamente.")
          setLoading(false)
          return
        }
        anexoUrl = upload.url
        setComprovanteAnexo(upload.url)
        setComprovanteFile(null)
      }

      const despesaAtualizada = {
        data: formData.data,
        tipo: formData.tipo,
        category: formData.tipo,
        categoria: formData.tipo,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        formaPagamento: formData.formaPagamento,
        fornecedor: formData.fornecedor || undefined,
        observacoes: formData.observacoes || undefined,
        observacao: formData.observacoes || undefined,
        anexo: anexoUrl
      }

      // Atualizar no Supabase
      const { updateDespesaSupabase } = await import("@/lib/storage")
      const resultado = await updateDespesaSupabase(despesaId, despesaAtualizada, user.id)

      if (!resultado.success) {
        toast.error(resultado.error || "Erro ao atualizar despesa")
        setLoading(false)
        return
      }

      // Disparar evento de atualização
      window.dispatchEvent(new CustomEvent("despesaAtualizada"))

      // Mostrar mensagem de sucesso
      toast.success("Despesa atualizada com sucesso!")

      // Redirecionar para detalhes da despesa
      setTimeout(() => {
        router.push(`/dashboard/despesas/${despesaId}`)
      }, 800)

    } catch (error) {
      console.error("Erro ao atualizar despesa:", error)
      toast.error("Erro ao atualizar despesa. Tente novamente.")
      setLoading(false)
    }
  }

  const handleConfirmarDespesa = async () => {
    if (!despesaPendente) return

    try {
      // Obter usuário autenticado
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Usuário não autenticado")
        return
      }

      // Atualizar no Supabase
      const { updateDespesaSupabase } = await import("@/lib/storage")
      const resultado = await updateDespesaSupabase(despesaId, despesaPendente, user.id)

      if (!resultado.success) {
        toast.error(resultado.error || "Erro ao atualizar despesa")
        return
      }

      // Disparar evento de atualização
      window.dispatchEvent(new CustomEvent("despesaAtualizada"))

      toast.success("Despesa atualizada com sucesso!")
      setBudgetAlert(null)
      setDespesaPendente(null)

      setTimeout(() => {
        router.push(`/dashboard/despesas/${despesaId}`)
      }, 800)
    } catch (error) {
      console.error("Erro ao confirmar despesa:", error)
      toast.error("Erro ao atualizar despesa")
    }
  }

  if (carregando) {
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
    <div className="min-h-screen bg-[#0a0a0a] p-3">
      {budgetAlert && (
        <BudgetAlertModal alert={budgetAlert} onConfirm={handleConfirmarDespesa} />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header compacto */}
        <div className="mb-3">
          <h1 className="text-base font-bold text-white">Editar Despesa</h1>
        </div>

        {/* Formulário */}
        <form id="form-editar-despesa" onSubmit={handleSubmit}>
          <Card className="p-4 bg-[#0d1320] border border-white/[0.08] rounded-xl space-y-3">
            {/* Data e Valor */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 min-w-0">
                <Label htmlFor="data" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#7eaaee]" />
                  Data *
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                  className="h-9 w-full text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <Label htmlFor="valor" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#7eaaee]" />
                  Valor *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] font-medium">R$</span>
                  <Input
                    id="valor"
                    type="text"
                    placeholder="0,00"
                    value={valorFormatado}
                    onChange={handleValorChange}
                    required
                    className="h-9 w-full pl-9 text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <Label htmlFor="descricao" className="text-xs text-gray-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#7eaaee]" />
                Descrição
              </Label>
              <Input
                id="descricao"
                placeholder="Ex: Compra de cimento para fundação"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="h-9 text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors"
              />
            </div>

            {/* Categoria e Forma de Pagamento */}
            <div className="flex items-start">
              <div className="space-y-1 flex-1">
                <Label htmlFor="categoria" className="text-xs text-gray-400">Categoria *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => {
                    if (value === "__nova__") {
                      setShowNovaCategoria(true)
                      return
                    }
                    setFormData({ ...formData, tipo: value })
                  }}
                  required
                >
                  <SelectTrigger className="h-9 text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] [&>span]:text-[#F8FAFC] [&>svg]:text-[#94A3B8]">
                    <SelectValue placeholder="Selecione" className="text-[#64748B]" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-lg">
                    {categoriasDisponiveis.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value} className="text-[#E5E7EB] focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer text-sm">
                        {tipo.label}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="__nova__"
                      className="text-[#7eaaee] focus:bg-[#2563EB] focus:text-white cursor-pointer text-sm border-t border-white/10 mt-1"
                    >
                      + Criar nova categoria
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="shrink-0 w-6" />
              <div className="space-y-1 flex-1">
                <Label htmlFor="formaPagamento" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#7eaaee]" />
                  Pagamento
                </Label>
                <Select value={formData.formaPagamento} onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}>
                  <SelectTrigger className="h-9 text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] [&>span]:text-[#F8FAFC] [&>svg]:text-[#94A3B8]">
                    <SelectValue placeholder="Selecione" className="text-[#64748B]" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-lg">
                    {FORMAS_PAGAMENTO.map((forma) => (
                      <SelectItem key={forma} value={forma} className="text-[#E5E7EB] focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer text-sm">
                        {forma}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showNovaCategoria && (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  placeholder="Nome da nova categoria"
                  value={novaCategoriaLabel}
                  onChange={(e) => setNovaCategoriaLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleCriarCategoria()
                    }
                  }}
                  className="flex-1 h-9 text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg"
                />
                <Button
                  type="button"
                  onClick={handleCriarCategoria}
                  className="h-9 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shrink-0"
                >
                  Criar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowNovaCategoria(false)
                    setNovaCategoriaLabel("")
                  }}
                  className="h-9 px-3 text-xs bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 border border-white/[0.1] rounded-lg shrink-0"
                >
                  Cancelar
                </Button>
              </div>
            )}

            {/* Fornecedor */}
            <div className="space-y-1">
              <Label htmlFor="fornecedor" className="text-xs text-gray-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#7eaaee]" />
                Fornecedor (opcional)
              </Label>
              <Input
                id="fornecedor"
                placeholder="Ex: Loja de Materiais XYZ"
                value={formData.fornecedor}
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                className="h-9 text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors"
              />
            </div>

            {/* Comprovante */}
            <FileUpload
              label="Anexar comprovante"
              accept="image/jpeg,image/png,application/pdf"
              maxSize={10}
              value={comprovanteAnexo}
              onChange={(file, preview) => {
                setComprovanteFile(file)
                setComprovanteAnexo(preview)
              }}
            />

            {/* Observações */}
            <div className="space-y-1">
              <Label htmlFor="observacoes" className="text-xs text-gray-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#7eaaee]" />
                Observações (opcional)
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={2}
                className="text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-1 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => router.push("/dashboard/despesas")}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 text-xs font-medium rounded-lg border border-slate-600/60 transition-all disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-[#0B3064] hover:bg-[#082551] text-white text-xs font-semibold rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {loading ? "Salvando..." : "Salvar despesa"}
              </button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
