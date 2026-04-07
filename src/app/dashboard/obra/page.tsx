"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, Wallet, PiggyBank, Home, Plus, Users, FileText, AlertCircle, CheckCircle, AlertTriangle, MoreVertical, Pencil, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, HandCoins, Edit3, Camera, CreditCard, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { NotificationPanel } from "@/components/custom/NotificationPanel"
import { FileUpload } from "@/components/custom/FileUpload"
import { BudgetAlertBanner } from "@/components/custom/BudgetAlertBanner"
import {
  verificarTodosAlertas,
  getAlertaOrcamentoByObra,
  getAlertasPrazoByObra,
  getAlertasPagamentoByObra
} from "@/lib/alerts"
import { getUserProfile, getRecebimentosByObra, saveRecebimento, saveRecebimentoSupabase, uploadFileToStorage, calcularTotalRecebido, getClientesSupabase, type Cliente } from "@/lib/storage"
import { checkBudgetAlerts, type BudgetAlert } from "@/lib/budget-alerts"
import { inicializarAvisos } from "@/lib/alert-manager"
import { getDataHoje, formatarData, parseLocalDate } from "@/lib/utils"
import { toast } from "sonner"

const ESTADOS_BRASILEIROS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO"
]

interface Obra {
  id: string
  userId: string
  nome: string
  nomeCliente?: string
  tipo: string
  area: number
  localizacao: {
    estado: string
    cidade: string
    bairro?: string
  }
  orcamento: number | null
  valorContratado?: number | null
  dataInicio?: string | null
  dataTermino?: string | null
  criadaEm: string
}

interface Despesa {
  id: string
  obraId: string
  valor: number
  data: string
  tipo?: string
  category?: string
  categoria?: string
  profissionalId?: string
  descricao?: string
  anexo?: string | null
}

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

// Funções de formatação
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

