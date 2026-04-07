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
import { avisoAposEditarDespesa } from "@/lib/alert-manager"
import Image from "next/image"
import { toast } from "sonner"

const TIPOS = [
  "Material",
  "Mão de obra",
  "Serviço",
  "Taxas/Documentação",
  "Transporte",
  "Outros"
]

const CATEGORIAS: { [key: string]: string[] } = {
  "Material": [
    "Cimento",
    "Areia",
    "Tijolo",
    "Ferragens",
    "Madeira",
    "Revestimento",
    "Piso",
    "Azulejo",
    "Tinta",
    "Elétrica",
    "Hidráulica",
    "Portas e Janelas",
    "Outros materiais"
  ],
  "Mão de obra": [
    "Pedreiro",
    "Eletricista",
    "Encanador",
    "Pintor",
    "Carpinteiro",
    "Gesseiro",
    "Azulejista",
    "Servente",
    "Outros profissionais"
  ],
  "Serviço": [
    "Projeto arquitetônico",
    "Projeto elétrico",
    "Projeto hidráulico",
    "Terraplanagem",
    "Demolição",
    "Limpeza",
    "Outros serviços"
  ],
  "Taxas/Documentação": [
    "Alvará",
    "Licenças",
    "Taxas municipais",
    "Documentação",
    "Outros"
  ],
  "Transporte": [
    "Frete",
    "Transporte de materiais",
    "Combustível",
    "Outros"
  ],
  "Outros": [
    "Diversos"
  ]
}

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
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    data: "",
    tipo: "",
    categoria: "",
    descricao: "",
    valor: "",
    formaPagamento: "",
    fornecedor: "",
    observacoes: ""
  })

  useEffect(() => {
    // Verificar autenticação
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Carregar despesa
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")
    const despesa = todasDespesas.find((d: any) => d.id === despesaId)
    
    if (!despesa) {
      toast.error("Despesa não encontrada")
      router.push("/dashboard/despesas")
      return
    }

    // Preencher formulário
    setFormData({
      data: despesa.data,
      tipo: despesa.tipo,
      categoria: despesa.categoria,
      descricao: despesa.descricao,
      valor: despesa.valor.toString(),
      formaPagamento: despesa.formaPagamento,
      fornecedor: despesa.fornecedor || "",
      observacoes: despesa.observacoes || ""
    })

    // Formatar valor para exibição
    const valorEmCentavos = numeroParaMoedaFormatada(despesa.valor)
    setValorFormatado(formatarMoeda(valorEmCentavos))

    setCarregando(false)
  }, [despesaId, router])

  // Atualizar categorias quando tipo mudar
  useEffect(() => {
    if (formData.tipo) {
      setCategoriasDisponiveis(CATEGORIAS[formData.tipo] || [])
    }
  }, [formData.tipo])

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
        toast.error("Por favor, preencha todos os campos obrigatórios")
        setLoading(false)
        return
      }

      // Atualizar despesa
      const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")
      const index = todasDespesas.findIndex((d: any) => d.id === despesaId)
      
      if (index !== -1) {
        todasDespesas[index] = {
          ...todasDespesas[index],
          data: formData.data,
          tipo: formData.tipo,
          categoria: formData.categoria,
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          formaPagamento: formData.formaPagamento,
          fornecedor: formData.fornecedor || undefined,
          observacoes: formData.observacoes || undefined
        }

        localStorage.setItem("despesas", JSON.stringify(todasDespesas))

        // CRÍTICO: Recalcular avisos após editar despesa
        const obraIdDaDespesa = todasDespesas[index].obraId
        if (obraIdDaDespesa) {
          avisoAposEditarDespesa(obraIdDaDespesa)
        }

        toast.success("Despesa atualizada com sucesso!")

        setTimeout(() => {
          router.push("/dashboard/despesas")
        }, 800)
      }

    } catch (error) {
      console.error("Erro ao atualizar despesa:", error)
      toast.error("Erro ao atualizar despesa. Tente novamente.")
      setLoading(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Editar Despesa
            </h1>
            <p className="text-base text-gray-400">
              Atualize os dados da despesa
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <Card className="p-8 bg-[#1f2228]/80 border border-white/[0.08] shadow-lg rounded-2xl space-y-8">
            {/* Data e Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Data */}
              <div className="space-y-3">
                <Label htmlFor="data" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#7eaaee]" />
                  Data *
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                  className="h-12 bg-[#13151a]/80 border-white/[0.1] text-white rounded-xl focus:border-[#0B3064] focus:ring-[#0B3064]"
                />
              </div>

              {/* Tipo */}
              <div className="space-y-3">
                <Label htmlFor="tipo" className="text-sm text-gray-300 font-medium">
                  Tipo *
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  required
                >
                  <SelectTrigger className="h-12 bg-[#13151a]/80 border-white/[0.1] text-white rounded-xl focus:border-[#0B3064] focus:ring-[#0B3064]">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f2228] border-white/[0.1]">
                    {TIPOS.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-3">
              <Label htmlFor="categoria" className="text-sm text-gray-300 font-medium">
                Categoria
              </Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                disabled={!formData.tipo}
              >
                <SelectTrigger className="h-12 bg-[#13151a]/80 border-white/[0.1] text-white rounded-xl focus:border-[#0B3064] focus:ring-[#0B3064]">
                  <SelectValue placeholder={formData.tipo ? "Selecione a categoria" : "Selecione o tipo primeiro"} />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2228] border-white/[0.1]">
                  {categoriasDisponiveis.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-3">
              <Label htmlFor="descricao" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#7eaaee]" />
                Descrição
              </Label>
              <Input
                id="descricao"
                placeholder="Ex: Compra de cimento para fundação"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="h-12 bg-[#13151a]/80 border-white/[0.1] text-white placeholder:text-gray-500 rounded-xl focus:border-[#0B3064] focus:ring-[#0B3064]"
              />
            </div>

            {/* Valor e Forma de Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Valor */}
              <div className="space-y-3">
                <Label htmlFor="valor" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#7eaaee]" />
                  Valor *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    R$
                  </span>
                  <Input
                    id="valor"
                    type="text"
                    placeholder="0,00"
                    value={valorFormatado}
                    onChange={handleValorChange}
                    required
                    className="h-12 pl-14 bg-[#13151a]/80 border-white/[0.1] text-white placeholder:text-gray-500 rounded-xl focus:border-[#0B3064] focus:ring-[#0B3064]"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-3">
                <Label htmlFor="formaPagamento" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#7eaaee]" />
                  Forma de Pagamento
                </Label>
                <Select
                  value={formData.formaPagamento}
                  onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}
                >
                  <SelectTrigger className="h-12 bg-[#13151a]/80 border-white/[0.1] text-white rounded-xl focus:border-[#0B3064] focus:ring-[#0B3064]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f2228] border-white/[0.1]">
                    {FORMAS_PAGAMENTO.map((forma) => (
                      <SelectItem key={forma} value={forma}>
                        {forma}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fornecedor */}
            <div className="space-y-3">
              <Label htmlFor="fornecedor" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-[#7eaaee]" />
                Fornecedor/Profissional (opcional)
              </Label>
              <Input
                id="fornecedor"
                placeholder="Ex: João Pedreiro, Loja de Materiais XYZ"
                value={formData.fornecedor}
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                className="h-12 bg-[#13151a]/80 border-white/[0.1] text-white placeholder:text-gray-500 rounded-xl focus:border-[#0B3064] focus:ring-[#0B3064]"
              />
            </div>

            {/* Observações */}
            <div className="space-y-3">
              <Label htmlFor="observacoes" className="text-sm text-gray-300 font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#7eaaee]" />
                Observações (opcional)
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre esta despesa..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={4}
                className="bg-[#13151a]/80 border-white/[0.1] text-white placeholder:text-gray-500 rounded-xl focus:border-[#0B3064] focus:ring-[#0B3064] resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
              <Button
                type="button"
                onClick={() => router.push("/dashboard/despesas")}
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
