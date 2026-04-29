"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { FileText, Save, X, Edit, Trash2, Plus, DollarSign, Pencil } from "lucide-react"
import { goToObraDashboard } from "@/lib/navigation"
import { deletePagamento } from "@/lib/storage"
import { getDataHoje, formatarData } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/custom/FileUpload"
import { toast } from "sonner"
import Image from "next/image"
import { updateProfissionalSupabase } from "@/lib/storage"
import { getAllFuncoes, addCustomFuncao, formatarTelefoneBR } from "@/lib/profissional-funcoes"

interface Profissional {
  id: string
  obraId: string
  nome: string
  funcao: string
  telefone?: string
  observacoes?: string
  valorPrevisto?: number
  contrato?: {
    tipoContrato: string
    dataInicio?: string
    dataTermino?: string
    observacoes?: string
    valorPrevisto: number
    valorCombinado?: number
    diaria?: number
    qtdDiarias?: number
    valorM2?: number
    areaM2?: number
    valorUnidade?: number
    qtdUnidades?: number
    etapas?: Array<{ nome: string; valor: number }>
    anexo?: string | null
  }
}

interface Despesa {
  id: string
  obraId: string
  data: string
  valor: number
  categoria?: string
  category?: string
  descricao?: string
  formaPagamento?: string
  observacao?: string
  profissionalId?: string
  anexo?: string | null
}

interface Obra {
  id: string
  nome: string
  area?: number
}

function ProfissionalDetalhePageContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string

  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [obra, setObra] = useState<Obra | null>(null)
  const [pagamentos, setPagamentos] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingContrato, setIsEditingContrato] = useState(false)
  const [modalNovoPagamento, setModalNovoPagamento] = useState(false)
  const [modalEditarPagamento, setModalEditarPagamento] = useState(false)
  const [pagamentoEditando, setPagamentoEditando] = useState<string | null>(null)
  const [valorCombinadoFormatado, setValorCombinadoFormatado] = useState("")
  const [valorDiariaFormatado, setValorDiariaFormatado] = useState("")
  const [valorM2Formatado, setValorM2Formatado] = useState("")
  const [excluindoContrato, setExcluindoContrato] = useState(false)
  const [excluindoPagamento, setExcluindoPagamento] = useState<string | null>(null)
  const [showDeleteContratoModal, setShowDeleteContratoModal] = useState(false)
  const [showDeletePagamentoModal, setShowDeletePagamentoModal] = useState(false)
  const [pagamentoToDelete, setPagamentoToDelete] = useState<Despesa | null>(null)
  const [etapasFormatadas, setEtapasFormatadas] = useState<string[]>([])
  const [anexoContrato, setAnexoContrato] = useState<string | null>(null)
  const [anexoPagamento, setAnexoPagamento] = useState<string | null>(null)
  const [anexoPagamentoFile, setAnexoPagamentoFile] = useState<File | null>(null)
  const [anexoPagamentoEditar, setAnexoPagamentoEditar] = useState<string | null>(null)
  const [anexoPagamentoEditarFile, setAnexoPagamentoEditarFile] = useState<File | null>(null)
  const [uploadingComprovante, setUploadingComprovante] = useState(false)
  
  const [funcoesDisponiveis, setFuncoesDisponiveis] = useState<string[]>(() => getAllFuncoes())
  const [showNovaFuncao, setShowNovaFuncao] = useState(false)
  const [novaFuncaoLabel, setNovaFuncaoLabel] = useState("")

  const [editForm, setEditForm] = useState({
    nome: "",
    funcao: "",
    telefone: "",
    observacoes: "",
    contrato: {
      tipoContrato: "",
      dataInicio: "",
      dataTermino: "",
      observacoes: "",
      valorPrevisto: 0,
      valorCombinado: 0,
      diaria: 0,
      qtdDiarias: 0,
      valorM2: 0,
      areaM2: 0,
      valorUnidade: 0,
      qtdUnidades: 0,
      etapas: [] as Array<{ nome: string; valor: number }>,
      anexo: null as string | null
    }
  })

  const [novoPagamentoForm, setNovoPagamentoForm] = useState({
    data: getDataHoje(),
    valor: "",
    valorFormatado: "",
    formaPagamento: "pix",
    observacao: "",
    anexo: null as string | null
  })

  const [editarPagamentoForm, setEditarPagamentoForm] = useState({
    data: "",
    valor: "",
    valorFormatado: "",
    formaPagamento: "",
    observacao: "",
    anexo: null as string | null
  })

  // Refresh: invalida cache do React Query — substitui o getUser+fetch antigo
  const carregarPagamentos = async () => {
    await queryClient.invalidateQueries({ queryKey: ["pagamentos-prof", id] })
  }

  // ── React Query: auth + profissional + obra + pagamentos com cache ──
  const { data: authUser, isError: authError } = useQuery({
    queryKey: ["auth-user"],
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) throw new Error("not authenticated")
      return data.user
    },
  })

  useEffect(() => {
    if (authError) router.push("/login")
  }, [authError, router])

  const { data: profissionalQuery, isError: profError } = useQuery({
    queryKey: ["profissional", id, authUser?.id],
    enabled: !!id && !!authUser?.id,
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<Profissional> => {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase
        .from("profissionais")
        .select("*")
        .eq("id", id)
        .eq("user_id", authUser!.id)
        .single()
      if (error || !data) throw new Error("not found")
      const p = data as any
      return {
        id: p.id,
        obraId: p.obra_id,
        nome: p.nome,
        funcao: p.funcao,
        telefone: p.telefone,
        observacoes: p.observacoes,
        valorPrevisto: p.valor_previsto,
        contrato: p.contrato || undefined,
      }
    },
  })

  useEffect(() => {
    if (profError) {
      toast.error("Profissional não encontrado")
      router.push("/dashboard/profissionais")
    }
  }, [profError, router])

  // Pagamentos — paralelo com profissional (só depende de id+user)
  const { data: pagamentosQuery } = useQuery({
    queryKey: ["pagamentos-prof", id],
    enabled: !!id && !!authUser?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase
        .from("pagamentos")
        .select("id, obra_id, data, valor, forma_pagamento, observacao, profissional_id, comprovante_url")
        .eq("profissional_id", id)
        .eq("user_id", authUser!.id)
        .order("data", { ascending: false })
      if (error) throw error
      return ((data || []) as any[]).map((p): Despesa => ({
        id: p.id,
        obraId: p.obra_id,
        data: p.data,
        valor: parseFloat(p.valor) || 0,
        categoria: "mao_obra",
        category: "mao_obra",
        descricao: "Pagamento",
        formaPagamento: p.forma_pagamento,
        observacao: p.observacao,
        profissionalId: p.profissional_id,
        anexo: p.comprovante_url || null,
      }))
    },
  })

  // Obra — depende do profissional carregado
  const { data: obraQuery } = useQuery({
    queryKey: ["obra", profissionalQuery?.obraId, authUser?.id],
    enabled: !!profissionalQuery?.obraId && !!authUser?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase
        .from("obras")
        .select("id, nome, area")
        .eq("id", profissionalQuery!.obraId)
        .eq("user_id", authUser!.id)
        .single()
      if (error || !data) return null
      const o = data as any
      return { id: o.id, nome: o.nome, area: o.area } as Obra
    },
  })

  // Sync queries → useStates locais (mantém todos os call-sites de setProfissional/setObra/setPagamentos no resto da página)
  useEffect(() => {
    if (profissionalQuery) setProfissional(profissionalQuery)
  }, [profissionalQuery])

  useEffect(() => {
    if (obraQuery) setObra(obraQuery)
  }, [obraQuery])

  useEffect(() => {
    if (pagamentosQuery) setPagamentos(pagamentosQuery)
  }, [pagamentosQuery])

  useEffect(() => {
    if (profissionalQuery) setLoading(false)
  }, [profissionalQuery])

  // Inicializar formulário de edição quando profissional carregar
  useEffect(() => {
    const prof = profissionalQuery
    if (!prof) return

    setEditForm({
      nome: prof.nome,
      funcao: prof.funcao,
      telefone: prof.telefone || "",
      observacoes: prof.observacoes || "",
      contrato: (prof.contrato as any) || {
        tipoContrato: "empreitada",
        dataInicio: "",
        dataTermino: "",
        observacoes: "",
        valorPrevisto: 0,
        valorCombinado: 0,
        diaria: 0,
        qtdDiarias: 0,
        valorM2: 0,
        areaM2: 0,
        valorUnidade: 0,
        qtdUnidades: 0,
        etapas: [],
        anexo: null,
      },
    })

    if (prof.contrato?.valorCombinado) setValorCombinadoFormatado(formatarMoeda(prof.contrato.valorCombinado))
    if (prof.contrato?.diaria) setValorDiariaFormatado(formatarMoeda(prof.contrato.diaria))
    if (prof.contrato?.valorM2) setValorM2Formatado(formatarMoeda(prof.contrato.valorM2))
    if (prof.contrato?.etapas) {
      setEtapasFormatadas(prof.contrato.etapas.map((e: { nome: string; valor: number }) => formatarMoeda(e.valor)))
    }
    if (prof.contrato?.anexo) setAnexoContrato(prof.contrato.anexo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissionalQuery])

  // Verificar se deve abrir automaticamente o modal de contrato
  useEffect(() => {
    const shouldOpenContrato = searchParams.get('openContrato') === 'true'

    if (shouldOpenContrato && profissional && !profissional.contrato) {
      console.log('[CONTRATO] Abrindo modal de contrato automaticamente')
      setIsEditingContrato(true)
    }
  }, [searchParams, profissional])

  // Preencher automaticamente a área quando selecionar "Por m²"
  useEffect(() => {
    // Só preenche automaticamente se:
    // 1. Tipo de contrato é "por_m2"
    // 2. Área ainda não foi preenchida (ou é 0)
    // 3. Obra possui área cadastrada
    // 4. Está editando o contrato
    if (
      isEditingContrato &&
      editForm.contrato.tipoContrato === "por_m2" &&
      (!editForm.contrato.areaM2 || editForm.contrato.areaM2 === 0) &&
      obra?.area &&
      obra.area > 0
    ) {
      // Preencher automaticamente com a área da obra
      setEditForm(prev => ({
        ...prev,
        contrato: {
          ...prev.contrato,
          areaM2: obra.area || 0,
          valorPrevisto: (prev.contrato.valorM2 || 0) * (obra.area || 0)
        }
      }))
    }
  }, [editForm.contrato.tipoContrato, obra, isEditingContrato])

  const formatarMoeda = (valor: number | undefined | null): string => {
    if (valor === undefined || valor === null || isNaN(valor)) return "R$ 0,00"
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const formatarMoedaInput = (valor: string): string => {
    const numero = valor.replace(/\D/g, "")
    if (!numero) return ""
    const valorNumerico = Number(numero) / 100
    return valorNumerico.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const converterMoedaParaNumero = (valorFormatado: string): number => {
    const numero = valorFormatado
      .replace(/R\$/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".")
    return Number(numero) || 0
  }

  const calcularValorPago = (): number => {
    return pagamentos.reduce((acc, p) => acc + p.valor, 0)
  }

  const calcularValorPrevisto = (): number => {
    return profissional?.valorPrevisto || profissional?.contrato?.valorPrevisto || 0
  }

  const calcularSaldoPagar = (): number => {
    const valorPrevisto = calcularValorPrevisto()
    const valorPago = calcularValorPago()
    return valorPrevisto - valorPago
  }

  const getCorSaldo = (saldo: number): string => {
    return saldo < 0 ? "text-red-600" : "text-[#0B3064]"
  }

  const calcularValorPrevistoContrato = (contrato: typeof editForm.contrato): number => {
    switch (contrato.tipoContrato) {
      case "empreitada":
        return contrato.valorCombinado || 0
      case "diaria":
        return (contrato.diaria || 0) * (contrato.qtdDiarias || 0)
      case "por_m2":
        return (contrato.valorM2 || 0) * (contrato.areaM2 || 0)
      case "por_etapa":
        return contrato.etapas?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0
      default:
        return 0
    }
  }

  const handleContratoChange = (field: string, value: any) => {
    const updatedContrato = { ...editForm.contrato, [field]: value }
    const valorPrevisto = calcularValorPrevistoContrato(updatedContrato)
    setEditForm({
      ...editForm,
      contrato: { ...updatedContrato, valorPrevisto }
    })
  }

  const handleValorCombinadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarMoedaInput(e.target.value)
    setValorCombinadoFormatado(valorFormatado)
    const valorNumerico = converterMoedaParaNumero(valorFormatado)
    handleContratoChange("valorCombinado", valorNumerico)
  }

  const handleValorDiariaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarMoedaInput(e.target.value)
    setValorDiariaFormatado(valorFormatado)
    const valorNumerico = converterMoedaParaNumero(valorFormatado)
    handleContratoChange("diaria", valorNumerico)
  }

  const handleValorM2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarMoedaInput(e.target.value)
    setValorM2Formatado(valorFormatado)
    const valorNumerico = converterMoedaParaNumero(valorFormatado)
    handleContratoChange("valorM2", valorNumerico)
  }

  const handleEtapaValorChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarMoedaInput(e.target.value)
    const novasEtapasFormatadas = [...etapasFormatadas]
    novasEtapasFormatadas[index] = valorFormatado
    setEtapasFormatadas(novasEtapasFormatadas)
    
    const valorNumerico = converterMoedaParaNumero(valorFormatado)
    const newEtapas = [...editForm.contrato.etapas!]
    newEtapas[index].valor = valorNumerico
    handleContratoChange("etapas", newEtapas)
  }

  const handleCriarFuncao = () => {
    const criada = addCustomFuncao(novaFuncaoLabel)
    if (!criada) {
      toast.error("Informe um nome válido para a função")
      return
    }
    setFuncoesDisponiveis(getAllFuncoes())
    setEditForm((prev) => ({ ...prev, funcao: criada }))
    setShowNovaFuncao(false)
    setNovaFuncaoLabel("")
    toast.success(`Função "${criada}" criada!`)
  }

  const handleSalvar = async () => {
    try {
      if (!editForm.nome.trim() || !editForm.funcao.trim()) {
        toast.error("Preencha nome e função")
        return
      }

      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast.error("Erro de autenticação. Faça login novamente.")
        router.push("/login")
        return
      }

      const result = await updateProfissionalSupabase(
        id,
        {
          nome: editForm.nome.trim(),
          funcao: editForm.funcao.trim(),
          telefone: editForm.telefone.trim() || null,
          observacoes: editForm.observacoes.trim() || null,
        },
        user.id,
      )

      if (!result.success) {
        toast.error(result.error || "Erro ao salvar profissional")
        return
      }

      // Atualizar estado local
      setProfissional((prev) =>
        prev
          ? {
              ...prev,
              nome: editForm.nome.trim(),
              funcao: editForm.funcao.trim(),
              telefone: editForm.telefone.trim() || undefined,
              observacoes: editForm.observacoes.trim() || undefined,
            }
          : prev,
      )

      // Sincronizar localStorage (legado)
      try {
        const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
        const index = todosProfissionais.findIndex((p: Profissional) => p.id === id)
        if (index !== -1) {
          todosProfissionais[index] = {
            ...todosProfissionais[index],
            nome: editForm.nome.trim(),
            funcao: editForm.funcao.trim(),
            telefone: editForm.telefone.trim() || undefined,
            observacoes: editForm.observacoes.trim() || undefined,
          }
          localStorage.setItem("profissionais", JSON.stringify(todosProfissionais))
        }
      } catch {
        // localStorage opcional
      }

      setIsEditing(false)
      toast.success("Profissional salvo com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar profissional:", error)
      toast.error("Erro ao salvar profissional")
    }
  }

  const validarContrato = (): boolean => {
    if (!editForm.contrato.tipoContrato) {
      toast.error("Selecione o tipo de contrato")
      return false
    }
    switch (editForm.contrato.tipoContrato) {
      case "empreitada":
        if (!editForm.contrato.valorCombinado || editForm.contrato.valorCombinado <= 0) {
          toast.error("Informe o valor combinado")
          return false
        }
        break
      case "diaria":
        if (!editForm.contrato.diaria || editForm.contrato.diaria <= 0) {
          toast.error("Informe o valor da diária")
          return false
        }
        if (!editForm.contrato.qtdDiarias || editForm.contrato.qtdDiarias <= 0) {
          toast.error("Informe a quantidade de diárias")
          return false
        }
        break
      case "por_m2":
        if (!editForm.contrato.valorM2 || editForm.contrato.valorM2 <= 0) {
          toast.error("Informe o valor por m²")
          return false
        }
        if (!editForm.contrato.areaM2 || editForm.contrato.areaM2 <= 0) {
          toast.error("Informe a área em m²")
          return false
        }
        break
      case "por_etapa":
        if (!editForm.contrato.etapas || editForm.contrato.etapas.length === 0) {
          toast.error("Adicione pelo menos uma etapa")
          return false
        }
        break
    }
    return true
  }

  const handleSalvarContrato = async () => {
    console.log("[CONTRATO] Submit iniciado")

    if (!validarContrato()) {
      console.log("[CONTRATO] Validação falhou")
      return
    }

    try {
      setLoading(true)
      console.log("[CONTRATO] Loading ativado")

      // Verificar autenticação
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("[CONTRATO] Erro de autenticação:", authError)
        toast.error("Erro de autenticação. Faça login novamente.")
        setLoading(false)
        return
      }

      // VALIDAÇÃO CRÍTICA: Validar UUID do profissional
      const { isValidUUID } = await import("@/lib/storage")
      if (!isValidUUID(id)) {
        console.error("[CONTRATO] UUID do profissional inválido:", id)
        toast.error("⚠️ Este profissional foi criado em uma versão antiga do sistema. Por favor, recadastre o profissional para continuar.", {
          duration: 6000
        })
        setLoading(false)
        return
      }

      console.log("[CONTRATO] Validação de UUID OK. Profissional ID:", id)

      // ============================================
      // CORREÇÃO 1: VALIDAR EXISTÊNCIA NO SUPABASE
      // ============================================
      console.log("[CONTRATO] Validando existência do profissional no Supabase...")

      const { data: profissionalExistente, error: checkError } = (await supabase
        .from("profissionais")
        .select("id, nome, obra_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()) as { data: any; error: any }

      if (checkError || !profissionalExistente) {
        console.error("[CONTRATO] ❌ Profissional não encontrado no Supabase:", {
          id,
          error: checkError,
          encontrado: !!profissionalExistente
        })
        toast.error("❌ Profissional não encontrado no banco de dados. Por favor, volte e tente novamente.")
        setLoading(false)
        return
      }

      console.log("[CONTRATO] ✅ Profissional encontrado no Supabase:", {
        id: profissionalExistente.id,
        nome: profissionalExistente.nome,
        obra_id: profissionalExistente.obra_id
      })

      const valorPrevistoContrato = calcularValorPrevistoContrato(editForm.contrato)

      const contratoAtualizado = {
        ...editForm.contrato,
        valorPrevisto: valorPrevistoContrato,
        anexo: anexoContrato
      }

      console.log("[CONTRATO] Payload do contrato a ser salvo:", {
        tipoContrato: contratoAtualizado.tipoContrato,
        valorCombinado: contratoAtualizado.valorCombinado,
        valorPrevisto: contratoAtualizado.valorPrevisto,
        temAnexo: !!contratoAtualizado.anexo,
        anexoLength: contratoAtualizado.anexo?.length || 0,
        anexoPreview: contratoAtualizado.anexo?.substring(0, 100) || 'null',
        profissional_id: id,
        user_id: user.id
      })

      // ============================================
      // CORREÇÃO 2: UPDATE COM CONFIRMAÇÃO OBRIGATÓRIA
      // ============================================
      console.log("[CONTRATO] Executando UPDATE no Supabase...")

      // Payload do UPDATE (atualizado_em é gerenciado por TRIGGER automático)
      const updatePayload = {
        contrato: contratoAtualizado,
        valor_previsto: valorPrevistoContrato
      }

      console.log("[CONTRATO] Payload enviado ao UPDATE:", {
        colunas: Object.keys(updatePayload),
        contrato_definido: !!updatePayload.contrato,
        valor_previsto: updatePayload.valor_previsto,
        profissional_id: id,
        user_id: user.id
      })

      const { data: updateResult, error: updateError } = await supabase
        .from("profissionais")
        .update(updatePayload)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id")

      // ============================================
      // CORREÇÃO 3: BLOQUEAR UPDATE SILENCIOSO
      // ============================================
      console.log("[CONTRATO] Resposta do Supabase:", {
        erro: updateError ? "SIM" : "NÃO",
        data_presente: !!updateResult,
        linhas_retornadas: updateResult?.length || 0
      })

      if (updateError) {
        console.error("[CONTRATO] ❌ ERRO ao executar UPDATE:", {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
          payload_enviado: updatePayload
        })
        toast.error("Erro ao salvar contrato no banco de dados: " + updateError.message)
        setLoading(false)
        return
      }

      // Se não há erro, o update foi bem-sucedido (alguns configs RLS não retornam linhas)
      console.log("[CONTRATO] ✅ UPDATE executado com sucesso. Linhas:", updateResult?.length || 0)

      // Atualizar estado local
      const profissionalAtualizado: Profissional = {
        ...profissional!,
        contrato: contratoAtualizado,
        valorPrevisto: valorPrevistoContrato
      }

      // CORREÇÃO: Atualizar o estado do profissional para refletir o contrato salvo
      setProfissional(profissionalAtualizado)

      setIsEditingContrato(false)
      setLoading(false)
      toast.success("✅ Contrato salvo com sucesso!")
    } catch (error) {
      console.error("[CONTRATO] Erro inesperado ao salvar contrato:", error)
      toast.error("Erro ao salvar contrato. Tente novamente.")
      setLoading(false)
    }
  }

  const handleOpenDeleteContratoModal = () => {
    setShowDeleteContratoModal(true)
  }

  const handleCloseDeleteContratoModal = () => {
    setShowDeleteContratoModal(false)
  }

  const handleConfirmDeleteContrato = async () => {
    if (!profissional) {
      toast.error("Profissional não encontrado")
      return
    }

    setExcluindoContrato(true)

    try {
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const index = todosProfissionais.findIndex((p: Profissional) => p.id === id)
      
      if (index === -1) {
        toast.error("Profissional não encontrado")
        return
      }

      const profissionalAtualizado = {
        ...todosProfissionais[index],
        contrato: undefined,
        valorPrevisto: 0
      }

      todosProfissionais[index] = profissionalAtualizado
      localStorage.setItem("profissionais", JSON.stringify(todosProfissionais))

      setProfissional(profissionalAtualizado)
      setEditForm({
        ...editForm,
        contrato: {
          tipoContrato: "",
          dataInicio: "",
          dataTermino: "",
          observacoes: "",
          valorPrevisto: 0,
          valorCombinado: 0,
          diaria: 0,
          qtdDiarias: 0,
          valorM2: 0,
          areaM2: 0,
          valorUnidade: 0,
          qtdUnidades: 0,
          etapas: [],
          anexo: null
        }
      })
      setValorCombinadoFormatado("")
      setValorDiariaFormatado("")
      setValorM2Formatado("")
      setEtapasFormatadas([])
      setAnexoContrato(null)
      
      handleCloseDeleteContratoModal()
      toast.success("Contrato excluído com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir contrato:", error)
      toast.error("Erro ao excluir contrato. Tente novamente.")
    } finally {
      setExcluindoContrato(false)
    }
  }

  const handleOpenDeletePagamentoModal = (pagamento: Despesa) => {
    setPagamentoToDelete(pagamento)
    setShowDeletePagamentoModal(true)
  }

  const handleCloseDeletePagamentoModal = () => {
    setShowDeletePagamentoModal(false)
    setPagamentoToDelete(null)
  }

  const handleConfirmDeletePagamento = async () => {
    if (!pagamentoToDelete) return

    setExcluindoPagamento(pagamentoToDelete.id)

    try {
      const sucesso = await deletePagamento(obra?.id || "", id, pagamentoToDelete.id)

      if (sucesso) {
        toast.success("Pagamento excluído com sucesso!")
        await carregarPagamentos()
        handleCloseDeletePagamentoModal()
        
        window.dispatchEvent(new CustomEvent("pagamentoAtualizado", { detail: { profissionalId: id } }))
      } else {
        toast.error("Erro ao excluir pagamento. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao excluir pagamento:", error)
      toast.error("Erro ao excluir pagamento. Tente novamente.")
    } finally {
      setExcluindoPagamento(null)
    }
  }

  const handleAbrirModalNovoPagamento = () => {
    setNovoPagamentoForm({
      data: getDataHoje(),
      valor: "",
      valorFormatado: "",
      formaPagamento: "pix",
      observacao: "",
      anexo: null
    })
    setAnexoPagamento(null)
    setModalNovoPagamento(true)
  }

  const handleAbrirModalEditarPagamento = (pagamento: Despesa) => {
    setPagamentoEditando(pagamento.id)
    setEditarPagamentoForm({
      data: pagamento.data,
      valor: String(pagamento.valor),
      valorFormatado: formatarMoeda(pagamento.valor),
      formaPagamento: pagamento.formaPagamento || "dinheiro",
      observacao: pagamento.observacao || "",
      anexo: pagamento.anexo || null
    })
    setAnexoPagamentoEditar(pagamento.anexo || null)
    setModalEditarPagamento(true)
  }

  const handleValorPagamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarMoedaInput(e.target.value)
    setNovoPagamentoForm({
      ...novoPagamentoForm,
      valorFormatado,
      valor: String(converterMoedaParaNumero(valorFormatado))
    })
  }

  const handleValorEditarPagamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarMoedaInput(e.target.value)
    setEditarPagamentoForm({
      ...editarPagamentoForm,
      valorFormatado,
      valor: String(converterMoedaParaNumero(valorFormatado))
    })
  }

  const validarNovoPagamento = (): boolean => {
    if (!novoPagamentoForm.data) {
      toast.error("Informe a data do pagamento")
      return false
    }
    const valorNumerico = Number(novoPagamentoForm.valor ?? 0)
    if (!valorNumerico || valorNumerico <= 0) {
      toast.error("Informe um valor válido maior que zero")
      return false
    }
    return true
  }

  const validarEditarPagamento = (): boolean => {
    if (!editarPagamentoForm.data) {
      toast.error("Informe a data do pagamento")
      return false
    }
    const valorNumerico = Number(editarPagamentoForm.valor ?? 0)
    if (!valorNumerico || valorNumerico <= 0) {
      toast.error("Informe um valor válido maior que zero")
      return false
    }
    return true
  }

  const handleSalvarNovoPagamento = async () => {
    if (!validarNovoPagamento()) return
    if (!profissional) return

    try {
      setUploadingComprovante(true)

      // Verificar autenticação
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        toast.error("Erro de autenticação. Faça login novamente.")
        setUploadingComprovante(false)
        return
      }

      // FLUXO 1: SE HOUVER COMPROVANTE, FAZER UPLOAD PRIMEIRO
      let comprovanteUrl: string | null = null

      if (anexoPagamentoFile) {
        console.log("[PAGAMENTO] Iniciando upload do comprovante...")

        const timestamp = Date.now()
        const fileExt = anexoPagamentoFile.name.split('.').pop()
        const filePath = `pagamentos/${profissional.obraId}/${timestamp}.${fileExt}`

        const { uploadFileToStorage } = await import("@/lib/storage")
        comprovanteUrl = await uploadFileToStorage(anexoPagamentoFile, "comprovantes", filePath)

        if (!comprovanteUrl) {
          toast.error("Erro ao fazer upload do comprovante. Tente novamente.")
          setUploadingComprovante(false)
          return
        }

        console.log("[PAGAMENTO] Upload concluído. URL gerada:", comprovanteUrl)
      } else {
        console.log("[PAGAMENTO] Nenhum comprovante anexado. Prosseguindo sem comprovante.")
      }

      // VALIDAÇÃO DEFENSIVA: garantir que comprovanteUrl é string ou null
      if (comprovanteUrl !== null && typeof comprovanteUrl !== 'string') {
        console.error("[VALIDAÇÃO] comprovanteUrl não é string válida:", typeof comprovanteUrl)
        toast.error("Erro ao processar URL do comprovante")
        setUploadingComprovante(false)
        return
      }

      // VALIDAÇÃO CRÍTICA: Validar UUIDs antes de salvar
      const { isValidUUID } = await import("@/lib/storage")

      console.log("[PAGAMENTO] Validando UUIDs...")
      console.log("[PAGAMENTO] obra_id:", profissional.obraId)
      console.log("[PAGAMENTO] profissional_id:", profissional.id)

      if (!isValidUUID(profissional.obraId)) {
        console.error("[PAGAMENTO] UUID da obra inválido:", profissional.obraId)
        toast.error("ID da obra inválido. Recarregue a página e tente novamente.")
        setUploadingComprovante(false)
        return
      }

      if (!isValidUUID(profissional.id)) {
        console.error("[PAGAMENTO] UUID do profissional inválido:", profissional.id)
        toast.error("ID do profissional inválido. Recarregue a página e tente novamente.")
        setUploadingComprovante(false)
        return
      }

      console.log("[PAGAMENTO] Validação de UUIDs OK")

      // FLUXO 2: SALVAR PAGAMENTO NO BANCO (SOMENTE APÓS UPLOAD)
      const novoPagamento = {
        obraId: profissional.obraId,
        profissionalId: profissional.id,
        data: novoPagamentoForm.data,
        valor: Number(novoPagamentoForm.valor),
        formaPagamento: novoPagamentoForm.formaPagamento,
        observacao: novoPagamentoForm.observacao || undefined,
        comprovanteUrl: comprovanteUrl // string URL ou null
      }

      console.log("[PAGAMENTO] Payload final antes de salvar:", {
        obraId: novoPagamento.obraId,
        profissionalId: novoPagamento.profissionalId,
        valor: novoPagamento.valor,
        data: novoPagamento.data,
        temComprovante: !!comprovanteUrl
      })

      const { savePagamentoSupabase } = await import("@/lib/storage")
      const savedId = await savePagamentoSupabase(novoPagamento, user.id)

      if (!savedId) {
        console.error("[PAGAMENTO] Falha ao salvar - savedId retornou null")
        toast.error("Erro ao salvar pagamento no banco de dados")
        setUploadingComprovante(false)
        return
      }

      console.log("[PAGAMENTO] Pagamento salvo com sucesso. ID:", savedId)

      // Criar despesa correspondente para localStorage (compatibilidade)
      const novaDespesa: Despesa = {
        id: savedId,
        obraId: profissional.obraId,
        data: novoPagamentoForm.data,
        valor: Number(novoPagamentoForm.valor),
        categoria: "Mão de Obra",
        category: "mao_obra",
        descricao: `Pagamento - ${profissional.nome}`,
        formaPagamento: novoPagamentoForm.formaPagamento,
        observacao: novoPagamentoForm.observacao || undefined,
        profissionalId: profissional.id,
        anexo: comprovanteUrl // URL do Storage ou null
      }

      const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")
      todasDespesas.push(novaDespesa)
      localStorage.setItem("despesas", JSON.stringify(todasDespesas))

      window.dispatchEvent(new CustomEvent("pagamentoSalvo", { detail: { profissionalId: profissional.id } }))

      await carregarPagamentos()
      setModalNovoPagamento(false)
      setAnexoPagamento(null)
      setAnexoPagamentoFile(null)
      setUploadingComprovante(false)
      toast.success("Pagamento registrado com sucesso!")
    } catch (error) {
      console.error("[PAGAMENTO] Erro ao salvar pagamento:", error)
      toast.error("Erro ao salvar pagamento")
      setUploadingComprovante(false)
    }
  }

  const handleSalvarEditarPagamento = async () => {
    if (!validarEditarPagamento()) return
    if (!profissional || !pagamentoEditando) return

    try {
      // Atualizar no Supabase (fonte de verdade)
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from("pagamentos")
          .update({
            data: editarPagamentoForm.data,
            valor: Number(editarPagamentoForm.valor),
            forma_pagamento: editarPagamentoForm.formaPagamento,
            observacao: editarPagamentoForm.observacao || null,
            comprovante_url: anexoPagamentoEditar || null
          })
          .eq("id", pagamentoEditando)
          .eq("user_id", user.id)

        if (error) {
          console.error("[EDITAR PAGAMENTO] Erro:", error)
          toast.error("Erro ao atualizar pagamento")
          return
        }
      }

      window.dispatchEvent(new CustomEvent("pagamentoAtualizado", { detail: { profissionalId: profissional.id } }))

      await carregarPagamentos()
      setModalEditarPagamento(false)
      setPagamentoEditando(null)
      toast.success("Pagamento atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error)
      toast.error("Erro ao atualizar pagamento")
    }
  }

  if (loading || !profissional) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  const valorPago = calcularValorPago()
  const valorPrevisto = calcularValorPrevisto()
  const saldoPagar = calcularSaldoPagar()

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3">
      <div className="max-w-3xl mx-auto">
        {/* Header compacto */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-base font-bold text-white leading-tight">{profissional.nome}</h1>
              <p className="text-xs text-gray-500">{profissional.funcao}{obra ? ` · ${obra.nome}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard/profissionais/novo")}
              className="flex items-center gap-1.5 h-8 px-3 bg-[#0B3064] hover:bg-[#0e3d7a] active:scale-95 text-white text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150"
            >
              <Plus className="w-3 h-3" />
              Novo
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 h-8 px-3 bg-[#2a2d35] hover:bg-white/[0.13] active:scale-95 text-gray-300 text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150"
            >
              <Edit className="w-3 h-3" />
              {isEditing ? "Cancelar" : "Editar"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Informações Gerais */}
          <Card className="p-2 bg-[#1f2228]/60 border border-slate-700/25 shadow-lg rounded-xl">
            <h2 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#7eaaee]" />
              Informações Gerais
            </h2>

            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome" className="text-sm text-gray-300 font-medium">Nome</Label>
                    <Input
                      id="nome"
                      value={editForm.nome}
                      onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                      className="h-10 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="funcao" className="text-sm text-gray-300 font-medium">Função</Label>
                    <Select
                      value={editForm.funcao}
                      onValueChange={(value) => {
                        if (value === "__nova__") {
                          setShowNovaFuncao(true)
                          return
                        }
                        setEditForm({ ...editForm, funcao: value })
                      }}
                    >
                      <SelectTrigger className="h-10 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors data-[state=open]:border-[#3B82F6] data-[state=open]:ring-2 data-[state=open]:ring-[#3B82F680] [&>span]:text-[#F8FAFC] [&>svg]:text-[#94A3B8] hover:[&>svg]:text-[#3B82F6]">
                        <SelectValue placeholder="Selecione a função" className="text-[#64748B]" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-lg">
                        {funcoesDisponiveis.map((funcao) => (
                          <SelectItem
                            key={funcao}
                            value={funcao}
                            className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer"
                          >
                            {funcao}
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="__nova__"
                          className="text-[#7eaaee] focus:bg-[#2563EB] focus:text-white cursor-pointer border-t border-white/10 mt-1"
                        >
                          + Criar função
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {showNovaFuncao && (
                      <div className="flex gap-1.5 mt-1.5">
                        <Input
                          autoFocus
                          placeholder="Nome da função"
                          value={novaFuncaoLabel}
                          onChange={(e) => setNovaFuncaoLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleCriarFuncao()
                            }
                          }}
                          className="h-8 text-xs bg-[#1E293B] border border-[#334155] text-[#F8FAFC] rounded-lg"
                        />
                        <Button
                          type="button"
                          onClick={handleCriarFuncao}
                          className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                          Criar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setShowNovaFuncao(false)
                            setNovaFuncaoLabel("")
                          }}
                          className="h-8 px-2 text-xs bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 border border-white/[0.1] rounded-lg"
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefone" className="text-sm text-gray-300 font-medium">Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    value={editForm.telefone}
                    onChange={(e) => setEditForm({ ...editForm, telefone: formatarTelefoneBR(e.target.value) })}
                    className="h-10 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="observacoes" className="text-sm text-gray-300 font-medium">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={editForm.observacoes}
                    onChange={(e) => setEditForm({...editForm, observacoes: e.target.value})}
                    rows={2}
                    className="bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                  <button onClick={() => setIsEditing(false)} className="flex-1 h-10 bg-white/[0.07] hover:bg-white/[0.11] text-gray-300 text-sm font-medium rounded-xl transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSalvar} className="flex-1 h-10 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Nome</p>
                    <p className="font-semibold text-white">{profissional.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Função</p>
                    <p className="font-semibold text-white">{profissional.funcao}</p>
                  </div>
                </div>

                {profissional.telefone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Telefone</p>
                    <p className="font-semibold text-white">{profissional.telefone}</p>
                  </div>
                )}

                {profissional.observacoes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Observações</p>
                    <p className="font-semibold text-white">{profissional.observacoes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Resumo Financeiro */}
          {profissional.contrato && (
            <div className="flex flex-col gap-1.5">
              <div className="bg-[#1f2228]/80 border border-white/[0.08] px-3 py-2 rounded-lg flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Valor Previsto</span>
                <span className="text-sm font-bold text-white">{valorPrevisto > 0 ? formatarMoeda(valorPrevisto) : "Não definido"}</span>
              </div>
              <div className="bg-[#1f2228]/80 border border-white/[0.08] px-3 py-2 rounded-lg flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Valor Pago</span>
                <span className="text-sm font-bold text-green-400">{formatarMoeda(valorPago)}</span>
              </div>
              <div className="bg-[#1f2228]/80 border border-white/[0.08] px-3 py-2 rounded-lg flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Saldo a Pagar</span>
                <span className={`text-sm font-bold ${saldoPagar < 0 ? 'text-red-400' : 'text-[#7eaaee]'}`}>{formatarMoeda(saldoPagar)}</span>
              </div>
            </div>
          )}

          {/* Contrato / Combinado */}
          <Card className="p-2 bg-[#1f2228]/60 border border-slate-700/25 shadow-lg rounded-xl">
            <div className="mb-2">
              <h2 className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#7eaaee]" />
                Contrato / Combinado
              </h2>
            </div>

            {isEditingContrato ? (
              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor="tipoContrato" className="text-xs text-gray-300 font-medium">Tipo de Contrato</Label>
                  <Select
                    value={editForm.contrato.tipoContrato}
                    onValueChange={(value) => handleContratoChange("tipoContrato", value)}
                  >
                    <SelectTrigger className="h-10 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors data-[state=open]:border-[#3B82F6] data-[state=open]:ring-2 data-[state=open]:ring-[#3B82F680] [&>span]:text-[#F8FAFC] [&>svg]:text-[#94A3B8] hover:[&>svg]:text-[#3B82F6]">
                      <SelectValue placeholder="Selecione o tipo" className="text-[#64748B]" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F172A] border border-[#334155] rounded-lg">
                      <SelectItem value="empreitada" className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer">Empreitada (valor fechado)</SelectItem>
                      <SelectItem value="diaria" className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer">Diária</SelectItem>
                      <SelectItem value="por_m2" className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer">Por m²</SelectItem>
                      <SelectItem value="por_etapa" className="text-[#E5E7EB] hover:bg-[#1D4ED8] hover:text-white focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white cursor-pointer">Por etapa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editForm.contrato.tipoContrato === "empreitada" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="valorCombinado" className="text-xs text-gray-300 font-medium">Valor Combinado</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] font-medium text-sm">
                          R$
                        </span>
                        <Input
                          id="valorCombinado"
                          type="text"
                          value={valorCombinadoFormatado}
                          onChange={handleValorCombinadoChange}
                          placeholder="0,00"
                          className="h-10 pl-12 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-300 font-medium">Valor Previsto</Label>
                      <Input
                        value={formatarMoeda(editForm.contrato.valorPrevisto)}
                        readOnly
                        className="h-10 bg-[#1E293B]/70 border border-[#334155] text-[#F8FAFC] rounded-lg cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {editForm.contrato.tipoContrato === "diaria" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="diaria" className="text-xs text-gray-300 font-medium">Valor da Diária</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] font-medium text-sm">
                            R$
                          </span>
                          <Input
                            id="diaria"
                            type="text"
                            value={valorDiariaFormatado}
                            onChange={handleValorDiariaChange}
                            placeholder="0,00"
                            className="h-10 pl-12 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="qtdDiarias" className="text-xs text-gray-300 font-medium">Qtd. Diárias</Label>
                        <Input
                          id="qtdDiarias"
                          type="number"
                          min="0"
                          step="1"
                          value={editForm.contrato.qtdDiarias || ""}
                          onChange={(e) => handleContratoChange("qtdDiarias", Number(e.target.value))}
                          placeholder="0"
                          className="h-10 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-300 font-medium">Valor Previsto</Label>
                      <Input
                        value={formatarMoeda(editForm.contrato.valorPrevisto)}
                        readOnly
                        className="h-10 bg-[#1E293B]/70 border border-[#334155] text-[#F8FAFC] rounded-lg cursor-not-allowed"
                      />
                    </div>
                  </>
                )}

                {editForm.contrato.tipoContrato === "por_m2" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="valorM2" className="text-xs text-gray-300 font-medium">Valor por m²</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] font-medium text-sm">
                            R$
                          </span>
                          <Input
                            id="valorM2"
                            type="text"
                            value={valorM2Formatado}
                            onChange={handleValorM2Change}
                            placeholder="0,00"
                            className="h-10 pl-12 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="areaM2" className="text-xs text-gray-300 font-medium">
                          Área (m²)
                        </Label>
                        <div className="relative">
                          <Input
                            id="areaM2"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editForm.contrato.areaM2 || ""}
                            onChange={(e) => handleContratoChange("areaM2", parseFloat(e.target.value) || 0)}
                            placeholder="0,00"
                            className="h-10 pr-10 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs pointer-events-none">
                            m²
                          </span>
                        </div>
                        {obra?.area && (
                          <p className="text-[10px] text-gray-500 leading-tight">
                            Total da obra: {obra.area.toFixed(2)} m²
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-300 font-medium">Valor Previsto</Label>
                      <Input
                        value={formatarMoeda(editForm.contrato.valorPrevisto)}
                        readOnly
                        className="h-10 bg-[#1E293B]/70 border border-[#334155] text-[#F8FAFC] rounded-lg cursor-not-allowed"
                      />
                    </div>
                  </>
                )}

                {editForm.contrato.tipoContrato === "por_etapa" && (
                  <div className="space-y-3">
                    <Label className="text-xs text-gray-300 font-medium">Etapas</Label>
                    {editForm.contrato.etapas?.map((etapa, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nome da etapa"
                          value={etapa.nome}
                          onChange={(e) => {
                            const newEtapas = [...editForm.contrato.etapas!]
                            newEtapas[index].nome = e.target.value
                            handleContratoChange("etapas", newEtapas)
                          }}
                          className="h-10 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] font-medium text-sm">
                            R$
                          </span>
                          <Input
                            type="text"
                            placeholder="0,00"
                            value={etapasFormatadas[index] || ""}
                            onChange={(e) => handleEtapaValorChange(index, e)}
                            className="h-10 pl-12 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newEtapas = [...(editForm.contrato.etapas || []), { nome: "", valor: 0 }]
                        handleContratoChange("etapas", newEtapas)
                        setEtapasFormatadas([...etapasFormatadas, ""])
                      }}
                      className="border border-[#334155] bg-[#1E293B] text-[#F8FAFC] hover:bg-[#243552] hover:border-[#3B82F6] h-9 rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Adicionar Etapa
                    </Button>
                  </div>
                )}

                {editForm.contrato.tipoContrato === "por_etapa" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-300 font-medium">Valor Previsto</Label>
                    <Input
                      value={formatarMoeda(editForm.contrato.valorPrevisto)}
                      readOnly
                      className="h-10 bg-[#1E293B]/70 border border-[#334155] text-[#F8FAFC] rounded-lg cursor-not-allowed"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-12 shrink-0">Início</span>
                    <input
                      id="dataInicio"
                      type="date"
                      value={editForm.contrato.dataInicio}
                      onChange={(e) => handleContratoChange("dataInicio", e.target.value)}
                      className="flex-1 min-w-0 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] text-xs h-9 px-2 rounded-md focus:outline-none focus:border-[#3B82F6] transition-colors [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-12 shrink-0">Término</span>
                    <input
                      id="dataTermino"
                      type="date"
                      value={editForm.contrato.dataTermino}
                      onChange={(e) => handleContratoChange("dataTermino", e.target.value)}
                      className="flex-1 min-w-0 bg-[#1E293B] border border-[#334155] text-[#F8FAFC] text-xs h-9 px-2 rounded-md focus:outline-none focus:border-[#3B82F6] transition-colors [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="observacoesContrato" className="text-xs text-gray-300 font-medium">Observações</Label>
                  <Textarea
                    id="observacoesContrato"
                    value={editForm.contrato.observacoes}
                    onChange={(e) => handleContratoChange("observacoes", e.target.value)}
                    rows={2}
                    className="bg-[#1E293B] border border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] rounded-lg hover:bg-[#243552] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F680] transition-colors resize-none"
                  />
                </div>

                {/* Campo de Anexo do Contrato */}
                <FileUpload
                  label="Anexar contrato / combinado"
                  value={anexoContrato}
                  onChange={(file, preview) => setAnexoContrato(preview)}
                />

                <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                  <button onClick={() => setIsEditingContrato(false)} disabled={loading} className="flex-1 h-10 bg-white/[0.07] hover:bg-white/[0.11] text-gray-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                    Cancelar
                  </button>
                  <button onClick={handleSalvarContrato} disabled={loading} className="flex-1 h-10 bg-[#0B3064] hover:bg-[#082551] active:scale-95 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5">
                    {loading ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</> : <><Save className="w-3.5 h-3.5" />Salvar</>}
                  </button>
                </div>
              </div>
            ) : (
              profissional.contrato ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Tipo</p>
                      <p className="text-sm font-semibold text-white">
                        {profissional.contrato.tipoContrato === "empreitada" ? "Empreitada" :
                         profissional.contrato.tipoContrato === "diaria" ? "Diária" :
                         profissional.contrato.tipoContrato === "por_m2" ? "Por m²" :
                         profissional.contrato.tipoContrato === "por_etapa" ? "Por etapa" : profissional.contrato.tipoContrato}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Valor Previsto</p>
                      <p className="text-sm font-semibold text-white">{formatarMoeda(profissional.contrato.valorPrevisto)}</p>
                    </div>
                  </div>

                  {(profissional.contrato.dataInicio || profissional.contrato.dataTermino) && (
                    <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-white/10">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Início</p>
                        <p className="text-sm font-semibold text-white">
                          {profissional.contrato.dataInicio ? new Date(profissional.contrato.dataInicio).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Término</p>
                        <p className="text-sm font-semibold text-white">
                          {profissional.contrato.dataTermino ? new Date(profissional.contrato.dataTermino).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </div>
                  )}

                  {profissional.contrato.observacoes && (
                    <div className="pt-2.5 border-t border-white/10">
                      <p className="text-xs text-gray-500 mb-0.5">Observações</p>
                      <p className="text-sm font-semibold text-white">{profissional.contrato.observacoes}</p>
                    </div>
                  )}

                  {profissional.contrato.anexo && (
                    <div className="pt-2.5 border-t border-white/10">
                      <p className="text-xs text-gray-500 mb-1.5">Contrato Anexado</p>
                      <Button
                        onClick={() => {
                          console.log("[VISUALIZAR CONTRATO] Botão clicado")
                          const anexoUrl = profissional.contrato!.anexo
                          console.log("[VISUALIZAR CONTRATO] Anexo URL existe?", !!anexoUrl)
                          console.log("[VISUALIZAR CONTRATO] Anexo URL length:", anexoUrl?.length || 0)
                          console.log("[VISUALIZAR CONTRATO] Anexo URL preview:", anexoUrl?.substring(0, 100))

                          if (!anexoUrl) {
                            console.error("[VISUALIZAR CONTRATO] ❌ Nenhum anexo encontrado")
                            toast.error("Nenhum contrato anexado")
                            return
                          }

                          try {
                            // Se for data URL (base64), converter para Blob para evitar problemas de tamanho
                            if (anexoUrl.startsWith('data:')) {
                              console.log("[VISUALIZAR CONTRATO] Convertendo data URL para Blob...")

                              // Extrair o tipo MIME e os dados base64
                              const [header, base64Data] = anexoUrl.split(',')
                              const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream'

                              console.log("[VISUALIZAR CONTRATO] MIME type:", mimeType)

                              // Converter base64 para bytes
                              const byteCharacters = atob(base64Data)
                              const byteNumbers = new Array(byteCharacters.length)
                              for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i)
                              }
                              const byteArray = new Uint8Array(byteNumbers)

                              // Criar Blob
                              const blob = new Blob([byteArray], { type: mimeType })
                              console.log("[VISUALIZAR CONTRATO] Blob criado. Size:", blob.size, "bytes")

                              // Criar URL temporária
                              const blobUrl = URL.createObjectURL(blob)
                              console.log("[VISUALIZAR CONTRATO] Blob URL criada")

                              // Abrir em nova aba
                              const newWindow = window.open(blobUrl, '_blank')

                              if (!newWindow) {
                                console.error("[VISUALIZAR CONTRATO] ❌ window.open retornou null")
                                toast.error("Não foi possível abrir o contrato. Verifique se pop-ups estão bloqueados.")
                                // Limpar URL mesmo se falhar
                                URL.revokeObjectURL(blobUrl)
                              } else {
                                console.log("[VISUALIZAR CONTRATO] ✅ Contrato aberto com sucesso")
                                // Limpar a URL após 1 minuto
                                setTimeout(() => {
                                  URL.revokeObjectURL(blobUrl)
                                  console.log("[VISUALIZAR CONTRATO] Blob URL revogada")
                                }, 60000)
                              }
                            } else if (anexoUrl.startsWith('http')) {
                              // Se for URL HTTP/HTTPS, abrir diretamente
                              console.log("[VISUALIZAR CONTRATO] Abrindo URL HTTP...")
                              const newWindow = window.open(anexoUrl, '_blank')

                              if (!newWindow) {
                                console.error("[VISUALIZAR CONTRATO] ❌ window.open retornou null")
                                toast.error("Não foi possível abrir o contrato. Verifique se pop-ups estão bloqueados.")
                              } else {
                                console.log("[VISUALIZAR CONTRATO] ✅ Contrato aberto com sucesso")
                              }
                            } else {
                              console.error("[VISUALIZAR CONTRATO] ❌ Formato inválido")
                              toast.error("Formato de contrato inválido")
                            }
                          } catch (error) {
                            console.error("[VISUALIZAR CONTRATO] ❌ Erro ao processar contrato:", error)
                            toast.error("Erro ao abrir contrato. Tente novamente.")
                          }
                        }}
                        variant="outline"
                        className="border-blue-600 text-[#7eaaee] hover:bg-blue-900/20 h-9 rounded-lg text-sm"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Visualizar Contrato
                      </Button>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/[0.06] flex gap-1.5">
                    <button
                      onClick={() => setIsEditingContrato(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-[#2a2d35] hover:bg-white/[0.13] active:scale-95 text-gray-300 text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar contrato
                    </button>
                    <button
                      onClick={handleOpenDeleteContratoModal}
                      disabled={excluindoContrato}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-[#2a2d35] hover:bg-red-500/20 active:scale-95 text-gray-400 hover:text-red-400 text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150 disabled:opacity-50"
                    >
                      <Trash2 className={`w-3 h-3 ${excluindoContrato ? 'animate-pulse' : ''}`} />
                      {excluindoContrato ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-gray-500">Nenhum contrato definido</p>
                  <Button
                    onClick={() => setIsEditingContrato(true)}
                    className="bg-[#0B3064] hover:bg-[#082551] text-white h-9 text-sm rounded-lg px-4"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Definir contrato
                  </Button>
                </div>
              )
            )}
          </Card>

          {/* Pagamentos */}
          <Card className="p-2 bg-[#1f2228]/80 border border-white/[0.08] shadow-lg rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-400">Pagamentos ({pagamentos.length})</p>
              <Button
                size="sm"
                className="h-7 text-xs bg-[#0B3064] hover:bg-[#082551] text-white px-2"
                onClick={handleAbrirModalNovoPagamento}
              >
                <Plus className="w-3 h-3 mr-1" />
                Novo
              </Button>
            </div>

            {pagamentos.length > 0 ? (
              <div className="space-y-1.5">
                {pagamentos
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .map((pagamento) => (
                  <div
                    key={pagamento.id}
                    className={`bg-[#13151a]/90 border border-white/[0.08] rounded-lg px-3 py-2 flex items-center justify-between gap-2 transition-all ${
                      excluindoPagamento === pagamento.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{formatarMoeda(pagamento.valor)}</span>
                        {pagamento.anexo && (
                          <button onClick={() => window.open(pagamento.anexo!, '_blank')} className="text-gray-400 hover:text-[#7eaaee] transition-colors" title="Ver comprovante">
                            <FileText className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(pagamento.data).toLocaleDateString('pt-BR')}
                        {pagamento.formaPagamento && ` · ${pagamento.formaPagamento}`}
                        {pagamento.observacao && ` · ${pagamento.observacao}`}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleAbrirModalEditarPagamento(pagamento)}
                        disabled={excluindoPagamento === pagamento.id}
                        className="p-1.5 text-[#7eaaee] hover:bg-[#0e3d7a]/20 rounded transition-all disabled:opacity-50"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeletePagamentoModal(pagamento)}
                        disabled={excluindoPagamento === pagamento.id}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-all disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${excluindoPagamento === pagamento.id ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">Nenhum pagamento registrado</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Novo Pagamento — bottom sheet */}
      {modalNovoPagamento && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setModalNovoPagamento(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full bg-[#1f2228] border-t border-white/[0.08] rounded-t-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
              <h2 className="text-sm font-bold text-white">Novo Pagamento</h2>
              <button onClick={() => setModalNovoPagamento(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">
              {/* Valor + Data em grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Valor</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium pointer-events-none">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={novoPagamentoForm.valorFormatado}
                      onChange={handleValorPagamentoChange}
                      placeholder="0,00"
                      className="w-full h-10 pl-8 pr-3 bg-[#2a2d35] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0B3064] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Data</p>
                  <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#2a2d35]">
                    <input
                      type="date"
                      value={novoPagamentoForm.data}
                      onChange={(e) => setNovoPagamentoForm({...novoPagamentoForm, data: e.target.value})}
                      className="w-full h-10 px-3 bg-transparent text-sm text-white focus:outline-none transition-colors appearance-none"
                      style={{ WebkitAppearance: 'none', fontSize: '13px', lineHeight: '40px', minWidth: 0, colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>

              {/* Forma de pagamento */}
              <div>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Forma de Pagamento</p>
                <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#2a2d35]">
                  <select
                    value={novoPagamentoForm.formaPagamento}
                    onChange={(e) => setNovoPagamentoForm({...novoPagamentoForm, formaPagamento: e.target.value})}
                    className="w-full h-10 px-3 bg-[#2a2d35] text-sm text-white focus:outline-none appearance-none"
                    style={{ WebkitAppearance: 'none', colorScheme: 'dark' }}
                  >
                    <option value="pix">Pix</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>

              {/* Observação */}
              <div>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Observação <span className="normal-case text-gray-600">(opcional)</span></p>
                <textarea
                  value={novoPagamentoForm.observacao}
                  onChange={(e) => setNovoPagamentoForm({...novoPagamentoForm, observacao: e.target.value})}
                  rows={3}
                  placeholder="Ex: Pagamento referente à primeira etapa"
                  className="w-full px-3 py-2.5 bg-[#2a2d35] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0B3064] transition-colors resize-none"
                />
              </div>

              {/* Comprovante */}
              <FileUpload
                label="Comprovante de pagamento"
                value={anexoPagamento}
                onChange={(file, preview) => {
                  setAnexoPagamento(preview)
                  setAnexoPagamentoFile(file)
                }}
              />
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-white/[0.06] flex-shrink-0">
              <button
                onClick={() => setModalNovoPagamento(false)}
                className="flex-1 h-10 bg-white/[0.07] hover:bg-white/[0.11] text-gray-300 text-sm font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarNovoPagamento}
                disabled={uploadingComprovante}
                className="flex-1 h-10 bg-[#0B3064] hover:bg-[#082551] active:scale-95 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                {uploadingComprovante
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{anexoPagamentoFile ? "Enviando..." : "Salvando..."}</>
                  : <><Save className="w-3.5 h-3.5" />Salvar</>
                }
              </button>
            </div>
            <div className="h-safe-area-inset-bottom" />
          </div>
        </div>
      )}

      {/* Modal Editar Pagamento — bottom sheet */}
      {modalEditarPagamento && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => { setModalEditarPagamento(false); setPagamentoEditando(null) }}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full bg-[#1f2228] border-t border-white/[0.08] rounded-t-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
              <h2 className="text-sm font-bold text-white">Editar Pagamento</h2>
              <button onClick={() => { setModalEditarPagamento(false); setPagamentoEditando(null) }} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">
              {/* Valor + Data em grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Valor</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium pointer-events-none">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editarPagamentoForm.valorFormatado}
                      onChange={handleValorEditarPagamentoChange}
                      placeholder="0,00"
                      className="w-full h-10 pl-8 pr-3 bg-[#2a2d35] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0B3064] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Data</p>
                  <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#2a2d35]">
                    <input
                      type="date"
                      value={editarPagamentoForm.data}
                      onChange={(e) => setEditarPagamentoForm({...editarPagamentoForm, data: e.target.value})}
                      className="w-full h-10 px-3 bg-transparent text-sm text-white focus:outline-none focus:border-[#0B3064] transition-colors appearance-none"
                      style={{ WebkitAppearance: 'none', fontSize: '13px', lineHeight: '40px', minWidth: 0, colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>

              {/* Forma de pagamento */}
              <div>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Forma de Pagamento</p>
                <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#2a2d35]">
                  <select
                    value={editarPagamentoForm.formaPagamento}
                    onChange={(e) => setEditarPagamentoForm({...editarPagamentoForm, formaPagamento: e.target.value})}
                    className="w-full h-10 px-3 bg-[#2a2d35] text-sm text-white focus:outline-none appearance-none"
                    style={{ WebkitAppearance: 'none', colorScheme: 'dark' }}
                  >
                    <option value="pix">Pix</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>

              {/* Observação */}
              <div>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1.5">Observação <span className="normal-case text-gray-600">(opcional)</span></p>
                <textarea
                  value={editarPagamentoForm.observacao}
                  onChange={(e) => setEditarPagamentoForm({...editarPagamentoForm, observacao: e.target.value})}
                  rows={3}
                  placeholder="Ex: Pagamento referente à primeira etapa"
                  className="w-full px-3 py-2.5 bg-[#2a2d35] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0B3064] transition-colors resize-none"
                />
              </div>

              {/* Comprovante */}
              <FileUpload
                label="Comprovante de pagamento"
                value={anexoPagamentoEditar}
                onChange={(file, preview) => setAnexoPagamentoEditar(preview)}
              />
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-white/[0.06] flex-shrink-0">
              <button
                onClick={() => { setModalEditarPagamento(false); setPagamentoEditando(null) }}
                className="flex-1 h-10 bg-white/[0.07] hover:bg-white/[0.11] text-gray-300 text-sm font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarEditarPagamento}
                className="flex-1 h-10 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar
              </button>
            </div>
            <div className="h-safe-area-inset-bottom" />
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão de contrato */}
      {showDeleteContratoModal && profissional.contrato && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800/90 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200 border border-white/10">
            <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Excluir contrato?
            </h2>

            <div className="bg-slate-700/40 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="font-semibold text-white">
                    {profissional.contrato.tipoContrato === "empreitada" ? "Empreitada" :
                     profissional.contrato.tipoContrato === "diaria" ? "Diária" :
                     profissional.contrato.tipoContrato === "por_m2" ? "Por m²" :
                     profissional.contrato.tipoContrato === "por_etapa" ? "Por etapa" : profissional.contrato.tipoContrato}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Valor Previsto</p>
                  <p className="font-semibold text-white">{formatarMoeda(profissional.contrato.valorPrevisto)}</p>
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-center mb-6">
              Esta ação é permanente e removerá todas as informações do contrato.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCloseDeleteContratoModal}
                className="flex-1 px-4 py-3 border border-white/[0.1] rounded-xl font-medium text-gray-300 hover:bg-[#1f2228]/80 transition-all"
                disabled={excluindoContrato}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteContrato}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={excluindoContrato}
              >
                {excluindoContrato ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão de pagamento — bottom sheet */}
      {showDeletePagamentoModal && pagamentoToDelete && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={handleCloseDeletePagamentoModal}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full bg-[#1f2228] border-t border-white/[0.08] rounded-t-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-bold text-white">Excluir pagamento?</h2>
              <button onClick={handleCloseDeletePagamentoModal} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="bg-white/[0.04] rounded-xl overflow-hidden mb-4">
                <div className={`flex items-center justify-between px-3 py-2 border-b border-white/[0.06]`}>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Valor</span>
                  <span className="text-sm font-bold text-white">{formatarMoeda(pagamentoToDelete.valor)}</span>
                </div>
                <div className={`flex items-center justify-between px-3 py-2 ${pagamentoToDelete.formaPagamento ? "border-b border-white/[0.06]" : ""}`}>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Data</span>
                  <span className="text-sm font-bold text-white">{new Date(pagamentoToDelete.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                </div>
                {pagamentoToDelete.formaPagamento && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Forma</span>
                    <span className="text-sm font-bold text-white capitalize">{pagamentoToDelete.formaPagamento}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4">Esta ação é permanente e não pode ser desfeita.</p>
              <div className="flex gap-2">
                <button onClick={handleCloseDeletePagamentoModal} disabled={excluindoPagamento !== null} className="flex-1 h-11 bg-white/[0.07] text-gray-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleConfirmDeletePagamento} disabled={excluindoPagamento !== null} className="flex-1 h-11 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {excluindoPagamento ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Excluindo...</> : <><Trash2 className="w-4 h-4" />Excluir</>}
                </button>
              </div>
            </div>
            <div className="h-4" />
          </div>
        </div>
      )}

    </div>
  )
}

export default function ProfissionalDetalhePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    }>
      <ProfissionalDetalhePageContent />
    </Suspense>
  )
}