const formatarArea = (valor: string): string => {
  const apenasNumeros = valor.replace(/\D/g, "")
  if (!apenasNumeros) return ""
  const numero = parseFloat(apenasNumeros) / 100
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const areaParaNumero = (areaFormatada: string): number => {
  const apenasNumeros = areaFormatada.replace(/\D/g, "")
  if (!apenasNumeros) return 0
  return parseFloat(apenasNumeros) / 100
}

export default function DashboardObraPage() {
  const router = useRouter()
  const [obra, setObra] = useState<Obra | null>(null)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [pagamentos, setPagamentos] = useState<{ valor: number; data?: string }[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<"owner" | "builder" | null>(null)
  
  // Estados para edição e exclusão
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    nome: "",
    nomeCliente: "",
    tipo: "",
    area: "",
    estado: "",
    cidade: "",
    bairro: "",
    orcamento: "",
    dataInicio: "",
    dataTermino: ""
  })
  const [orcamentoFormatado, setOrcamentoFormatado] = useState("")
  const [areaFormatada, setAreaFormatada] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Status dos alertas
  const [alertaOrcamentoAtivo, setAlertaOrcamentoAtivo] = useState(false)
  const [alertasPrazoCount, setAlertasPrazoCount] = useState(0)
  const [alertasPagamentoCount, setAlertasPagamentoCount] = useState(0)

  // Estados para visualização de comprovante
  const [showComprovanteModal, setShowComprovanteModal] = useState(false)
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null)

  // Estado para modal de orientação de primeira obra
  const [showOrientacaoModal, setShowOrientacaoModal] = useState(false)

  // Recebimentos carregados do Supabase (para o card do dashboard)
  const [recebimentosDB, setRecebimentosDB] = useState<{ valor: number }[]>([])
  const [totalContratoClientes, setTotalContratoClientes] = useState(0)
  const [numClientes, setNumClientes] = useState(0)

  // Estados para recebimentos do cliente (perfil construtor)
  const [showRecebimentoModal, setShowRecebimentoModal] = useState(false)
  const [showEditValorContratadoModal, setShowEditValorContratadoModal] = useState(false)
  const [recebimentoFormData, setRecebimentoFormData] = useState({
    valor: "",
    data: "",
    formaPagamento: "Pix",
    observacao: "",
    comprovanteUrl: null as string | null,
    clienteId: "" as string
  })
  const [clientesObra, setClientesObra] = useState<Cliente[]>([])
  const [comprovanteFileRecebimento, setComprovanteFileRecebimento] = useState<File | null>(null)
  const [isSavingRecebimento, setIsSavingRecebimento] = useState(false)

  // Estado para avisos inteligentes de orçamento
  const [currentBudgetAlert, setCurrentBudgetAlert] = useState<BudgetAlert | null>(null)
  const [valorRecebimentoFormatado, setValorRecebimentoFormatado] = useState("")
  const [valorContratadoTemp, setValorContratadoTemp] = useState("")
  const [valorContratadoFormatado, setValorContratadoFormatado] = useState("")
  const [contratoUrl, setContratoUrl] = useState<string | null>(null)
  const [nomeClienteTemp, setNomeClienteTemp] = useState("")

  // Diário da Obra - preview
  const [diarioFotos, setDiarioFotos] = useState<{ id: string; foto_url: string }[]>([])
  const [diarioTotal, setDiarioTotal] = useState(0)

  // Função para carregar/recarregar dados da obra do SUPABASE
  const carregarDadosObra = async () => {
    try {
      // Verificar autenticação no Supabase
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/login")
        return
      }

      // Obter ID da obra ativa
      const activeObraId = localStorage.getItem("activeObraId")

      if (!activeObraId) {
        console.log("Nenhuma obra ativa encontrada, redirecionando para /obras")
        setLoading(false)
        router.push("/obras")
        return
      }

      // Carregar obra do Supabase
      const { data: obraData, error: obraError } = await supabase
        .from("obras")
        .select("*")
        .eq("id", activeObraId)
        .eq("user_id", user.id)
        .single()

      if (obraError || !obraData) {
        console.error("Erro ao carregar obra:", obraError)
        console.log("Obra não encontrada, redirecionando para /obras")
        setLoading(false)
        router.push("/obras")
        return
      }

      // Converter obra para formato da interface
      const dbObra = obraData as any
      const obraAtiva: Obra = {
        id: dbObra.id,
        userId: dbObra.user_id,
        nome: dbObra.nome,
        nomeCliente: dbObra.nome_cliente || undefined,
        tipo: dbObra.tipo,
        area: dbObra.area,
        localizacao: dbObra.localizacao,
        orcamento: dbObra.orcamento,
        valorContratado: dbObra.valor_contratado || null,
        dataInicio: dbObra.data_inicio || null,
        dataTermino: dbObra.data_termino || null,
        criadaEm: dbObra.criada_em,
      }

      setObra(obraAtiva)
      router.prefetch(`/dashboard/obras/${obraAtiva.id}/relatorio`)

      // Carregar TODAS as despesas do Supabase (incluindo mão de obra com profissionalId)
      const { getDespesasSupabase } = await import("@/lib/storage")
      const todasDespesasSupabase = await getDespesasSupabase(obraAtiva.id, user.id)
      const despesasObra = todasDespesasSupabase
        .sort((a: any, b: any) => {
          const dataA = new Date(a.data || 0).getTime()
          const dataB = new Date(b.data || 0).getTime()

          if (dataB !== dataA) {
            return dataB - dataA
          }

          const idA = parseInt(a.id || "0")
          const idB = parseInt(b.id || "0")
          return idB - idA
        })
      setDespesas(despesasObra)

      // Carregar profissionais do Supabase
      let profissionaisObra: Profissional[] = []
      try {
        const { data: profissionaisData } = await supabase
          .from("profissionais")
          .select("*")
          .eq("obra_id", obraAtiva.id)
          .eq("user_id", dbObra.user_id)

        if (profissionaisData && profissionaisData.length > 0) {
          profissionaisObra = profissionaisData
          setProfissionais(profissionaisData)
        } else {
          setProfissionais([])
        }
      } catch (profError) {
        console.error("Erro ao carregar profissionais:", profError)
        setProfissionais([])
      }

      // Carregar pagamentos do Supabase (pagamentos a profissionais)
      let pagamentosObra: any[] = []
      try {
        const { data: pagamentosData, error: pagamentosError } = await supabase
          .from("pagamentos")
          .select("id, valor, profissional_id, data, comprovante_url")
          .eq("obra_id", obraAtiva.id)

        if (pagamentosError) {
          console.error("[OBRA] Erro ao carregar pagamentos:", pagamentosError)
        }

        if (pagamentosData && pagamentosData.length > 0) {
          pagamentosObra = pagamentosData.map((p: any) => ({
            id: p.id,
            valor: parseFloat(p.valor) || 0,
            profissional_id: p.profissional_id,
            data: p.data,
            comprovante_url: p.comprovante_url
          }))
        }
        setPagamentos(pagamentosObra)
      } catch (pagError) {
        console.error("Erro ao carregar pagamentos:", pagError)
        setPagamentos([])
      }

      // Carregar recebimentos do Supabase para o card do dashboard
      try {
        const { data: recData } = await supabase
          .from("recebimentos")
          .select("valor")
          .eq("obra_id", obraAtiva.id)
          .eq("user_id", user.id)
        setRecebimentosDB((recData || []).map((r: any) => ({ valor: parseFloat(r.valor) || 0 })))
      } catch {
        setRecebimentosDB([])
      }

      // Carregar clientes para total contratado
      try {
        const clientesData = await getClientesSupabase(obraAtiva.id, user.id)
        setNumClientes(clientesData.length)
        setTotalContratoClientes(clientesData.reduce((acc, c) => acc + (c.contratoValor || 0), 0))
      } catch {
        setNumClientes(0)
        setTotalContratoClientes(0)
      }

      const totalDespesas = despesasObra.reduce((acc: number, d: Despesa) => acc + (d.valor ?? 0), 0)
      const totalPagamentos = pagamentosObra.reduce((acc: number, p) => acc + p.valor, 0)
      const totalGasto = totalDespesas + totalPagamentos
      verificarTodosAlertas(obraAtiva.id, obraAtiva.orcamento || 0, totalGasto)
      loadAlertasStatus(obraAtiva.id)

      // CRÍTICO: Inicializar sistema de avisos inteligentes
      inicializarAvisos(obraAtiva.id)

      // Verificar alertas inteligentes de orçamento
      checkBudgetAlertsForObra(obraAtiva, despesasObra, profissionaisObra, pagamentosObra)

      // Carregar preview do Diário da Obra
      try {
        const { data: diarioData } = await supabase
          .from("diario_obra")
          .select("id, foto_url")
          .eq("obra_id", obraAtiva.id)
          .eq("user_id", user.id)
          .order("data_registro", { ascending: false })
          .order("criado_em", { ascending: false })
          .limit(4)
        if (diarioData) {
          setDiarioFotos(diarioData)
          const { count } = await supabase
            .from("diario_obra")
            .select("id", { count: "exact", head: true })
            .eq("obra_id", obraAtiva.id)
            .eq("user_id", user.id)
          setDiarioTotal(count || 0)
        }
      } catch { /* não bloqueia o carregamento principal */ }

      setLoading(false)

      // Disparar evento para atualizar o Header
      window.dispatchEvent(new Event("obraAtualizada"))
    } catch (error) {
      console.error("Erro ao carregar dados da obra:", error)
      setLoading(false)
      router.push("/obras")
    }
  }

  useEffect(() => {
    // Carregar perfil do usuário
    const profile = getUserProfile()
    console.log("🔍 PERFIL CARREGADO:", profile)
    console.log("🔍 DADOS DO USUÁRIO NO LOCALSTORAGE:", localStorage.getItem("user"))
    setUserProfile(profile)

    // Carregar dados iniciais
    carregarDadosObra()

    // Listener para recarregar quando houver nova despesa/pagamento/profissional
    const handleDespesaAtualizada = () => {
      carregarDadosObra()
    }

    const handleProfissionalCadastrado = () => {
      // Fechar modal de orientação se estiver aberto
      setShowOrientacaoModal(false)
      // Recarregar dados da obra
      carregarDadosObra()
    }

    // Escutar múltiplos eventos de atualização
    window.addEventListener("despesaSalva", handleDespesaAtualizada)
    window.addEventListener("despesaAtualizada", handleDespesaAtualizada)
    window.addEventListener("pagamentoSalvo", handleDespesaAtualizada)
    window.addEventListener("pagamentoAtualizado", handleDespesaAtualizada)
    window.addEventListener("recebimentoSalvo", handleDespesaAtualizada)
    window.addEventListener("profissionalCadastrado", handleProfissionalCadastrado)

    // Cleanup: remover listeners ao desmontar
    return () => {
      window.removeEventListener("despesaSalva", handleDespesaAtualizada)
      window.removeEventListener("despesaAtualizada", handleDespesaAtualizada)
      window.removeEventListener("pagamentoSalvo", handleDespesaAtualizada)
      window.removeEventListener("pagamentoAtualizado", handleDespesaAtualizada)
      window.removeEventListener("recebimentoSalvo", handleDespesaAtualizada)
      window.removeEventListener("profissionalCadastrado", handleProfissionalCadastrado)
    }
  }, [router])

  // Verificar se deve mostrar modal de orientação após carregar profissionais
  useEffect(() => {
    if (loading) return // Aguardar carregar

    const activeObraId = localStorage.getItem("activeObraId")
    if (!activeObraId) return

    // Se NÃO houver profissionais vinculados, verificar se já foi visualizado
    if (profissionais.length === 0) {
      const orientacoesVisualizadas = JSON.parse(localStorage.getItem("orientacoesVisualizadas") || "{}")

      // Se ainda não foi visualizada a orientação para esta obra
      if (!orientacoesVisualizadas[activeObraId]) {
        // Aguardar um pequeno delay para garantir que a página carregou
        const timer = setTimeout(() => {
          setShowOrientacaoModal(true)
        }, 500)

        return () => clearTimeout(timer)
      }
    }
  }, [profissionais, loading])

  const loadAlertasStatus = (obraId: string) => {
    const alertaOrc = getAlertaOrcamentoByObra(obraId)
    setAlertaOrcamentoAtivo(alertaOrc?.ativo || false)

    const alertasPrazo = getAlertasPrazoByObra(obraId)
    setAlertasPrazoCount(alertasPrazo.length)

    const alertasPagamento = getAlertasPagamentoByObra(obraId)
    setAlertasPagamentoCount(alertasPagamento.length)
  }

  const checkBudgetAlertsForObra = (obra: Obra, despesas: Despesa[], profissionais: Profissional[], pagamentos: { valor: number }[] = []) => {
    if (!obra.orcamento || obra.orcamento <= 0) {
      setCurrentBudgetAlert(null)
      return
    }

    // Calcular totais incluindo despesas e pagamentos
    const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor ?? 0), 0)
    const totalPagamentos = pagamentos.reduce((acc, p) => acc + p.valor, 0)
    const totalGasto = totalDespesas + totalPagamentos

    // Calcular mão de obra prevista e gasto realizado
    const maoObraPrevista = profissionais.reduce((acc, p) => {
      const valorPrevisto = p.valorPrevisto || p.contrato?.valorPrevisto || p.contrato?.valorTotalPrevisto || 0
      return acc + valorPrevisto
    }, 0)

    const gastoMaoObraDespesas = despesas
      .filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        const isMaoObra = category === "mao_obra" || category === "mão de obra"
        const temProfissional = !!d.profissionalId
        return isMaoObra || temProfissional
      })
      .reduce((acc, d) => acc + (d.valor ?? 0), 0)

    // Adicionar pagamentos aos profissionais (todos são mão de obra)
    const totalPagamentosObra = pagamentos.reduce((acc, p) => acc + p.valor, 0)
    const gastoMaoObra = gastoMaoObraDespesas + totalPagamentosObra

    // Calcular materiais (orçamento restante após mão de obra)
    const orcamentoMateriais = Math.max(obra.orcamento - maoObraPrevista, 0)
    const gastoMateriais = totalGasto - gastoMaoObra

    // Verificar alertas
    const alert = checkBudgetAlerts(
      obra.id,
      obra.orcamento,
      totalGasto,
      orcamentoMateriais,
      gastoMateriais,
      maoObraPrevista,
      gastoMaoObra
    )

    setCurrentBudgetAlert(alert)
  }

  const formatarMoedaDisplay = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const calcularDiasRestantes = (dataTermino: string): { dias: number; atrasado: boolean } => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const termino = parseLocalDate(dataTermino)
    termino.setHours(0, 0, 0, 0)

    const diferencaMs = termino.getTime() - hoje.getTime()
    const dias = Math.ceil(diferencaMs / (1000 * 60 * 60 * 24))

    return {
      dias: Math.abs(dias),
      atrasado: dias < 0
    }
  }

  const handleVisualizarComprovante = (e: React.MouseEvent, anexo: string) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('📎 Visualizando comprovante:', anexo)
    console.log('📎 É imagem?', isImageFile(anexo))
    console.log('📎 É PDF?', isPdfFile(anexo))
    setComprovanteUrl(anexo)
    setShowComprovanteModal(true)
  }

  const handleCloseComprovanteModal = () => {
    setShowComprovanteModal(false)
    setComprovanteUrl(null)
  }

  const isImageFile = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const lowerUrl = url.toLowerCase()
    return imageExtensions.some(ext => lowerUrl.includes(ext))
  }

  const isPdfFile = (url: string): boolean => {
    return url.toLowerCase().includes('.pdf')
  }

  const calcularTotalGasto = (): number => {
    const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor ?? 0), 0)
    const totalPagamentos = pagamentos.reduce((acc, p) => acc + p.valor, 0)
    return totalDespesas + totalPagamentos
  }

  const calcularSaldoDisponivel = (): number => {
    if (!obra || !obra.orcamento) return 0
    return obra.orcamento - calcularTotalGasto()
  }

  const calcularCustoPorM2 = (): string => {
    if (!obra || !obra.area) return "R$ 0,00"
    const totalGasto = calcularTotalGasto()
    if (totalGasto === 0) return "R$ 0,00"
    const custo = totalGasto / obra.area
    return formatarMoedaDisplay(custo)
  }

  const calcularCustoEstimadoPorM2 = (): number => {
    if (!obra || !obra.area || !obra.orcamento) return 0
    return obra.orcamento / obra.area
  }

  const calcularProgressoCustoPorM2 = (): number => {
    const custoEstimado = calcularCustoEstimadoPorM2()
    if (custoEstimado === 0) return 0

    const totalGasto = calcularTotalGasto()
    const custoAtual = obra && obra.area ? totalGasto / obra.area : 0

    return (custoAtual / custoEstimado) * 100
  }

  const calcularPercentualGasto = (): number => {
    if (!obra || !obra.orcamento || obra.orcamento === 0) return 0
    return (calcularTotalGasto() / obra.orcamento) * 100
  }

  const calcularMaoObraPrevista = (): number => {
    return profissionais.reduce((acc, p) => {
      const valorPrevisto = p.valorPrevisto || p.contrato?.valorPrevisto || p.contrato?.valorTotalPrevisto || 0
      return acc + valorPrevisto
    }, 0)
  }

  const calcularMaoObraRealizada = (): number => {
    const maoObraDespesas = despesas
      .filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        const isMaoObra = category === "mao_obra" || category === "mão de obra"
        const temProfissional = !!d.profissionalId
        return isMaoObra || temProfissional
      })
      .reduce((acc, d) => acc + (d.valor ?? 0), 0)
    const totalPagamentos = pagamentos.reduce((acc, p) => acc + p.valor, 0)
    return maoObraDespesas + totalPagamentos
  }

  const calcularDistribuicao = () => {
    const totalGasto = calcularTotalGasto()
    const orcamentoTotal = obra?.orcamento || 0
    
    if (totalGasto === 0 && orcamentoTotal === 0) {
      return { 
        material: 0, 
        maoObra: 0, 
        outros: 0,
        percMaterial: 0, 
        percMaoObra: 0,
        percOutros: 0,
        materialOutros: 0,
        percMaterialOutros: 0
      }
    }

    const maoObraDespesas = despesas
      .filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        const isMaoObra = category === "mao_obra" || category === "mão de obra"
        const temProfissional = !!d.profissionalId
        return isMaoObra || temProfissional
      })
      .reduce((acc, d) => acc + (d.valor ?? 0), 0)

    // Adicionar pagamentos aos profissionais (todos são mão de obra)
    const totalPagamentos = pagamentos.reduce((acc, p) => acc + p.valor, 0)
    const maoObra = maoObraDespesas + totalPagamentos

    const material = despesas
      .filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        const isMaoObra = category === "mao_obra" || category === "mão de obra"
        const temProfissional = !!d.profissionalId
        const isMaterial = category === "material"
        return isMaterial && !isMaoObra && !temProfissional
      })
      .reduce((acc, d) => acc + (d.valor ?? 0), 0)

    const outros = despesas
      .filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        const isMaoObra = category === "mao_obra" || category === "mão de obra"
        const temProfissional = !!d.profissionalId
        const isMaterial = category === "material"
        return !isMaoObra && !temProfissional && !isMaterial
      })
      .reduce((acc, d) => acc + (d.valor ?? 0), 0)

    const materialOutros = material + outros
    
    const baseCalculo = orcamentoTotal > 0 ? orcamentoTotal : totalGasto
    
    const percMaterial = baseCalculo > 0 ? (material / baseCalculo) * 100 : 0
    const percMaoObra = baseCalculo > 0 ? (maoObra / baseCalculo) * 100 : 0
    const percOutros = baseCalculo > 0 ? (outros / baseCalculo) * 100 : 0
    const percMaterialOutros = baseCalculo > 0 ? (materialOutros / baseCalculo) * 100 : 0

    return {
      material,
      maoObra,
      outros,
      materialOutros,
      percMaterial,
      percMaoObra,
      percOutros,
      percMaterialOutros
    }
  }

  const getDespesasPorCategoria = (categoria: "material" | "mao_obra") => {
    if (categoria === "material") {
      return despesas.filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        const isMaoObra = category === "mao_obra" || category === "mão de obra"
        const temProfissional = !!d.profissionalId
        return !isMaoObra && !temProfissional
      })
    }
    return despesas.filter(d => {
      const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
      const isMaoObra = category === "mao_obra" || category === "mão de obra"
      const temProfissional = !!d.profissionalId
      return isMaoObra || temProfissional
    })
  }

  // Funções para obter última despesa e último pagamento
  const getUltimaDespesa = () => {
    const despesasMaterialOutros = despesas
      .filter(d => {
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        const isMaoObra = category === "mao_obra" || category === "mão de obra"
        const temProfissional = !!d.profissionalId
        return !isMaoObra && !temProfissional
      })
      .sort((a, b) => {
        // Ordenar por data decrescente (mais recente primeiro)
        const dataA = new Date(a.data || 0).getTime()
        const dataB = new Date(b.data || 0).getTime()

        if (dataB !== dataA) {
          return dataB - dataA
        }

        // Se as datas forem iguais, usar ID como desempate (IDs maiores são mais recentes)
        const idA = parseInt(a.id || "0")
        const idB = parseInt(b.id || "0")
        return idB - idA
      })
    return despesasMaterialOutros.length > 0 ? despesasMaterialOutros[0] : null
  }

  const getUltimoPagamento = () => {
    // Buscar TODOS os pagamentos de profissionais (despesas com profissionalId)
    const pagamentosMaoObra = despesas
      .filter(d => {
        // Um pagamento é qualquer despesa que tenha profissionalId OU seja categoria mão de obra
        const temProfissional = !!(d.profissionalId || (d as any).professionalId)
        const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
        const isMaoObra = category === "mao_obra" || category === "mão de obra"
        return temProfissional || isMaoObra
      })
      .sort((a, b) => {
        // Ordenar por data decrescente (mais recente primeiro)
        const dataA = new Date(a.data || 0).getTime()
        const dataB = new Date(b.data || 0).getTime()

        if (dataB !== dataA) {
          return dataB - dataA
        }

        // Se as datas forem iguais, usar ID como desempate (IDs maiores são mais recentes)
        const idA = parseInt(a.id || "0")
        const idB = parseInt(b.id || "0")
        return idB - idA
      })

    // Debug: mostrar todos os pagamentos encontrados
    console.log('🟢 TODOS OS PAGAMENTOS ENCONTRADOS:', pagamentosMaoObra.map(p => ({
      id: p.id,
      valor: p.valor,
      data: p.data,
      profId: p.profissionalId || (p as any).professionalId
    })))

    // Retornar o primeiro (mais recente)
    const resultado = pagamentosMaoObra.length > 0 ? pagamentosMaoObra[0] : null
    console.log('🟡 PAGAMENTO SELECIONADO:', resultado ? {
      id: resultado.id,
      valor: resultado.valor,
      data: resultado.data
    } : 'NENHUM')

    return resultado
  }

  const getProfissionalNome = (profissionalId: string) => {
    const prof = profissionais.find(p => p.id === profissionalId)
    return prof ? prof.nome : "Desconhecido"
  }

  const handleGerarRelatorio = () => {
    if (!obra) return
    router.push(`/dashboard/obras/${obra.id}/relatorio`)
  }

  // Funções do modal de orientação
  const handleCadastrarProfissionalAgora = () => {
    if (!obra) return

    // Marcar como visualizada
    const orientacoesVisualizadas = JSON.parse(localStorage.getItem("orientacoesVisualizadas") || "{}")
    orientacoesVisualizadas[obra.id] = true
    localStorage.setItem("orientacoesVisualizadas", JSON.stringify(orientacoesVisualizadas))

    // Fechar modal
    setShowOrientacaoModal(false)

    // Navegar para cadastro de profissional
    router.push("/dashboard/profissionais/novo")
  }

  const handleDepoisOrientacao = () => {
    if (!obra) return

    // Marcar como visualizada
    const orientacoesVisualizadas = JSON.parse(localStorage.getItem("orientacoesVisualizadas") || "{}")
    orientacoesVisualizadas[obra.id] = true
    localStorage.setItem("orientacoesVisualizadas", JSON.stringify(orientacoesVisualizadas))

    // Fechar modal
    setShowOrientacaoModal(false)
  }

  const handleCancelarOrientacao = () => {
    if (!obra) return

    // Marcar como visualizada
    const orientacoesVisualizadas = JSON.parse(localStorage.getItem("orientacoesVisualizadas") || "{}")
    orientacoesVisualizadas[obra.id] = true
    localStorage.setItem("orientacoesVisualizadas", JSON.stringify(orientacoesVisualizadas))

    // Fechar modal
    setShowOrientacaoModal(false)
  }

  // Funções de edição
  const handleOpenEditModal = () => {
    if (!obra) return

    setEditFormData({
      nome: obra.nome,
      nomeCliente: obra.nomeCliente || "",
      tipo: obra.tipo,
      area: obra.area.toString(),
      estado: obra.localizacao.estado,
      cidade: obra.localizacao.cidade,
      bairro: obra.localizacao.bairro || "",
      orcamento: obra.orcamento?.toString() || "",
      dataInicio: obra.dataInicio || "",
      dataTermino: obra.dataTermino || ""
    })
    
    // Formatar valores para exibição
    if (obra.orcamento) {
      const valorFormatado = (obra.orcamento * 100).toString().replace(/\D/g, "")
      setOrcamentoFormatado(formatarMoeda(valorFormatado))
    } else {
      setOrcamentoFormatado("")
    }
    
    const areaFormatadaValue = (obra.area * 100).toString().replace(/\D/g, "")
    setAreaFormatada(formatarArea(areaFormatadaValue))
    
    setShowActionsMenu(false)
    setShowEditModal(true)
  }

  const handleOrcamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarMoeda(valorDigitado)
    setOrcamentoFormatado(valorFormatado)
    
    const valorNumerico = removerFormatacao(valorFormatado)
    setEditFormData({ ...editFormData, orcamento: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarArea(valorDigitado)
    setAreaFormatada(valorFormatado)
    
    const valorNumerico = areaParaNumero(valorFormatado)
    setEditFormData({ ...editFormData, area: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const handleSaveEdit = async () => {
    if (!obra) return

    // Validar campos obrigatórios
    const camposObrigatorios = ['nome', 'tipo', 'area', 'estado', 'cidade']

    if (userProfile === "builder") {
      camposObrigatorios.push('nomeCliente')
    }

    const camposFaltando = camposObrigatorios.filter(campo => {
      const valor = editFormData[campo as keyof typeof editFormData]
      return !valor || valor.toString().trim() === ''
    })

    if (camposFaltando.length > 0) {
      toast.error("Por favor, preencha todos os campos obrigatórios")
      return
    }

    try {
      const { supabase } = await import("@/lib/supabase")

      const { error } = await supabase
        .from("obras")
        .update({
          nome: editFormData.nome,
          nome_cliente: editFormData.nomeCliente || null,
          tipo: editFormData.tipo,
          area: parseFloat(editFormData.area),
          localizacao: {
            estado: editFormData.estado,
            cidade: editFormData.cidade,
            bairro: editFormData.bairro
          },
          orcamento: editFormData.orcamento ? parseFloat(editFormData.orcamento) : null,
          data_inicio: editFormData.dataInicio || null,
          data_termino: editFormData.dataTermino || null
        })
        .eq("id", obra.id)

      if (error) {
        console.error("Erro ao atualizar obra:", error)
        toast.error("Erro ao salvar alterações. Tente novamente.")
        return
      }

      setShowEditModal(false)
      carregarDadosObra()
      window.dispatchEvent(new Event('obraUpdated'))
      toast.success("Obra atualizada com sucesso")
    } catch (err) {
      console.error("Erro inesperado:", err)
      toast.error("Erro inesperado. Tente novamente.")
    }
  }

  // Funções de exclusão
  const handleOpenDeleteModal = () => {
    setShowActionsMenu(false)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (!obra) return

    setIsDeleting(true)

    try {
      // Remover obra
      const obrasExistentes = JSON.parse(localStorage.getItem("obras") || "[]")
      const obrasAtualizadas = obrasExistentes.filter((o: Obra) => o.id !== obra.id)
      localStorage.setItem("obras", JSON.stringify(obrasAtualizadas))

      // Remover despesas associadas
      const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]")
      const despesasAtualizadas = todasDespesas.filter((d: Despesa) => d.obraId !== obra.id)
      localStorage.setItem("despesas", JSON.stringify(despesasAtualizadas))

      // Remover profissionais associados
      const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
      const profissionaisAtualizados = todosProfissionais.filter((p: Profissional) => p.obraId !== obra.id)
      localStorage.setItem("profissionais", JSON.stringify(profissionaisAtualizados))

      // Remover alertas associados
      const todosAlertas = JSON.parse(localStorage.getItem("alertas") || "[]")
      const alertasAtualizados = todosAlertas.filter((a: any) => a.obraId !== obra.id)
      localStorage.setItem("alertas", JSON.stringify(alertasAtualizados))

      // Limpar obra ativa
      localStorage.removeItem("activeObraId")

      // Redirecionar para Minhas Obras
      router.push("/obras")
    } catch (error) {
      console.error("Erro ao excluir obra:", error)
      alert("Erro ao excluir obra. Tente novamente.")
      setIsDeleting(false)
    }
  }

  // Funções para recebimentos (perfil construtor)
  const handleValorRecebimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarMoeda(valorDigitado)
    setValorRecebimentoFormatado(valorFormatado)

    const valorNumerico = removerFormatacao(valorFormatado)
    setRecebimentoFormData({ ...recebimentoFormData, valor: valorNumerico > 0 ? valorNumerico.toString() : "" })
  }

  const handleSalvarRecebimento = async () => {
    if (!obra) return

    console.log("[RECEBIMENTO] Iniciando save. valor:", recebimentoFormData.valor, "data:", recebimentoFormData.data, "fileAnexado:", !!comprovanteFileRecebimento)

    // Validação de campos obrigatórios
    if (!recebimentoFormData.clienteId) {
      toast.error("Selecione um cliente para o recebimento")
      return
    }

    if (!recebimentoFormData.valor || !recebimentoFormData.data) {
      toast.error("Por favor, preencha o valor e a data do recebimento")
      return
    }

    if (!recebimentoFormData.formaPagamento) {
      toast.error("Por favor, selecione a forma de pagamento")
      return
    }

    setIsSavingRecebimento(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        toast.error("Erro de autenticação. Faça login novamente.")
        return
      }

      // Fazer upload do comprovante para o Supabase Storage, se houver arquivo
      let comprovanteUrl: string | null = null
      if (comprovanteFileRecebimento) {
        console.log("[RECEBIMENTO] Fazendo upload do comprovante...")
        const timestamp = Date.now()
        const ext = comprovanteFileRecebimento.name.split('.').pop() || "jpg"
        const path = `${user.id}/${obra.id}/recebimentos/${timestamp}.${ext}`
        comprovanteUrl = await uploadFileToStorage(comprovanteFileRecebimento, "comprovantes", path)
        console.log("[RECEBIMENTO] Upload result:", comprovanteUrl ? "OK" : "FALHOU")
        if (!comprovanteUrl) {
          toast.error("Erro ao enviar comprovante. Verifique o bucket 'comprovantes' no Supabase Storage.")
          return
        }
      }

      const valorNum = parseFloat(recebimentoFormData.valor)
      if (isNaN(valorNum) || valorNum <= 0) {
        toast.error("Valor inválido")
        return
      }

      const recebimentoPayload = {
        obraId: obra.id,
        clienteId: recebimentoFormData.clienteId || undefined,
        valor: valorNum,
        data: recebimentoFormData.data,
        formaPagamento: recebimentoFormData.formaPagamento,
        observacao: recebimentoFormData.observacao,
        comprovanteUrl,
      }

      console.log("[RECEBIMENTO] Salvando no Supabase...")
      const savedId = await saveRecebimentoSupabase(recebimentoPayload, user.id)
      console.log("[RECEBIMENTO] savedId:", savedId)

      if (!savedId) {
        toast.error("Erro ao registrar recebimento. Tente novamente.")
        return
      }

      // Salvar no localStorage para compatibilidade local
      saveRecebimento({ ...recebimentoPayload, id: savedId, criadoEm: new Date().toISOString() })

      toast.success("Recebimento registrado com sucesso")
      setShowRecebimentoModal(false)
      setRecebimentoFormData({ valor: "", data: "", formaPagamento: "Pix", observacao: "", comprovanteUrl: null, clienteId: "" })
      setComprovanteFileRecebimento(null)
      setValorRecebimentoFormatado("")
      carregarDadosObra()
    } catch (error) {
      console.error("[RECEBIMENTO] Erro inesperado:", error)
      toast.error("Erro inesperado ao registrar recebimento.")
    } finally {
      setIsSavingRecebimento(false)
    }
  }

  const handleValorContratadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarMoeda(valorDigitado)
    setValorContratadoFormatado(valorFormatado)

    const valorNumerico = removerFormatacao(valorFormatado)
    setValorContratadoTemp(valorNumerico > 0 ? valorNumerico.toString() : "")
  }

  const handleSalvarValorContratado = async () => {
    if (!obra) return

    try {
      const { supabase } = await import("@/lib/supabase")

      const { error } = await supabase
        .from("obras")
        .update({
          valor_contratado: valorContratadoTemp ? parseFloat(valorContratadoTemp) : null,
          nome_cliente: nomeClienteTemp || null,
        })
        .eq("id", obra.id)

      if (error) {
        console.error("Erro ao salvar valor contratado:", error)
        toast.error("Erro ao salvar. Tente novamente.")
        return
      }

      setShowEditValorContratadoModal(false)
      carregarDadosObra()
      toast.success("Valor contratado atualizado com sucesso")
    } catch (err) {
      console.error("Erro inesperado:", err)
      toast.error("Erro inesperado. Tente novamente.")
    }
  }

  const handleOpenEditValorContratado = () => {
    if (!obra) return

    if (obra.valorContratado) {
      const valorFormatado = (obra.valorContratado * 100).toString().replace(/\D/g, "")
      setValorContratadoFormatado(formatarMoeda(valorFormatado))
      setValorContratadoTemp(obra.valorContratado.toString())
    } else {
      setValorContratadoFormatado("")
      setValorContratadoTemp("")
    }

    // Carregar contrato existente se houver
    setContratoUrl((obra as any).contratoUrl || null)

    // Pré-preencher nome do cliente
    setNomeClienteTemp(obra.nomeCliente || "")

    setShowEditValorContratadoModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!obra) {
    return null
  }

  const totalGasto = calcularTotalGasto()
  const saldoDisponivel = calcularSaldoDisponivel()
  const percentualGasto = calcularPercentualGasto()
  const distribuicao = calcularDistribuicao()
  const maoObraPrevista = calcularMaoObraPrevista()
  const maoObraRealizada = calcularMaoObraRealizada()

  // Evolução dos gastos mês a mês
  const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const evolucaoGastos = (() => {
    const meses: Record<string, number> = {}
    // Despesas de material/outros (excluindo as que têm profissionalId pois são cópias de pagamentos)
    despesas.filter(d => !d.profissionalId).forEach(d => {
      if (!d.data || !d.valor) return
      const dateStr = (d.data as string).split('T')[0]
      const parts = dateStr.split('-')
      if (parts.length < 2) return
      const key = `${parts[0]}-${parts[1]}`
      meses[key] = (meses[key] || 0) + d.valor
    })
    // Pagamentos a profissionais (mão de obra)
    pagamentos.forEach(p => {
      if (!p.data || !p.valor) return
      const dateStr = (p.data as string).split('T')[0]
      const parts = dateStr.split('-')
      if (parts.length < 2) return
      const key = `${parts[0]}-${parts[1]}`
      meses[key] = (meses[key] || 0) + p.valor
    })
    return Object.entries(meses)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => {
        const [year, month] = key.split('-')
        return { key, label: `${MESES_PT[parseInt(month) - 1]}/${year.slice(2)}`, total }
      })
  })()

  const temPrazo = obra.dataInicio || obra.dataTermino
  const prazoInfo = obra.dataTermino ? calcularDiasRestantes(obra.dataTermino) : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-6 pb-28">
      <div className="max-w-7xl mx-auto">

        {/* ── HERO DA OBRA ─────────────────────────────────────────── */}
        <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl p-4 sm:p-5 mb-5 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            {/* Ícone + Info */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Home className="w-6 h-6 sm:w-7 sm:h-7 text-[#7eaaee]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-white break-words leading-tight mb-1">
                  {obra.nome}
                </h1>
                <p className="text-xs text-gray-400 mb-0.5">
                  {obra.tipo === "construcao" ? "Construção" : "Reforma"} · {obra.localizacao.cidade}/{obra.localizacao.estado}
                  {obra.area ? ` · ${obra.area} m²` : ""}
                  {prazoInfo && (
                    <span className="text-gray-500">
                      {prazoInfo.atrasado
                        ? ` · Atrasado há ${Math.abs(prazoInfo.dias)}d`
                        : ` · ${prazoInfo.dias}d restantes`}
                    </span>
                  )}
                </p>
                {userProfile === "builder" && obra.nomeCliente && (
                  <p className="text-xs text-gray-400">
                    Cliente: {obra.nomeCliente}
                  </p>
                )}
              </div>
            </div>

            {/* Menu de ações */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
                title="Ações da obra"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showActionsMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#1f2228] backdrop-blur-sm rounded-xl shadow-2xl border border-white/[0.1] py-1 z-20">
                    <button
                      onClick={handleOpenEditModal}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar obra
                    </button>
                    <button
                      onClick={handleOpenDeleteModal}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir obra
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Banner de Avisos Inteligentes de Orçamento */}
        {currentBudgetAlert && (
          <BudgetAlertBanner
            alert={currentBudgetAlert}
            onDismiss={() => setCurrentBudgetAlert(null)}
            onEdit={handleOpenEditModal}
          />
        )}

        {/* INDICADORES FINANCEIROS */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">Financeiro</p>
          <Card className="!p-3 sm:!p-4 !gap-0 bg-[#1f2228]/80 border border-white/[0.08] shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-[#0B3064]/20 border border-[#0B3064]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 text-[#7eaaee]" />
              </div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Financeiro</p>
            </div>

            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Total Gasto', value: formatarMoedaDisplay(totalGasto), href: '/dashboard/obra/extrato-geral', warn: percentualGasto > 100 },
                ...(obra.orcamento ? [{ label: 'Saldo', value: formatarMoedaDisplay(calcularSaldoDisponivel()), href: '/dashboard/obra/extrato-geral', warn: false }] : []),
                ...(obra.area ? [{ label: 'Custo por m²', value: calcularCustoPorM2(), href: '/dashboard/obra/custo-m2', warn: false }] : []),
                { label: 'Profissionais', value: formatarMoedaDisplay(pagamentos.reduce((acc, p) => acc + p.valor, 0)), href: '/dashboard/profissionais', warn: false },
              ].map(({ label, value, href, warn }) => (
                <div
                  key={label}
                  onClick={() => router.push(href)}
                  className="bg-white/[0.04] rounded-lg active:bg-white/[0.1] transition-colors"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {warn && <AlertTriangle className="w-3 h-3 text-red-400" />}
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#d1d5db' }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Aviso discreto se ultrapassou orçamento */}
            {percentualGasto > 100 && (
              <p className="text-[10px] text-red-400 mt-2.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Gasto {percentualGasto.toFixed(0)}% do orçamento — acima do limite
              </p>
            )}
          </Card>
        </div>

        {/* Card Recebimentos */}
        {userProfile === "builder" && (
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">Recebimentos do Cliente</p>
            <Card
              onClick={() => router.push("/dashboard/obra/extrato-recebimentos")}
              className="!p-3 sm:!p-4 !gap-1 bg-[#1f2228]/80 border border-white/[0.08] shadow-sm hover:shadow-md hover:border-[#0B3064]/40 active:scale-[0.99] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-white/[0.08] rounded-lg flex items-center justify-center flex-shrink-0">
                  <HandCoins className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Recebimentos</p>
              </div>
              {(() => {
                const totalRec = recebimentosDB.reduce((acc, r) => acc + r.valor, 0)
                const saldo = totalContratoClientes - totalRec
                return (
                  <>
                    <div className="flex flex-col gap-1.5 mb-2">
                      <div className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Contratado</p>
                        <p className="text-sm font-bold text-gray-300">{formatarMoedaDisplay(totalContratoClientes)}</p>
                      </div>
                      <div className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Recebido</p>
                        <p className="text-sm font-bold text-green-400">{formatarMoedaDisplay(totalRec)}</p>
                      </div>
                      <div className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">A Receber</p>
                        <p className={`text-sm font-bold ${saldo < 0 ? "text-red-400" : "text-[#7eaaee]"}`}>{formatarMoedaDisplay(Math.max(0, saldo))}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {recebimentosDB.length} {recebimentosDB.length === 1 ? "recebimento" : "recebimentos"} · {numClientes} {numClientes === 1 ? "cliente" : "clientes"}
                    </p>
                  </>
                )
              })()}
            </Card>
          </div>
        )}

        {/* DISTRIBUIÇÃO DE GASTOS */}
        {totalGasto > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">Distribuição de Gastos</p>
            <Card className="!p-3 sm:!p-4 bg-[#1f2228]/80 border border-white/[0.08] shadow-md">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div
                  className="border border-white/[0.08] rounded-xl p-3 bg-white/[0.03] cursor-pointer hover:border-[#0B3064]/50 hover:bg-white/[0.05] transition-all"
                  onClick={() => router.push("/dashboard/despesas?tipo=material")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white">Material / Outros</h3>
                    <span className="text-xs font-bold text-gray-300">
                      {obra.orcamento ? ((distribuicao.materialOutros / obra.orcamento) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-slate-400 rounded-full transition-all" style={{ width: `${obra.orcamento ? Math.min((distribuicao.materialOutros / obra.orcamento) * 100, 100) : 0}%` }} />
                  </div>
                  <p className="text-base font-bold text-white leading-none">{formatarMoedaDisplay(distribuicao.materialOutros)}</p>
                  {distribuicao.materialOutros === 0 && <p className="text-[10px] text-gray-500 italic mt-1">Nenhuma despesa</p>}
                </div>

                <div
                  className="border border-white/[0.08] rounded-xl p-3 bg-white/[0.03] cursor-pointer hover:border-orange-500/40 hover:bg-white/[0.05] transition-all"
                  onClick={() => router.push("/dashboard/despesas?tipo=maoobra")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white">Mão de Obra</h3>
                    <span className="text-xs font-bold text-gray-300">
                      {obra.orcamento ? ((distribuicao.maoObra / obra.orcamento) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-slate-400 rounded-full transition-all" style={{ width: `${obra.orcamento ? Math.min((distribuicao.maoObra / obra.orcamento) * 100, 100) : 0}%` }} />
                  </div>
                  <p className="text-base font-bold text-white leading-none">{formatarMoedaDisplay(distribuicao.maoObra)}</p>
                  {maoObraPrevista > 0 && <p className="text-[10px] text-gray-400 mt-1 font-medium">Prev: {formatarMoedaDisplay(maoObraPrevista)}</p>}
                  {distribuicao.maoObra === 0 && <p className="text-[10px] text-gray-500 italic mt-1">Nenhuma despesa</p>}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* EVOLUÇÃO DOS GASTOS */}
        {evolucaoGastos.length > 0 && (() => {
          const maxTotal = Math.max(...evolucaoGastos.map(e => e.total))
          return (
            <div className="mb-5">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">Evolução Mensal</p>
              <Card className="!p-3 sm:!p-4 bg-[#1f2228]/80 border border-white/[0.08] shadow-md">
                <div className="space-y-3">
                  {evolucaoGastos.map(({ key, label, total }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-12 flex-shrink-0 text-right">{label}</span>
                      <div className="flex-1 h-3 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0B3064]/80 rounded-full transition-all"
                          style={{ width: `${maxTotal > 0 ? (total / maxTotal) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-24 text-right flex-shrink-0 font-semibold">{formatarMoedaDisplay(total)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )
        })()}

        {/* Card Diário da Obra */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">Diário da Obra</p>
          <Card
            onClick={() => router.push("/dashboard/obra/diario")}
            className="!p-3 sm:!p-4 !gap-1 bg-[#1f2228]/60 border border-white/[0.08] shadow-sm hover:shadow-md hover:border-[#0B3064]/40 active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            {/* Header da linha */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-[#0B3064]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Camera className="w-3.5 h-3.5 text-[#7eaaee]" />
              </div>
              <p className="text-xs text-gray-300 font-semibold flex-1">Diário da Obra</p>
              {diarioTotal > 0 && (
                <span className="text-[10px] text-gray-500">{diarioTotal} foto{diarioTotal !== 1 ? "s" : ""}</span>
              )}
              <ArrowUp className="w-3.5 h-3.5 text-gray-600 rotate-90" />
            </div>

            {diarioFotos.length === 0 ? (
              <div className="flex items-center gap-2 py-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg bg-slate-700/40 border border-white/[0.08]" />
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 italic ml-1">Nenhuma foto ainda</p>
              </div>
            ) : (
              <div className="flex gap-1.5">
                {diarioFotos.slice(0, 3).map((foto) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={foto.id}
                    src={foto.foto_url}
                    alt=""
                    className="w-14 h-14 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ))}
                {diarioTotal > 3 && (
                  <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-lg bg-slate-700/60 flex flex-col items-center justify-center flex-shrink-0 border border-white/[0.08]">
                    <Plus className="w-3.5 h-3.5 text-gray-400 mb-0.5" />
                    <span className="text-[10px] text-gray-400 font-semibold leading-none">{diarioTotal - 3}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Painel de notificações */}
      <NotificationPanel 
        obraId={obra.id}
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
      />

      {/* Modal de Edição */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowEditModal(false)}>
          <div
            className="bg-[#1f2228] border border-white/[0.08] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div>
                <h2 className="text-base font-bold text-white">Editar Obra</h2>
                <p className="text-xs text-gray-500">Atualize os dados básicos</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="no-min-height no-touch-padding w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                style={{ minHeight: 0, minWidth: 0 }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto overflow-x-hidden flex-1 px-4 py-4 space-y-4">
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Dados da Obra</p>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-nome" className="text-xs text-gray-400">Nome da Obra *</Label>
                  <Input id="edit-nome" value={editFormData.nome} onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })} placeholder="Ex: Casa da Praia" className="bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base" />
                </div>

                {userProfile === "builder" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-nome-cliente" className="text-xs text-gray-400">Nome do Cliente</Label>
                    <Input id="edit-nome-cliente" value={editFormData.nomeCliente} onChange={(e) => setEditFormData({ ...editFormData, nomeCliente: e.target.value })} placeholder="Ex: João Silva" className="bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-tipo" className="text-xs text-gray-400">Tipo *</Label>
                    <Select value={editFormData.tipo} onValueChange={(value) => setEditFormData({ ...editFormData, tipo: value })}>
                      <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                        <SelectItem value="construcao">Construção</SelectItem>
                        <SelectItem value="reforma">Reforma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-area" className="text-xs text-gray-400">Área em m²</Label>
                    <Input id="edit-area" type="text" value={areaFormatada} onChange={handleAreaChange} placeholder="Ex: 180,00" className="bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Localização</p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-estado" className="text-xs text-gray-400">Estado</Label>
                    <Select value={editFormData.estado} onValueChange={(value) => setEditFormData({ ...editFormData, estado: value })}>
                      <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white h-10">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                        {ESTADOS_BRASILEIROS.map((estado) => (
                          <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="edit-cidade" className="text-xs text-gray-400">Cidade</Label>
                    <Input id="edit-cidade" value={editFormData.cidade} onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })} placeholder="Ex: São Paulo" className="bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-bairro" className="text-xs text-gray-400">Bairro</Label>
                  <Input id="edit-bairro" value={editFormData.bairro} onChange={(e) => setEditFormData({ ...editFormData, bairro: e.target.value })} placeholder="Ex: Jardins" className="bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base" />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Orçamento & Prazo</p>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-orcamento" className="text-xs text-gray-400">Orçamento Estimado</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                    <Input id="edit-orcamento" type="text" value={orcamentoFormatado} onChange={handleOrcamentoChange} placeholder="0,00" className="pl-10 bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3" style={{ minWidth: 0 }}>
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="edit-dataInicio" className="text-xs text-gray-400">Início</Label>
                    <div className="overflow-hidden">
                      <input id="edit-dataInicio" type="date" value={editFormData.dataInicio} onChange={(e) => setEditFormData({ ...editFormData, dataInicio: e.target.value })} style={{ WebkitAppearance: 'none', appearance: 'none', width: '100%', minWidth: '0', maxWidth: '100%', boxSizing: 'border-box', display: 'block', height: '40px', padding: '0 8px', fontSize: '16px', lineHeight: '40px', color: 'white', background: '#2a2d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                    </div>
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="edit-dataTermino" className="text-xs text-gray-400">Término</Label>
                    <div className="overflow-hidden">
                      <input id="edit-dataTermino" type="date" value={editFormData.dataTermino} onChange={(e) => setEditFormData({ ...editFormData, dataTermino: e.target.value })} style={{ WebkitAppearance: 'none', appearance: 'none', width: '100%', minWidth: '0', maxWidth: '100%', boxSizing: 'border-box', display: 'block', height: '40px', padding: '0 8px', fontSize: '16px', lineHeight: '40px', color: 'white', background: '#2a2d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="px-4 py-4 border-t border-white/[0.06] flex gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-white border-0 h-10">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} className="flex-1 bg-[#0B3064] hover:bg-[#082551] text-white h-10">
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/10">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-red-500/30">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Excluir obra?
            </h2>

            <p className="text-center text-gray-300 font-medium mb-4">
              {obra.nome}
            </p>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-300 text-center font-medium">
                ⚠️ Esta ação é irreversível
              </p>
              <p className="text-sm text-red-400 text-center mt-2">
                Todos os dados associados serão removidos permanentemente:
              </p>
              <ul className="text-sm text-red-400 mt-2 space-y-1">
                <li>• Despesas registradas</li>
                <li>• Profissionais cadastrados</li>
                <li>• Alertas configurados</li>
                <li>• Histórico completo</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                className="flex-1 bg-[#1F2937] hover:bg-[#374151] text-white border-0 h-10"
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Excluindo...
                  </>
                ) : (
                  "Confirmar Exclusão"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Comprovante */}
      {showComprovanteModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Botão Fechar */}
            <button
              onClick={handleCloseComprovanteModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-[#1f2228] hover:bg-[#2a2d35] text-white rounded-full flex items-center justify-center shadow-lg transition-all"
              title="Fechar"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>

            {/* Conteúdo do Modal */}
            <div className="w-full h-full bg-slate-800/95 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {!comprovanteUrl ? (
                // URL não foi fornecida
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="w-16 h-16 text-red-400 mb-4" />
                  <p className="text-white text-lg mb-2">Comprovante não disponível</p>
                  <p className="text-gray-400 text-sm">O arquivo não foi encontrado ou não foi anexado</p>
                </div>
              ) : isImageFile(comprovanteUrl) ? (
                // Visualização de Imagem
                <div className="w-full h-full flex items-center justify-center p-8">
                  <img
                    src={comprovanteUrl}
                    alt="Comprovante"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('❌ Erro ao carregar imagem:', comprovanteUrl)
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="text-white text-center"><p class="text-red-400 text-lg mb-2">Erro ao carregar imagem</p><p class="text-gray-400 text-sm">A imagem pode estar corrompida ou o link expirou</p></div>'
                      }
                    }}
                  />
                </div>
              ) : isPdfFile(comprovanteUrl) ? (
                // Visualização de PDF
                <iframe
                  src={comprovanteUrl}
                  className="w-full h-full"
                  title="Visualização do Comprovante"
                  onError={() => {
                    console.error('❌ Erro ao carregar PDF:', comprovanteUrl)
                  }}
                />
              ) : (
                // Fallback para outros tipos de arquivo
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-white text-lg mb-2">Arquivo de comprovante</p>
                  <p className="text-gray-400 text-sm mb-4">Tipo: {comprovanteUrl.split('.').pop()?.toUpperCase() || 'Desconhecido'}</p>
                  <Button
                    onClick={() => window.open(comprovanteUrl, '_blank')}
                    className="bg-[#0B3064] hover:bg-[#082551] text-white"
                  >
                    Abrir em nova aba
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Recebimento */}
      {showRecebimentoModal && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => { if (!isSavingRecebimento) { setShowRecebimentoModal(false); setComprovanteFileRecebimento(null) } }}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full bg-[#1f2228] border-t border-white/[0.08] rounded-t-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
              <h2 className="text-sm font-bold text-white">Registrar Recebimento</h2>
              <button onClick={() => { if (!isSavingRecebimento) { setShowRecebimentoModal(false); setComprovanteFileRecebimento(null) } }} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
              {/* Cliente */}
              <div className="space-y-1">
                <label className="block text-[11px] text-gray-500 font-medium uppercase tracking-wide">Cliente *</label>
                {clientesObra.length === 0 ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 space-y-2">
                    <p className="text-xs text-yellow-400/80">
                      Nenhum cliente cadastrado nesta obra. Cadastre um cliente antes de registrar um recebimento.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setShowRecebimentoModal(false); router.push("/dashboard/clientes/novo") }}
                      className="flex items-center gap-1.5 h-8 px-3 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Cadastrar cliente
                    </button>
                  </div>
                ) : (
                  <Select value={recebimentoFormData.clienteId} onValueChange={(value) => setRecebimentoFormData({ ...recebimentoFormData, clienteId: value })}>
                    <SelectTrigger className="w-full bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base">
                      <SelectValue placeholder="Selecionar cliente..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                      {clientesObra.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-white">{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {recebimentoFormData.clienteId && (
                  <div className="bg-[#0B3064]/15 border border-[#0B3064]/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <span className="text-xs text-white font-semibold">{clientesObra.find(c => c.id === recebimentoFormData.clienteId)?.nome}</span>
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
                      value={valorRecebimentoFormatado}
                      onChange={handleValorRecebimentoChange}
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
                      value={recebimentoFormData.data}
                      onChange={(e) => setRecebimentoFormData({ ...recebimentoFormData, data: e.target.value })}
                      style={{ WebkitAppearance: 'none', appearance: 'none', width: '100%', minWidth: '0', maxWidth: '100%', boxSizing: 'border-box', display: 'block', height: '40px', padding: '0 8px', fontSize: '16px', lineHeight: '40px', color: 'white', background: '#2a2d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-1">
                <label className="block text-[11px] text-gray-500 font-medium uppercase tracking-wide">Forma de pagamento *</label>
                <Select value={recebimentoFormData.formaPagamento} onValueChange={(value) => setRecebimentoFormData({ ...recebimentoFormData, formaPagamento: value })}>
                  <SelectTrigger className="w-full bg-[#2a2d35] border-white/[0.1] text-white h-10 text-base">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Transferência bancária">Transferência bancária</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Cartão de crédito">Cartão de crédito</SelectItem>
                    <SelectItem value="Cartão de débito">Cartão de débito</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Observação */}
              <div className="space-y-1">
                <label className="block text-[11px] text-gray-500 font-medium uppercase tracking-wide">Observação <span className="normal-case text-gray-700">(opcional)</span></label>
                <input
                  type="text"
                  value={recebimentoFormData.observacao}
                  onChange={(e) => setRecebimentoFormData({ ...recebimentoFormData, observacao: e.target.value })}
                  placeholder="Ex: Parcela inicial, pagamento final..."
                  style={{ width: '100%', height: '40px', padding: '0 12px', fontSize: '16px', color: 'white', background: '#2a2d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Comprovante */}
              <FileUpload
                label="Comprovante (opcional)"
                accept="image/*,application/pdf"
                maxSize={10}
                value={recebimentoFormData.comprovanteUrl}
                onChange={(file, preview) => {
                  setComprovanteFileRecebimento(file)
                  setRecebimentoFormData({ ...recebimentoFormData, comprovanteUrl: preview })
                }}
              />
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-white/[0.06] flex-shrink-0">
              <button
                onClick={() => { if (!isSavingRecebimento) { setShowRecebimentoModal(false); setComprovanteFileRecebimento(null) } }}
                className="flex-1 h-11 bg-white/[0.07] hover:bg-white/[0.1] text-gray-300 text-sm font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarRecebimento}
                disabled={isSavingRecebimento || clientesObra.length === 0}
                className="flex-1 h-11 bg-[#0B3064] hover:bg-[#082551] disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSavingRecebimento ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</> : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Valor Contratado */}
      {showEditValorContratadoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 rounded-2xl shadow-2xl max-w-md w-full border border-white/10">
            <div className="p-6 border-b border-white/[0.1]">
              <h2 className="text-2xl font-bold text-white">Editar Valor Contratado</h2>
              <p className="text-sm text-gray-400 mt-1">Defina o valor total do contrato com o cliente</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Nome do Cliente */}
              <div className="space-y-2">
                <Label htmlFor="nome-cliente-contrato" className="text-gray-300">Nome do Cliente</Label>
                <Input
                  id="nome-cliente-contrato"
                  value={nomeClienteTemp}
                  onChange={(e) => setNomeClienteTemp(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="bg-[#2a2d35] border-white/[0.1] text-white"
                />
              </div>

              {/* Valor Contratado */}
              <div className="space-y-2">
                <Label htmlFor="valor-contratado-edit" className="text-gray-300">Valor Contratado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    R$
                  </span>
                  <Input
                    id="valor-contratado-edit"
                    type="text"
                    value={valorContratadoFormatado}
                    onChange={handleValorContratadoChange}
                    placeholder="0,00"
                    className="pl-12 bg-[#2a2d35] border-white/[0.1] text-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Este valor será usado para calcular o saldo a receber
                </p>
              </div>

              {/* Upload de Contrato */}
              <FileUpload
                label="Anexar contrato firmado com o cliente"
                accept="image/*,application/pdf,.doc,.docx"
                maxSize={10}
                value={contratoUrl}
                onChange={(file, preview) => {
                  setContratoUrl(preview)
                }}
              />
            </div>

            <div className="p-6 border-t border-white/[0.1] flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEditValorContratadoModal(false)}
                className="flex-1 bg-[#1F2937] hover:bg-[#374151] text-white border-0 h-10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarValorContratado}
                className="flex-1 bg-[#0B3064] hover:bg-[#082551] text-white h-10"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Orientação - Primeira vez no dashboard da obra */}
      {showOrientacaoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1f2228] rounded-2xl shadow-2xl border border-white/[0.1] p-6 sm:p-8 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-300">
            {/* Ícone ilustrativo */}
            <div className="w-16 h-16 bg-[#0B3064]/20 rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-blue-500/20">
              <Users className="w-8 h-8 text-[#7eaaee]" />
            </div>

            {/* Título */}
            <h3 className="text-2xl font-bold text-white text-center mb-3">
              Deseja cadastrar um profissional agora?
            </h3>

            {/* Descrição */}
            <p className="text-base text-gray-300 text-center mb-8 leading-relaxed">
              O próximo passo mais comum é cadastrar a mão de obra da obra. Você pode fazer isso agora ou deixar para depois.
            </p>

            {/* Botões */}
            <div className="flex flex-col gap-3">
              {/* Botão principal - Cadastrar agora */}
              <Button
                onClick={handleCadastrarProfissionalAgora}
                className="w-full h-10 bg-[#0B3064] hover:bg-[#082551] text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                <Users className="w-5 h-5 mr-2" />
                Cadastrar profissional agora
              </Button>

              {/* Botão secundário - Depois */}
              <Button
                onClick={handleDepoisOrientacao}
                className="w-full h-10 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-200 border border-white/[0.1] rounded-xl transition-colors"
              >
                Depois
              </Button>

              {/* Botão terciário - Cancelar (mais discreto) */}
              <button
                onClick={handleCancelarOrientacao}
                className="text-sm text-gray-400 hover:text-gray-200 transition-colors py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer fixo de ações */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#13151a]/95 backdrop-blur-md border-t border-white/[0.08] shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 justify-center">
          <button
            onClick={() => router.push("/dashboard/despesas/nova")}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 h-12 sm:flex-row sm:gap-1.5 sm:h-10 bg-[#2a2d35] hover:bg-white/[0.13] active:scale-95 text-gray-300 text-[9px] sm:text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150"
          >
            <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Despesa</span>
          </button>
          <button
            onClick={() => router.push("/dashboard/pagamentos/novo")}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 h-12 sm:flex-row sm:gap-1.5 sm:h-10 bg-[#2a2d35] hover:bg-white/[0.13] active:scale-95 text-gray-300 text-[9px] sm:text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150"
          >
            <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Pagamento</span>
          </button>
          <button
            onClick={handleGerarRelatorio}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 h-12 sm:flex-row sm:gap-1.5 sm:h-10 bg-[#2a2d35] hover:bg-white/[0.13] active:scale-95 text-gray-300 text-[9px] sm:text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150"
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Relatório</span>
          </button>
          {userProfile === "builder" && (
            <button
              onClick={async () => {
                setRecebimentoFormData({ valor: "", data: new Date().toISOString().split("T")[0], formaPagamento: "Pix", observacao: "", comprovanteUrl: null, clienteId: "" })
                setComprovanteFileRecebimento(null)
                setValorRecebimentoFormatado("")
                // Carregar clientes da obra
                try {
                  const { supabase } = await import("@/lib/supabase")
                  const { data: { user } } = await supabase.auth.getUser()
                  if (user && obra) {
                    const clientes = await getClientesSupabase(obra.id, user.id)
                    setClientesObra(clientes)
                  }
                } catch {}
                setShowRecebimentoModal(true)
              }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-12 sm:flex-row sm:gap-1.5 sm:h-10 bg-[#2a2d35] hover:bg-white/[0.13] active:scale-95 text-gray-300 text-[9px] sm:text-xs font-medium rounded-lg border border-white/[0.08] transition-all duration-150"
            >
              <HandCoins className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Recebimento</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
