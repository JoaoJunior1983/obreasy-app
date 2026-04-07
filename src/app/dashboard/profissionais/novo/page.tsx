"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, X, User, Briefcase, Phone, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { toast } from "sonner"

const FUNCOES = [
  "Pedreiro",
  "Eletricista",
  "Encanador",
  "Azulejista",
  "Pintor",
  "Gesseiro",
  "Marceneiro",
  "Engenheiro",
  "Arquiteto",
  "Outros"
]

// Função para formatar telefone brasileiro
const formatarTelefone = (valor: string): string => {
  // Remove tudo que não é dígito
  const apenasNumeros = valor.replace(/\D/g, "")

  // Aplica a máscara (00) 00000-0000
  if (apenasNumeros.length <= 2) {
    return apenasNumeros
  } else if (apenasNumeros.length <= 7) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`
  } else if (apenasNumeros.length <= 11) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`
  } else {
    // Limita a 11 dígitos
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`
  }
}

export default function NovoProfissionalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [obraId, setObraId] = useState("")
  const [showContratoModal, setShowContratoModal] = useState(false)
  const [profissionalCriado, setProfissionalCriado] = useState<any>(null)

  const [formData, setFormData] = useState({
    nome: "",
    funcao: "Pedreiro", // Valor padrão
    telefone: "",
    observacoes: ""
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar autenticação no Supabase
        const { supabase } = await import("@/lib/supabase")
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push("/login")
          return
        }

        // USAR activeObraId para garantir que está trabalhando na obra correta
        const activeObraId = localStorage.getItem("activeObraId")

        if (activeObraId) {
          setObraId(activeObraId)
        } else {
          // Se não há obra ativa, buscar obras do usuário no Supabase
          const { data: obras, error: obrasError } = await supabase
            .from("obras")
            .select("*")
            .eq("user_id", user.id)
            .order("criada_em", { ascending: false })

          if (obrasError) {
            console.error("Erro ao carregar obras:", obrasError)
            router.push("/dashboard/criar-obra")
            return
          }

          if (obras && obras.length > 0) {
            const obraMaisRecente = obras[0] as any
            setObraId(obraMaisRecente.id)
            localStorage.setItem("activeObraId", obraMaisRecente.id)
            window.dispatchEvent(new Event("obraAtualizada"))
          } else {
            router.push("/dashboard/criar-obra")
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarTelefone(e.target.value)
    setFormData({ ...formData, telefone: valorFormatado })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.nome || !formData.funcao) {
        alert("Por favor, preencha o nome e a função do profissional")
        setLoading(false)
        return
      }

      // Verificar autenticação
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        toast.error("Erro de autenticação. Faça login novamente.")
        router.push("/login")
        return
      }

      // NUNCA gerar ID temporário - Supabase gera automaticamente o UUID
      const profissional = {
        // NÃO incluir 'id' - será gerado pelo Supabase
        obraId: obraId,
        nome: formData.nome,
        funcao: formData.funcao,
        telefone: formData.telefone || undefined,
        observacoes: formData.observacoes || undefined,
        pagamentos: [],
        extras: []
      }

      console.log("[CADASTRO] Salvando profissional no Supabase (sem ID temporário)...")

      // Salvar no Supabase
      const { saveProfissionalSupabase } = await import("@/lib/storage")
      const savedId = await saveProfissionalSupabase(profissional, user.id)

      if (!savedId) {
        console.error("[CADASTRO] Falha ao salvar - UUID não retornado")
        toast.error("Erro ao salvar profissional no banco de dados")
        setLoading(false)
        return
      }

      console.log("[CADASTRO] Profissional salvo com UUID real:", savedId)

      // CRÍTICO: Usar APENAS o UUID retornado pelo Supabase
      const profissionalSalvo = {
        ...profissional,
        id: savedId // UUID gerado pelo banco
      }

      // Manter no localStorage para compatibilidade (será removido futuramente)
      const profissionaisExistentes = JSON.parse(localStorage.getItem("profissionais") || "[]")
      profissionaisExistentes.push(profissionalSalvo)
      localStorage.setItem("profissionais", JSON.stringify(profissionaisExistentes))

      // Disparar evento personalizado para notificar outros componentes
      window.dispatchEvent(new Event("profissionalCadastrado"))

      toast.success("Profissional cadastrado com sucesso!")

      console.log("[CADASTRO] Profissional cadastrado e pronto para uso. UUID:", savedId)

      // IMPORTANTE: Usar profissionalSalvo (com UUID) para modal e navegação
      setProfissionalCriado(profissionalSalvo)
      setShowContratoModal(true)
      setLoading(false)

    } catch (error) {
      console.error("Erro ao salvar profissional:", error)
      toast.error("Erro ao salvar profissional. Tente novamente.")
      setLoading(false)
    }
  }

  const handleDefinirContrato = () => {
    if (profissionalCriado && profissionalCriado.id) {
      console.log("[NAVEGAÇÃO] Redirecionando para definir contrato. UUID:", profissionalCriado.id)
      // Redirecionar para a página do profissional com flag para abrir contrato
      router.push(`/dashboard/profissionais/${profissionalCriado.id}?openContrato=true`)
    } else {
      console.error("[NAVEGAÇÃO] Profissional sem ID válido:", profissionalCriado)
      toast.error("Erro ao navegar. Recarregue a página.")
    }
  }

  const handleDepois = () => {
    setShowContratoModal(false)
    // Navegar DIRETAMENTE para a obra, sem passar pelo dashboard
    router.push("/dashboard/obra")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-2 sm:p-3">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-0.5">
              Novo Profissional
            </h1>
            <p className="text-xs text-gray-400">
              Cadastre um novo profissional da obra
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <Card className="p-3 bg-[#1f2228]/80 border border-white/[0.08] shadow-lg rounded-2xl space-y-3">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#7eaaee]" />
                Nome do Profissional *
              </Label>
              <Input
                id="nome"
                placeholder="Ex: João Silva"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="h-9 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-[10px] hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors text-sm"
              />
            </div>

            {/* Função */}
            <div className="space-y-1.5">
              <Label htmlFor="funcao" className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#7eaaee]" />
                Função *
              </Label>
              <Select
                value={formData.funcao}
                onValueChange={(value) => setFormData({ ...formData, funcao: value })}
                required
              >
                <SelectTrigger className="h-9 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-[10px] hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors data-[state=open]:border-[#3B82F6] data-[state=open]:ring-2 data-[state=open]:ring-[#3B82F680] [&>span]:text-[#F8FAFC] [&>svg]:text-[#94A3B8] hover:[&>svg]:text-[#3B82F6] text-sm">
                  <SelectValue placeholder="Selecione a função" className="text-[#64748B]" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-[10px]">
                  {FUNCOES.map((funcao) => (
                    <SelectItem key={funcao} value={funcao} className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer text-sm">
                      {funcao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-1.5">
              <Label htmlFor="telefone" className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#7eaaee]" />
                Telefone / WhatsApp (opcional)
              </Label>
              <Input
                id="telefone"
                type="text"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={handleTelefoneChange}
                maxLength={15}
                className="h-9 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-[10px] hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors text-sm"
              />
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#7eaaee]" />
                Observações (opcional)
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre o profissional..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-[10px] hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors resize-none text-sm"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                onClick={() => router.back()}
                className="flex-1 h-9 bg-[#1f2228] hover:bg-[#2a2d35] text-gray-300 border-2 border-white/[0.1] rounded-xl shadow-md text-sm"
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg text-sm"
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Salvar profissional"}
              </Button>
            </div>
          </Card>
        </form>

        {/* Modal de Confirmação de Contrato */}
        {showContratoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1f2228] rounded-xl shadow-2xl border border-white/[0.1] p-5 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200">
              {/* Ícone e Título */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Profissional cadastrado!
                </h3>
              </div>

              {/* Subtítulo */}
              <p className="text-sm text-gray-300 mb-1 ml-13">
                Deseja definir o contrato agora?
              </p>

              {/* Microtexto informativo */}
              <p className="text-xs text-gray-400 mb-5 ml-13">
                A maioria dos usuários define o contrato neste momento para facilitar o controle financeiro.
              </p>

              {/* Botões na mesma linha */}
              <div className="flex gap-2.5">
                {/* Botão secundário - Depois */}
                <Button
                  onClick={handleDepois}
                  variant="outline"
                  className="flex-1 h-10 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-200 border-white/[0.1] rounded-lg transition-colors text-sm"
                >
                  Depois
                </Button>

                {/* Botão principal - Definir agora */}
                <Button
                  onClick={handleDefinirContrato}
                  className="flex-1 h-10 bg-[#0B3064] hover:bg-[#082551] text-white font-semibold rounded-lg shadow-md transition-colors text-sm"
                >
                  Definir agora
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
