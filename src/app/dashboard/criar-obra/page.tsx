"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, Home, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { getUserProfile, saveClienteSupabase } from "@/lib/storage"
import { getPlanoAtual, PLANOS, type PlanoTipo } from "@/lib/plan"

const ESTADOS_BRASILEIROS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO"
]

// Função para formatar valor monetário brasileiro
const formatarMoeda = (valor: string): string => {
  // Remove tudo que não é dígito
  const apenasNumeros = valor.replace(/\D/g, "")
  
  if (!apenasNumeros) return ""
  
  // Converte para número e divide por 100 para ter os centavos
  const numero = parseFloat(apenasNumeros) / 100
  
  // Formata com separadores brasileiros
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Função para remover formatação e obter valor numérico
const removerFormatacao = (valorFormatado: string): number => {
  const apenasNumeros = valorFormatado.replace(/\D/g, "")
  return parseFloat(apenasNumeros) / 100
}

// Função para formatar área com máscara decimal automática
const formatarArea = (valor: string): string => {
  // Remove tudo que não é dígito
  const apenasNumeros = valor.replace(/\D/g, "")
  
  if (!apenasNumeros) return ""
  
  // Converte para número e divide por 100 para ter os centavos (2 casas decimais)
  const numero = parseFloat(apenasNumeros) / 100
  
  // Formata com separadores brasileiros (ponto para milhar, vírgula para decimal)
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Função para converter área formatada em número
const areaParaNumero = (areaFormatada: string): number => {
  // Remove tudo que não é dígito
  const apenasNumeros = areaFormatada.replace(/\D/g, "")
  if (!apenasNumeros) return 0
  // Divide por 100 para obter o valor decimal correto
  return parseFloat(apenasNumeros) / 100
}

export default function CriarObraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<"owner" | "builder" | null>(null)
  const [showProfissionalModal, setShowProfissionalModal] = useState(false)
  const [obraCriada, setObraCriada] = useState<any>(null)
  const [showBloqueioPlano, setShowBloqueioPlano] = useState(false)
  const [showNudgeUpgrade, setShowNudgeUpgrade] = useState(false)
  const [planoAtual, setPlanoAtual] = useState<PlanoTipo>("essencial")
  const [clientesList, setClientesList] = useState([{ nome: "" }])
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "construcao",
    area: "",
    estado: "SP",
    cidade: "",
    bairro: "",
    orcamento: "",
    dataInicio: "",
    dataTermino: ""
  })
  const [orcamentoFormatado, setOrcamentoFormatado] = useState("")
  const [areaFormatada, setAreaFormatada] = useState("")

  // Carregar perfil e verificar limite de obras ao montar o componente
  useEffect(() => {
    const profile = getUserProfile()
    setUserProfile(profile)
    setPlanoAtual(getPlanoAtual())

  }, [])

  const handleOrcamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarMoeda(valorDigitado)
    setOrcamentoFormatado(valorFormatado)
    
    // Salva o valor numérico sem formatação no formData
    const valorNumerico = removerFormatacao(valorFormatado)
    setFormData({ ...formData, orcamento: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarArea(valorDigitado)
    setAreaFormatada(valorFormatado)
    
    // Salva o valor numérico no formData
    const valorNumerico = areaParaNumero(valorFormatado)
    setFormData({ ...formData, area: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log("🚀 [CRIAR-OBRA] Iniciando criação de obra")
    console.log("📋 [CRIAR-OBRA] User Profile:", userProfile)
    console.log("📝 [CRIAR-OBRA] Form Data:", formData)

    try {
      // Validação condicional baseada no perfil
      if (userProfile === "builder") {
        console.log("👷 [CRIAR-OBRA] Validação para construtor")
        const clientesValidos = clientesList.filter(c => c.nome.trim())
        if (clientesValidos.length === 0 || !formData.tipo || !formData.area || !formData.estado || !formData.cidade || !formData.bairro) {
          console.log("❌ [CRIAR-OBRA] Validação falhou - campos obrigatórios ausentes")
          alert("Por favor, preencha o nome de ao menos 1 cliente e os demais campos obrigatórios")
          setLoading(false)
          return
        }
        console.log("✅ [CRIAR-OBRA] Validação passou")
      } else {
        console.log("🏠 [CRIAR-OBRA] Validação para dono de obra")
        // Para donos de obra: validação padrão (nome obrigatório)
        if (!formData.nome || !formData.tipo || !formData.area || !formData.estado || !formData.cidade || !formData.bairro) {
          console.log("❌ [CRIAR-OBRA] Validação falhou - campos obrigatórios ausentes")
          alert("Por favor, preencha todos os campos obrigatórios")
          setLoading(false)
          return
        }
        console.log("✅ [CRIAR-OBRA] Validação passou")
      }

      // Obter usuário autenticado do Supabase
      console.log("🔐 [CRIAR-OBRA] Verificando autenticação...")
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.log("❌ [CRIAR-OBRA] Erro de autenticação:", authError)
        alert("Usuário não autenticado. Faça login novamente.")
        router.push("/")
        return
      }

      console.log("✅ [CRIAR-OBRA] Usuário autenticado:", user.id)

      // Verificar limite de obras — apenas perfil "owner" tem limite de 1 obra
      if (userProfile === "owner") {
        const { data: obrasExistentes } = await supabase
          .from("obras")
          .select("id")
          .eq("user_id", user.id)
        if ((obrasExistentes ?? []).length >= 1) {
          setShowBloqueioPlano(true)
          setLoading(false)
          return
        }
      }

      // Determinar o nome final da obra
      let nomeFinalObra = formData.nome

      // Se for construtor e não preencheu o nome da obra, gerar automaticamente pelo(s) cliente(s)
      const clientesNomeados = clientesList.filter(c => c.nome.trim())
      const primeiroCliente = clientesNomeados[0]
      if (userProfile === "builder" && !formData.nome && primeiroCliente) {
        if (clientesNomeados.length === 1) {
          nomeFinalObra = primeiroCliente.nome.trim()
        } else if (clientesNomeados.length === 2) {
          nomeFinalObra = `${clientesNomeados[0].nome.trim()} e ${clientesNomeados[1].nome.trim()}`
        } else {
          nomeFinalObra = `${clientesNomeados[0].nome.trim()} (+${clientesNomeados.length - 1})`
        }
        console.log("📝 [CRIAR-OBRA] Nome da obra gerado automaticamente:", nomeFinalObra)
      } else {
        console.log("📝 [CRIAR-OBRA] Nome da obra:", nomeFinalObra)
      }

      // Determinar nome_cliente para salvar na obra (perfil builder)
      let nomeClienteObra: string | null = null
      if (userProfile === "builder" && clientesNomeados.length > 0) {
        if (clientesNomeados.length === 1) {
          nomeClienteObra = clientesNomeados[0].nome.trim()
        } else if (clientesNomeados.length === 2) {
          nomeClienteObra = `${clientesNomeados[0].nome.trim()} e ${clientesNomeados[1].nome.trim()}`
        } else {
          nomeClienteObra = `${clientesNomeados[0].nome.trim()} (+${clientesNomeados.length - 1})`
        }
      }

      // Criar objeto da obra para o Supabase
      const obraData: any = {
        user_id: user.id,
        nome: nomeFinalObra,
        tipo: formData.tipo,
        area: parseFloat(formData.area),
        localizacao: {
          estado: formData.estado,
          cidade: formData.cidade,
          bairro: formData.bairro
        },
        orcamento: formData.orcamento ? parseFloat(formData.orcamento) : null,
        data_inicio: formData.dataInicio || null,
        data_termino: formData.dataTermino || null,
        ...(nomeClienteObra && { nome_cliente: nomeClienteObra })
      }

      console.log("💾 [CRIAR-OBRA] Objeto da obra a ser salvo:", obraData)

      // Salvar no Supabase
      console.log("📤 [CRIAR-OBRA] Enviando para Supabase...")
      const { data: obraCriada, error: insertError } = (await (supabase as any)
        .from("obras")
        .insert([obraData])
        .select()
        .single()) as { data: any; error: any }

      if (insertError) {
        console.error("❌ [CRIAR-OBRA] Erro ao salvar obra no Supabase:", insertError)
        alert("Erro ao criar obra. Tente novamente.")
        setLoading(false)
        return
      }

      console.log("✅ [CRIAR-OBRA] Obra criada com sucesso:", obraCriada)

      // Salvar clientes na tabela clientes (perfil construtor)
      if (userProfile === "builder" && obraCriada) {
        for (const c of clientesList.filter(cl => cl.nome.trim())) {
          await saveClienteSupabase(
            { obraId: obraCriada.id, nome: c.nome.trim() },
            user.id
          )
        }
        console.log("✅ [CRIAR-OBRA] Clientes salvos")
      }

      // Definir a nova obra como ativa automaticamente
      if (obraCriada) {
        console.log("🎯 [CRIAR-OBRA] Definindo obra como ativa:", obraCriada.id)
        localStorage.setItem("activeObraId", obraCriada.id)
        window.dispatchEvent(new Event("obraAtualizada"))
        console.log("📢 [CRIAR-OBRA] Evento 'obraAtualizada' disparado")
      }

      // Salvar obra criada e mostrar modal
      console.log("🎉 [CRIAR-OBRA] Mostrando modal de cadastro de profissional")
      setObraCriada(obraCriada)
      setShowProfissionalModal(true)
      // Nudge de upgrade apenas para perfil owner (1 obra = limite atingido)
      if (getUserProfile() === "owner") {
        setTimeout(() => setShowNudgeUpgrade(true), 1200)
      }
      setLoading(false)

    } catch (error) {
      console.error("❌ [CRIAR-OBRA] Erro inesperado:", error)
      alert("Erro ao criar obra. Tente novamente.")
      setLoading(false)
    }
  }

  const marcarOrientacaoVista = () => {
    if (!obraCriada?.id) return
    const vistas = JSON.parse(localStorage.getItem("orientacoesVisualizadas") || "{}")
    vistas[obraCriada.id] = true
    localStorage.setItem("orientacoesVisualizadas", JSON.stringify(vistas))
  }

  const handleCadastrarProfissional = () => {
    marcarOrientacaoVista()
    router.push("/dashboard/profissionais/novo")
  }

  const handleDepois = () => {
    marcarOrientacaoVista()
    router.push("/dashboard/obra")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3 sm:p-6">

      {/* Modal: Bloqueio por limite do plano */}
      {showBloqueioPlano && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f2228] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-white/[0.1]">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-lg font-bold text-white text-center mb-2">Limite de obras atingido</h2>
            <p className="text-sm text-gray-400 text-center mb-1">
              Seu plano <span className="text-white font-semibold">Essencial</span> permite apenas{" "}
              <span className="text-white font-semibold">1 obra ativa</span>.
            </p>
            <p className="text-sm text-gray-400 text-center mb-6">
              Faça upgrade para o plano <span className="text-[#7eaaee] font-semibold">Profissional</span> e gerencie obras ilimitadas.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowBloqueioPlano(false)}
                className="flex-1 h-10 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 border border-white/[0.1] rounded-xl text-sm"
              >
                Voltar
              </Button>
              <Button
                onClick={() => router.push("/dashboard/plano")}
                className="flex-1 h-10 bg-[#0B3064] hover:bg-[#082551] text-white rounded-xl text-sm font-semibold"
              >
                Fazer upgrade
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nudge upgrade após criar primeira obra */}
      {showNudgeUpgrade && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[60] p-4">
          <div className="bg-[#1f2228] rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-[#0B3064]/40">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-[#0B3064]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🚀</span>
              </div>
              <button onClick={() => setShowNudgeUpgrade(false)} className="text-gray-500 hover:text-gray-300 ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Seu plano atual permite 1 obra</h3>
            <p className="text-sm text-gray-400 mb-4">
              Faça upgrade para o plano <span className="text-[#7eaaee] font-semibold">Profissional</span> e libere obras ilimitadas, gestão completa e recursos exclusivos.
            </p>
            <Button
              onClick={() => { setShowNudgeUpgrade(false); router.push("/dashboard/plano") }}
              className="w-full h-9 bg-[#0B3064] hover:bg-[#082551] text-white text-sm font-semibold rounded-xl"
            >
              Ver planos e fazer upgrade
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Criar Nova Obra
            </h1>
          </div>
          <p className="text-xs text-gray-400 ml-10">
            Preencha os dados da sua obra
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-[#13151a]/90 rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.3)] p-3 sm:p-5 space-y-3 relative overflow-hidden border border-slate-800/50">
          {/* Dados da Obra */}
          <div className="space-y-2.5 relative z-10">
            <h3 className="text-sm font-bold text-white pb-1 border-b border-[#0B3064]/40">
              Dados da Obra
            </h3>

            {/* Clientes (apenas para Construtores) */}
            {userProfile === "builder" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-300 font-medium">
                    Clientes *
                  </Label>
                  <button
                    type="button"
                    onClick={() => setClientesList(prev => [...prev, { nome: "" }])}
                    className="flex items-center gap-1 text-[10px] text-[#7eaaee] hover:text-[#7eaaee] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar cliente
                  </button>
                </div>
                <div className="space-y-2">
                  {clientesList.map((c, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        placeholder={`Nome do cliente ${clientesList.length > 1 ? i + 1 : ""}`}
                        value={c.nome}
                        onChange={e => setClientesList(prev => prev.map((x, j) => j === i ? { nome: e.target.value } : x))}
                        className="flex-1 bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#3B82F6] hover:bg-[#243552] rounded-md h-9 transition-all"
                      />
                      {clientesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setClientesList(prev => prev.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500">Obras com sócios: adicione cada cliente separado.</p>
              </div>
            )}

            {/* Nome da Obra */}
            <div className="space-y-1">
              <Label htmlFor="nome" className="text-xs text-gray-300 font-medium">
                Nome da Obra {userProfile === "builder" ? "" : "*"}
              </Label>
              <Input
                id="nome"
                placeholder={userProfile === "builder" ? "Ex: Reforma apartamento" : "Ex: Casa da Praia"}
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required={userProfile !== "builder"}
                className="bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] hover:bg-[#243552] rounded-md h-9 transition-all"
              />
              {userProfile === "builder" && (
                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                  Se não preencher, será gerado como "Obra - [Cliente]"
                </p>
              )}
            </div>

            {/* Tipo e Área na mesma linha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2.5">
              {/* Tipo */}
              <div className="space-y-1">
                <Label htmlFor="tipo" className="text-xs text-gray-300 font-medium">
                  Tipo *
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  required
                >
                  <SelectTrigger className="bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] hover:bg-[#243552] rounded-md h-9 transition-all [&>svg]:text-[#94A3B8] [&>svg]:w-3.5 [&>svg]:h-3.5">
                    <SelectValue placeholder="Selecione" className="text-[#64748B]" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-md">
                    <SelectItem value="construcao" className="text-sm text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Construção
                      </div>
                    </SelectItem>
                    <SelectItem value="reforma" className="text-sm text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white">
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5" />
                        Reforma
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Área */}
              <div className="space-y-1">
                <Label htmlFor="area" className="text-xs text-gray-300 font-medium">
                  Área (m²) *
                </Label>
                <Input
                  id="area"
                  type="text"
                  placeholder="Ex: 120,50"
                  value={areaFormatada}
                  onChange={handleAreaChange}
                  required
                  className="bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] hover:bg-[#243552] rounded-md h-9 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-2.5 relative z-10">
            <h3 className="text-sm font-bold text-white pb-1 border-b border-[#0B3064]/40">
              Localização
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Estado */}
              <div className="space-y-1">
                <Label htmlFor="estado" className="text-xs text-gray-300 font-medium">
                  UF *
                </Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  required
                >
                  <SelectTrigger className="bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] hover:bg-[#243552] rounded-md h-9 transition-all [&>svg]:text-[#94A3B8] [&>svg]:w-3.5 [&>svg]:h-3.5">
                    <SelectValue placeholder="SP" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-md">
                    {ESTADOS_BRASILEIROS.map((estado) => (
                      <SelectItem key={estado} value={estado} className="text-sm text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white">
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cidade */}
              <div className="space-y-1 col-span-2">
                <Label htmlFor="cidade" className="text-xs text-gray-300 font-medium">
                  Cidade *
                </Label>
                <Input
                  id="cidade"
                  placeholder="Ex: São Paulo"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  required
                  className="bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] hover:bg-[#243552] rounded-md h-9 transition-all"
                />
              </div>
            </div>

            {/* Bairro */}
            <div className="space-y-1">
              <Label htmlFor="bairro" className="text-xs text-gray-300 font-medium">
                Bairro *
              </Label>
              <Input
                id="bairro"
                placeholder="Ex: Jardins"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                required
                className="bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] hover:bg-[#243552] rounded-md h-9 transition-all"
              />
            </div>
          </div>

          {/* Orçamento Estimado */}
          <div className="space-y-2.5 relative z-10">
            <h3 className="text-sm font-bold text-white pb-1 border-b border-[#0B3064]/40">
              Orçamento
            </h3>

            <div className="space-y-1">
              <Label htmlFor="orcamento" className="text-xs text-gray-300 font-medium">
                Orçamento Estimado (opcional)
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">
                  R$
                </span>
                <Input
                  id="orcamento"
                  type="text"
                  placeholder="0,00"
                  value={orcamentoFormatado}
                  onChange={handleOrcamentoChange}
                  className="pl-9 bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] hover:bg-[#243552] rounded-md h-9 transition-all"
                />
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">
                Usado para calcular alertas e economia
              </p>
            </div>
          </div>

          {/* Prazo da Obra */}
          <div className="space-y-2.5 relative z-10">
            <h3 className="text-sm font-bold text-white pb-1 border-b border-[#0B3064]/40">
              Prazo
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
              {/* Data de Início */}
              <div className="space-y-1 max-w-xs">
                <Label htmlFor="dataInicio" className="text-xs text-gray-300 font-medium">
                  Início (opcional)
                </Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  className="bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] hover:bg-[#243552] rounded-md h-9 transition-all [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert-[0.6] [&::-webkit-calendar-picker-indicator]:scale-75"
                />
              </div>

              {/* Previsão de Término */}
              <div className="space-y-1 max-w-xs">
                <Label htmlFor="dataTermino" className="text-xs text-gray-300 font-medium">
                  Término (opcional)
                </Label>
                <Input
                  id="dataTermino"
                  type="date"
                  value={formData.dataTermino}
                  onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                  className="bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F680] hover:bg-[#243552] rounded-md h-9 transition-all [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert-[0.6] [&::-webkit-calendar-picker-indicator]:scale-75"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2 relative z-10">
            <Button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex-1 h-9 text-sm bg-red-600 hover:bg-red-700 text-white shadow-md"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 text-sm bg-[#0B3064] hover:bg-[#082551] text-white font-semibold shadow-md"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Criar Obra"}
            </Button>
          </div>
        </form>

        {/* Modal de Cadastro de Profissional */}
        {showProfissionalModal && (
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
                  Obra criada com sucesso!
                </h3>
              </div>

              {/* Subtítulo */}
              <p className="text-sm text-gray-300 mb-1 ml-13">
                Deseja cadastrar um profissional agora?
              </p>

              {/* Microtexto informativo */}
              <p className="text-xs text-gray-400 mb-5 ml-13">
                A maioria dos usuários cadastra pelo menos um profissional logo após criar a obra.
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

                {/* Botão principal - Cadastrar agora */}
                <Button
                  onClick={handleCadastrarProfissional}
                  className="flex-1 h-10 bg-[#0B3064] hover:bg-[#082551] text-white font-semibold rounded-lg shadow-md transition-colors text-sm"
                >
                  Cadastrar agora
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
