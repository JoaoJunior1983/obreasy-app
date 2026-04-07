"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, X, User, DollarSign, MessageSquare, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/custom/FileUpload"
import { saveClienteSupabase, uploadFileToStorage } from "@/lib/storage"
import { toast } from "sonner"

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

export default function NovoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [obraId, setObraId] = useState("")
  const [userId, setUserId] = useState("")
  const [savedId, setSavedId] = useState<string | null>(null)
  const [valorFormatado, setValorFormatado] = useState("")
  const [contratoFile, setContratoFile] = useState<File | null>(null)
  const [contratoAnexo, setContratoAnexo] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    contratoValor: "",
    observacoes: ""
  })

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) { router.push("/login"); return }

    const activeObraId = localStorage.getItem("activeObraId")
    if (!activeObraId) { router.push("/obras"); return }

    setObraId(activeObraId)

    const loadUser = async () => {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    loadUser()
  }, [router])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarMoeda(e.target.value)
    setValorFormatado(formatted)
    const num = removerFormatacao(formatted)
    setFormData(prev => ({ ...prev, contratoValor: num > 0 ? num.toString() : "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) {
      toast.error("Informe o nome do cliente")
      return
    }

    setLoading(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      let contratoUrl: string | null = null
      if (contratoFile) {
        const ts = Date.now()
        const ext = contratoFile.name.split(".").pop()
        contratoUrl = await uploadFileToStorage(contratoFile, "comprovantes", `${user.id}/${obraId}/contratos/${ts}.${ext}`)
      }

      const id = await saveClienteSupabase(
        {
          obraId,
          nome: formData.nome.trim(),
          contratoValor: formData.contratoValor ? parseFloat(formData.contratoValor) : null,
          contratoUrl,
          observacoes: formData.observacoes.trim() || null
        },
        user.id
      )

      if (!id) {
        toast.error("Erro ao salvar cliente")
        setLoading(false)
        return
      }

      setSavedId(id)
    } catch {
      toast.error("Erro ao salvar cliente. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (savedId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-3 flex items-start justify-center">
        <div className="max-w-sm w-full mt-8">
          <Card className="p-4 bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl text-center">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-white mb-1">Cliente cadastrado!</p>
            <p className="text-xs text-gray-400 mb-4">Agora você pode registrar recebimentos para este cliente.</p>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/dashboard/clientes/${savedId}`)}
                className="flex-1 h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-xl"
              >
                Ver cliente
              </Button>
              <Button
                onClick={() => router.push("/dashboard/obra/extrato-recebimentos")}
                className="flex-1 h-9 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 border border-white/[0.1] rounded-xl text-xs"
              >
                Ver todos
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-base font-bold text-white">Novo Cliente</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-2 bg-[#1f2228]/80 border border-white/[0.08] shadow-lg rounded-xl space-y-1.5">
            {/* Nome */}
            <div className="space-y-0.5">
              <Label className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <User className="w-3 h-3 text-[#7eaaee]" />
                Nome do cliente *
              </Label>
              <Input
                placeholder="Ex: João Silva"
                value={formData.nome}
                onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
                className="h-9 text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors"
              />
            </div>

            {/* Valor do contrato */}
            <div className="space-y-0.5">
              <Label className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-[#7eaaee]" />
                Valor do contrato (opcional)
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm font-medium">R$</span>
                <Input
                  type="text"
                  placeholder="0,00"
                  value={valorFormatado}
                  onChange={handleValorChange}
                  className="h-9 text-sm pl-9 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors"
                />
              </div>
            </div>

            {/* Contrato */}
            <FileUpload
              label="Anexar contrato (opcional)"
              accept="image/*,application/pdf,.doc,.docx"
              maxSize={10}
              value={contratoAnexo}
              onChange={(file, preview) => { setContratoFile(file); setContratoAnexo(preview) }}
            />

            {/* Observações */}
            <div className="space-y-0.5">
              <Label className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-[#7eaaee]" />
                Observações (opcional)
              </Label>
              <Textarea
                placeholder="Informações adicionais sobre o cliente..."
                value={formData.observacoes}
                onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={2}
                className="text-sm bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] transition-colors resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-1.5 border-t border-white/10">
              <Button
                type="button"
                onClick={() => router.push("/dashboard/obra/extrato-recebimentos")}
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
      </div>
    </div>
  )
}
