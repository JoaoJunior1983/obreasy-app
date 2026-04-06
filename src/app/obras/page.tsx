"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Plus, MapPin, TrendingUp, Wallet, PiggyBank, Home, Trash2, FileText, Pencil, Star, Users, HandCoins, Search, X, CreditCard, Calendar, ArrowUpDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getObrasDoUsuario, setActiveObraId, calcularMetricasObra, calcularMetricasObraFromSupabase, deleteObraCascade, getUserProfile, getClientesSupabase, type Obra, type UserProfile, type Cliente } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

const ESTADOS_BRASILEIROS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO"
]

export default function ObrasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [obras, setObras] = useState<Obra[]>([])
  const [busca, setBusca] = useState("")
  const [ordem, setOrdem] = useState<"data" | "nome" | "orcamento" | "gasto">("data")
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "construcao" | "reforma">("todos")
  const [materiaisObras, setMateriaisObras] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [deletingObraId, setDeletingObraId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [obraToDelete, setObraToDelete] = useState<Obra | null>(null)

  // Estado do perfil do usuário
  const [userProfile, setUserProfileState] = useState<UserProfile>(null)

  // Estado para métricas financeiras de cada obra
  const [metricasObras, setMetricasObras] = useState<Record<string, {
    orcamentoEstimado: number
    totalGasto: number
    saldoDisponivel: number
    custoPorM2: number
    areaM2: number
  }>>({})
  const [loadingMetricas, setLoadingMetricas] = useState(true)

  // Estado para mão de obra de cada obra (incluindo pagamentos do Supabase)
  const [maoObraObras, setMaoObraObras] = useState<Record<string, number>>({})

  // Estado para recebimentos de cada obra (do Supabase)
  const [recebimentosObras, setRecebimentosObras] = useState<Record<string, { totalRecebido: number; totalContrato: number }>>({})

  // Estados para edição
  const [showEditModal, setShowEditModal] = useState(false)
  const [obraToEdit, setObraToEdit] = useState<Obra | null>(null)
  const [editFormData, setEditFormData] = useState({
    nome: "",
    tipo: "",
    area: "",
    estado: "",
    cidade: "",
    bairro: "",
    orcamento: "",
    nomeCliente: "",
  })
  const [orcamentoFormatado, setOrcamentoFormatado] = useState("")
  const [areaFormatada, setAreaFormatada] = useState("")

  // Favoritos
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([])

  // Modal upgrade (owner com limite atingido)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Modal de recebimento
  const [showRecebimentoModal, setShowRecebimentoModal] = useState(false)
  const [obraParaRecebimento, setObraParaRecebimento] = useState<Obra | null>(null)
  const [clientesObra, setClientesObra] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [recebimentoFormData, setRecebimentoFormData] = useState({
    valor: "",
    data: "",
    formaPagamento: "Pix",
    observacao: "",
    clienteId: "",
  })

  useEffect(() => {
    const loadObras = async () => {
      try {
        // Verificar autenticação no localStorage primeiro (fallback)
        const isAuthenticated = localStorage.getItem("isAuthenticated")

        if (isAuthenticated !== "true") {
          router.push("/")
          return
        }

        // Verificar autenticação no Supabase
        const { supabase } = await import("@/lib/supabase")
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          // Se não tiver sessão no Supabase mas tiver no localStorage,
          // permitir acesso (usuário fez login simulado)
          console.log("Usuário autenticado via localStorage (modo desenvolvimento)")
          setLoading(false)
          return
        }

        // Carregar perfil do usuário
        const profile = getUserProfile()
        setUserProfileState(profile)

        // Carregar favoritos
        const favoritosStorage = localStorage.getItem("obrasFavoritas")
        const favoritos = favoritosStorage ? JSON.parse(favoritosStorage) : []
        setObrasFavoritas(favoritos)

        // Carregar obras do Supabase
        const { data: obrasData, error: obrasError } = await supabase
          .from("obras")
          .select("*")
          .eq("user_id", user.id)
          .order("criada_em", { ascending: false })

        if (obrasError) {
          console.error("Erro ao carregar obras:", obrasError)
          setLoading(false)
          return
        }

        const obrasDoUsuario = (obrasData || []) as any[]

        // Ordenar: favoritas primeiro
        const obrasOrdenadas = obrasDoUsuario.sort((a: any, b: any) => {
          const aFavorita = favoritos.includes(a.id)
          const bFavorita = favoritos.includes(b.id)

          if (aFavorita && !bFavorita) return -1
          if (!aFavorita && bFavorita) return 1
          return 0
        })

        setObras(obrasOrdenadas as any)
        setLoading(false)

        // Carregar métricas financeiras e mão de obra de cada obra
        setLoadingMetricas(true)
        const metricasPromises = obrasOrdenadas.map(async (obra: any) => {
          const metricas = await calcularMetricasObraFromSupabase(obra.id)

          // Calcular mão de obra incluindo pagamentos do Supabase
          let maoObraTotal = 0
          let totalRecebidoObra = 0
          let totalContratoObra = 0
          let materiaisTotal = 0
          try {
            const { supabase } = await import("@/lib/supabase")

            // Despesas de mão de obra do localStorage
            // Excluir itens com profissionalId (são cópias dos pagamentos — já somados abaixo)
            const despesas = JSON.parse(localStorage.getItem("despesas") || "[]")
            const maoObraDespesas = despesas
              .filter((d: any) => {
                if (d.obraId !== obra.id) return false
                if (d.profissionalId) return false
                const category = String(d.category ?? d.categoria ?? d.tipo ?? "").toLowerCase()
                return category === "mao_obra" || category === "mão de obra"
              })
              .reduce((acc: number, d: any) => acc + (d.valor ?? 0), 0)

            // Pagamentos aos profissionais do Supabase
            const { data: { user } } = await supabase.auth.getUser()
            let pagamentosTotal = 0
            if (user) {
              const [pagamentosRes, recebimentosRes, clientesRes, despesasRes] = await Promise.all([
                supabase.from("pagamentos").select("valor").eq("obra_id", obra.id).eq("user_id", user.id),
                supabase.from("recebimentos").select("valor").eq("obra_id", obra.id).eq("user_id", user.id),
                supabase.from("clientes").select("contrato_valor").eq("obra_id", obra.id).eq("user_id", user.id),
                supabase.from("despesas").select("valor, categoria").eq("obra_id", obra.id).eq("user_id", user.id),
              ])

              if (pagamentosRes.data && pagamentosRes.data.length > 0) {
                pagamentosTotal = pagamentosRes.data.reduce((acc: number, p: any) => acc + (parseFloat(p.valor) || 0), 0)
              }
              if (recebimentosRes.data) {
                totalRecebidoObra = recebimentosRes.data.reduce((acc: number, r: any) => acc + (parseFloat(r.valor) || 0), 0)
              }
              if (clientesRes.data) {
                totalContratoObra = clientesRes.data.reduce((acc: number, c: any) => acc + (parseFloat(c.contrato_valor) || 0), 0)
              }
              if (despesasRes.data) {
                materiaisTotal = despesasRes.data
                  .filter((d: any) => d.categoria !== "mao_obra")
                  .reduce((acc: number, d: any) => acc + (parseFloat(d.valor) || 0), 0)
              }
            }

            maoObraTotal = maoObraDespesas + pagamentosTotal
          } catch (error) {
            console.error("Erro ao calcular mão de obra:", error)
          }

          return { obraId: obra.id, metricas, maoObra: maoObraTotal, totalRecebidoObra, totalContratoObra, materiais: materiaisTotal }
        })

        const metricasResults = await Promise.all(metricasPromises)
        const metricasMap: Record<string, any> = {}
        const maoObraMap: Record<string, number> = {}
        const recebimentosMap: Record<string, { totalRecebido: number; totalContrato: number }> = {}
        const materiaisMap: Record<string, number> = {}
        metricasResults.forEach(({ obraId, metricas, maoObra, totalRecebidoObra, totalContratoObra, materiais }: any) => {
          metricasMap[obraId] = metricas
          maoObraMap[obraId] = maoObra
          recebimentosMap[obraId] = { totalRecebido: totalRecebidoObra, totalContrato: totalContratoObra }
          materiaisMap[obraId] = materiais ?? 0
        })
        setMetricasObras(metricasMap)
        setMaoObraObras(maoObraMap)
        setRecebimentosObras(recebimentosMap)
        setMateriaisObras(materiaisMap)
        setLoadingMetricas(false)
      } catch (error) {
        console.error("Erro ao carregar obras:", error)
        setLoading(false)
        setLoadingMetricas(false)
      }
    }

    loadObras()
  }, [router])

  const handleSelecionarObra = (obraId: string) => {
    setActiveObraId(obraId)
    // Disparar evento para atualizar o Header
    window.dispatchEvent(new Event("obraAtualizada"))
    router.push("/dashboard/obra")
  }

  const handleCriarObra = () => {
    if (userProfile === "owner" && obras.length >= 1) {
      setShowUpgradeModal(true)
      return
    }
    router.push("/dashboard/criar-obra")
  }

  const handleOpenDeleteModal = (e: React.MouseEvent, obra: Obra) => {
    e.stopPropagation()
    setObraToDelete(obra)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setObraToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!obraToDelete) return

    setDeletingObraId(obraToDelete.id)

    try {
      // Deletar do Supabase (cascade irá remover registros relacionados automaticamente)
      const { supabase } = await import("@/lib/supabase")
      const { error: deleteError } = await supabase
        .from("obras")
        .delete()
        .eq("id", obraToDelete.id)

      if (deleteError) {
        console.error("Erro ao deletar obra:", deleteError)
        throw new Error("Falha ao excluir obra")
      }

      // Atualizar lista de obras
      const obrasAtualizadas = obras.filter(o => o.id !== obraToDelete.id)
      setObras(obrasAtualizadas)

      // Fechar modal
      handleCloseDeleteModal()

      // Mostrar feedback de sucesso
      toast({
        title: "Obra excluída com sucesso",
        variant: "default",
      })

      // Se não houver mais obras, recarregar a página para mostrar estado vazio
      if (obrasAtualizadas.length === 0) {
        router.refresh()
      }
    } catch (error) {
      console.error("Erro ao excluir obra:", error)
      toast({
        title: "Erro ao excluir obra. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeletingObraId(null)
    }
  }

  const handleGerarRelatorio = (e: React.MouseEvent, obraId: string) => {
    e.stopPropagation()
    router.push(`/dashboard/obras/${obraId}/relatorio`)
  }

  const handleNovaDespesa = (e: React.MouseEvent, obraId: string) => {
    e.stopPropagation()
    setActiveObraId(obraId)
    router.push("/dashboard/despesas/nova")
  }

  const handleNovoPagamento = (e: React.MouseEvent, obraId: string) => {
    e.stopPropagation()
    setActiveObraId(obraId)
    router.push("/dashboard/pagamentos/novo")
  }

  const handleToggleFavorito = (e: React.MouseEvent, obraId: string) => {
    e.stopPropagation()

    const novosFavoritos = obrasFavoritas.includes(obraId)
      ? obrasFavoritas.filter(id => id !== obraId)
      : [...obrasFavoritas, obraId]

    setObrasFavoritas(novosFavoritos)
    localStorage.setItem("obrasFavoritas", JSON.stringify(novosFavoritos))

    // Reordenar obras
    const obrasOrdenadas = [...obras].sort((a, b) => {
      const aFavorita = novosFavoritos.includes(a.id)
      const bFavorita = novosFavoritos.includes(b.id)

      if (aFavorita && !bFavorita) return -1
      if (!aFavorita && bFavorita) return 1
      return 0
    })

    setObras(obrasOrdenadas)
  }

  const handleOpenEditModal = (e: React.MouseEvent, obra: Obra) => {
    e.stopPropagation()

    setObraToEdit(obra)
    setEditFormData({
      nome: obra.nome,
      tipo: obra.tipo,
      area: obra.area.toString(),
      estado: obra.localizacao.estado,
      cidade: obra.localizacao.cidade,
      bairro: (obra.localizacao as any).bairro || "",
      orcamento: obra.orcamento?.toString() || "",
      nomeCliente: (obra as any).nome_cliente || (obra as any).nomeCliente || "",
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

    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setObraToEdit(null)
  }

  const handleSaveEdit = async () => {
    if (!obraToEdit) return

    // Validar campos obrigatórios
    if (!editFormData.nome || !editFormData.tipo || !editFormData.area || !editFormData.estado || !editFormData.cidade) {
      toast({
        title: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      // Atualizar obra no Supabase
      const { supabase } = await import("@/lib/supabase")

      const updateData: any = {
        nome: editFormData.nome,
        tipo: editFormData.tipo,
        area: parseFloat(editFormData.area),
        localizacao: {
          estado: editFormData.estado,
          cidade: editFormData.cidade,
          ...(editFormData.bairro && { bairro: editFormData.bairro })
        },
        orcamento: editFormData.orcamento ? parseFloat(editFormData.orcamento) : null,
      }

      // Adicionar nome_cliente se for construtor
      if (userProfile === "builder") {
        updateData.nome_cliente = editFormData.nomeCliente || null
      }

      const { data: obraAtualizada, error: updateError } = (await (supabase as any)
        .from("obras")
        .update(updateData)
        .eq("id", obraToEdit.id)
        .select()
        .single()) as { data: any; error: any }

      if (updateError) {
        console.error("Erro ao atualizar obra:", updateError)
        throw new Error("Falha ao atualizar obra")
      }

      // Atualizar estado local
      const obrasAtualizadas = obras.map(o =>
        o.id === obraToEdit.id ? (obraAtualizada as any) : o
      )
      setObras(obrasAtualizadas)

      handleCloseEditModal()
      toast({
        title: "Obra atualizada com sucesso!",
        variant: "default",
      })
    } catch (error) {
      console.error("Erro ao salvar alterações:", error)
      toast({
        title: "Erro ao atualizar obra. Tente novamente.",
        variant: "destructive",
      })
    }
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

  const formatarMoedaDisplay = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const handleRegistrarRecebimento = async (e: React.MouseEvent, obra: Obra) => {
    e.stopPropagation()
    setObraParaRecebimento(obra)
    setClientesObra([])
    setLoadingClientes(true)
    setShowRecebimentoModal(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const clientes = await getClientesSupabase(obra.id, user.id)
        setClientesObra(clientes)
      }
    } catch {} finally {
      setLoadingClientes(false)
    }
  }

  const handleCloseRecebimentoModal = () => {
    setShowRecebimentoModal(false)
    setObraParaRecebimento(null)
    setClientesObra([])
    setRecebimentoFormData({
      valor: "",
      data: "",
      formaPagamento: "Pix",
      observacao: "",
      clienteId: "",
    })
  }

  const handleSalvarRecebimento = async () => {
    if (!obraParaRecebimento) return

    if (!recebimentoFormData.clienteId) {
      toast({ title: "Selecione um cliente.", variant: "destructive" })
      return
    }

    if (!recebimentoFormData.valor || !recebimentoFormData.data) {
      toast({
        title: "Por favor, preencha o valor e a data do recebimento.",
        variant: "destructive",
      })
      return
    }

    const valorNumerico = parseFloat(recebimentoFormData.valor.replace(/\D/g, "")) / 100

    if (valorNumerico <= 0) {
      toast({
        title: "O valor do recebimento deve ser maior que zero.",
        variant: "destructive",
      })
      return
    }

    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const insertData: any = {
        user_id: user.id,
        obra_id: obraParaRecebimento.id,
        cliente_id: recebimentoFormData.clienteId,
        valor: valorNumerico,
        data: recebimentoFormData.data,
        forma_pagamento: recebimentoFormData.formaPagamento || null,
        observacao: recebimentoFormData.observacao || null,
      }

      const { error } = await supabase.from("recebimentos").insert(insertData)

      if (error) throw error

      // Atualizar totais da obra no estado local
      setRecebimentosObras(prev => {
        const atual = prev[obraParaRecebimento.id] ?? { totalRecebido: 0, totalContrato: 0 }
        return {
          ...prev,
          [obraParaRecebimento.id]: {
            ...atual,
            totalRecebido: atual.totalRecebido + valorNumerico,
          }
        }
      })

      handleCloseRecebimentoModal()
      toast({ title: "Recebimento registrado com sucesso!" })
    } catch {
      toast({ title: "Erro ao registrar recebimento. Tente novamente.", variant: "destructive" })
    }
  }

  const handleValorRecebimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "")
    const valorFormatado = formatarMoeda(valor)
    setRecebimentoFormData({ ...recebimentoFormData, valor: valorFormatado })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando suas obras...</p>
        </div>
      </div>
    )
  }

  // Estado vazio: nenhuma obra cadastrada
  if (obras.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0a0a0a] flex items-start justify-center pt-16 px-6 pb-6">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0B3064]/10 rounded-2xl mb-5 border border-blue-500/15">
            <Building2 className="w-8 h-8 text-[#7eaaee]" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Nenhuma obra cadastrada
          </h2>

          <p className="text-sm text-gray-500 mb-7 leading-relaxed">
            Crie sua primeira obra para começar a controlar gastos, profissionais e o andamento da construção.
          </p>

          <Button
            onClick={handleCriarObra}
            className="bg-[#0B3064] hover:bg-[#082551] text-white px-6 py-2.5 text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {userProfile === "builder" ? "Cadastrar obra do cliente" : "Criar minha obra"}
          </Button>
        </div>
      </div>
    )
  }

  // Lista de obras (2+ obras)
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B3064]/20 border border-[#0B3064]/30 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-[#7eaaee]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Minhas Obras</h1>
              <p className="text-[11px] text-gray-500 leading-tight hidden sm:block">Selecione uma obra para ver o dashboard</p>
            </div>
          </div>

          <Button
            onClick={handleCriarObra}
            className="bg-[#0B3064] hover:bg-[#082551] text-white text-xs px-3 h-8 rounded-lg shadow-lg flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {userProfile === "builder" ? "Nova obra" : "Nova obra"}
          </Button>
        </div>

        {/* Busca */}
        <div className="relative mb-3 sm:mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por obra ou cliente..."
            className="w-full h-9 pl-9 pr-8 bg-[#1f2228]/80 border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0B3064]/50 transition-colors"
          />
          {busca && (
            <button onClick={() => setBusca("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros e Ordenação */}
        <div className="flex items-center gap-2 mb-8">
          {/* Filtro tipo */}
          <div className="flex items-center gap-0.5 bg-[#1f2228]/80 border border-white/[0.08] rounded-lg p-0.5 flex-shrink-0">
            {(["todos", "construcao", "reforma"] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                style={{ padding: '3px 7px', minHeight: 0, minWidth: 0, margin: 0 }}
                className={`no-min-height no-touch-padding rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                  filtroTipo === tipo
                    ? "bg-[#0B3064] text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tipo === "todos" ? "Todos" : tipo === "construcao" ? "Construção" : "Reforma"}
              </button>
            ))}
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-1 bg-[#1f2228]/80 border border-white/[0.08] rounded-lg px-2 h-8 ml-auto flex-shrink-0">
            <ArrowUpDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
            <select
              value={ordem}
              onChange={e => setOrdem(e.target.value as any)}
              className="bg-transparent text-[11px] text-gray-300 focus:outline-none cursor-pointer"
              style={{ minHeight: 0, appearance: 'none', WebkitAppearance: 'none', colorScheme: 'dark' }}
            >
              <option value="data" className="bg-[#1f2228]">Recente</option>
              <option value="nome" className="bg-[#1f2228]">Nome</option>
              <option value="orcamento" className="bg-[#1f2228]">Orçamento</option>
              <option value="gasto" className="bg-[#1f2228]">Gasto</option>
            </select>
          </div>
        </div>

        {/* Grid de obras */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {obras
            .filter(obra => {
              if (filtroTipo !== "todos" && obra.tipo !== filtroTipo) return false
              if (!busca.trim()) return true
              const q = busca.toLowerCase()
              return (
                obra.nome.toLowerCase().includes(q) ||
                ((obra as any).nome_cliente || (obra as any).nomeCliente || "").toLowerCase().includes(q)
              )
            })
            .sort((a, b) => {
              // Favoritos sempre primeiro
              const aFav = obrasFavoritas.includes(a.id)
              const bFav = obrasFavoritas.includes(b.id)
              if (aFav && !bFav) return -1
              if (!aFav && bFav) return 1
              // Depois a ordenação escolhida
              if (ordem === "nome") return a.nome.localeCompare(b.nome)
              if (ordem === "orcamento") return ((b as any).orcamento ?? 0) - ((a as any).orcamento ?? 0)
              if (ordem === "gasto") return (metricasObras[b.id]?.totalGasto ?? 0) - (metricasObras[a.id]?.totalGasto ?? 0)
              // data: mais recente primeiro (padrão)
              return new Date((b as any).criada_em ?? 0).getTime() - new Date((a as any).criada_em ?? 0).getTime()
            })
            .map((obra) => {
            // Usar métricas do estado (carregadas do Supabase)
            const metricas = metricasObras[obra.id] || {
              orcamentoEstimado: 0,
              totalGasto: 0,
              saldoDisponivel: 0,
              custoPorM2: 0,
              areaM2: 0
            }
            const isDeleting = deletingObraId === obra.id

            return (
              <Card 
                key={obra.id}
                className="p-2 sm:p-6 bg-[#1f2228]/80 border border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.5)] transition-all cursor-pointer relative overflow-hidden"
                onClick={() => !isDeleting && handleSelecionarObra(obra.id)}
              >
                {/* Header do card */}
                <div className="flex items-start gap-2 sm:gap-4 mb-1 pb-1 border-b border-white/10">
                  <div className="w-8 h-8 sm:w-14 sm:h-14 bg-[#2a2d35] rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <Building2 className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-0.5">
                      <h2 className="text-sm sm:text-2xl font-bold text-white break-words leading-tight flex-1">
                        {obra.nome}
                      </h2>
                      {/* Ações */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
                        <button
                          onClick={(e) => handleToggleFavorito(e, obra.id)}
                          disabled={isDeleting}
                          style={{ padding: 0, margin: 0, minWidth: 0, minHeight: 0, lineHeight: 0, background: 'none', border: 'none' }}
                          className={`no-min-height no-touch-padding rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            obrasFavoritas.includes(obra.id)
                              ? "text-gray-300"
                              : "text-gray-400 hover:text-gray-300"
                          }`}
                          title={obrasFavoritas.includes(obra.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          <Star className={`w-4 h-4 block ${obrasFavoritas.includes(obra.id) ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={(e) => handleOpenEditModal(e, obra)}
                          disabled={isDeleting}
                          style={{ padding: 0, margin: 0, minWidth: 0, minHeight: 0, lineHeight: 0, background: 'none', border: 'none' }}
                          className="no-min-height no-touch-padding rounded text-gray-400 hover:text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Editar obra"
                        >
                          <Pencil className="w-4 h-4 block" />
                        </button>
                        <button
                          onClick={(e) => handleOpenDeleteModal(e, obra)}
                          disabled={isDeleting}
                          style={{ padding: 0, margin: 0, minWidth: 0, minHeight: 0, lineHeight: 0, background: 'none', border: 'none' }}
                          className="no-min-height no-touch-padding rounded text-gray-400 hover:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Excluir obra"
                        >
                          <Trash2 className="w-4 h-4 block" />
                        </button>
                      </div>
                    </div>
                    {/* Nome do cliente */}
                    {((obra as any).nome_cliente || (obra as any).nomeCliente) && (
                      <p className="text-[10px] sm:text-sm text-[#7eaaee] font-medium mb-0.5 truncate">
                        Cliente: {(obra as any).nome_cliente || (obra as any).nomeCliente}
                      </p>
                    )}
                    <div className="space-y-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[10px] sm:text-sm text-gray-400 leading-tight">
                          {obra.tipo === "construcao" ? "Construção" : "Reforma"}
                        </p>
                        {(() => {
                          const dataTermino = (obra as any).data_termino
                          if (!dataTermino) return null
                          const hoje = new Date()
                          hoje.setHours(0, 0, 0, 0)
                          const termino = new Date(dataTermino)
                          termino.setHours(0, 0, 0, 0)
                          const dias = Math.ceil((termino.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                          if (dias < 0) return (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                              <Calendar className="w-2.5 h-2.5" />Atrasada {Math.abs(dias)}d
                            </span>
                          )
                          if (dias <= 7) return (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full">
                              <Calendar className="w-2.5 h-2.5" />{dias}d restantes
                            </span>
                          )
                          if (dias <= 30) return (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded-full">
                              <Calendar className="w-2.5 h-2.5" />{dias}d restantes
                            </span>
                          )
                          return (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-white/[0.06] text-gray-400 px-1.5 py-0.5 rounded-full">
                              <Calendar className="w-2.5 h-2.5" />{dias}d
                            </span>
                          )
                        })()}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <p className="text-[10px] sm:text-sm truncate leading-tight">
                          {obra.localizacao.cidade}/{obra.localizacao.estado}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard - 6 indicadores */}
                <div className="mb-0.5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {/* Orçamento */}
                    <div className="bg-white/[0.04] rounded p-1 border border-white/[0.06]">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-4 h-4 bg-white/[0.08] rounded flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-3 h-3 text-gray-300" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-tight">Orçamento</p>
                      </div>
                      <p className="text-xs font-bold text-white leading-none">
                        {loadingMetricas ? (
                          <span className="text-gray-500 animate-pulse">...</span>
                        ) : metricas.orcamentoEstimado > 0 ? (
                          formatarMoedaDisplay(metricas.orcamentoEstimado)
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>

                    {/* Total Gasto */}
                    <div className="bg-white/[0.04] rounded p-1 border border-white/[0.06]">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-4 h-4 bg-white/[0.08] rounded flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-3 h-3 text-gray-300" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-tight">Total Gasto</p>
                      </div>
                      <p className="text-xs font-bold text-white leading-none">
                        {loadingMetricas ? (
                          <span className="text-gray-500 animate-pulse">...</span>
                        ) : (
                          formatarMoedaDisplay(metricas.totalGasto)
                        )}
                      </p>
                    </div>

                    {/* Saldo */}
                    <div className="bg-white/[0.04] rounded p-1 border border-white/[0.06]">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-4 h-4 bg-white/[0.08] rounded flex items-center justify-center flex-shrink-0">
                          <PiggyBank className="w-3 h-3 text-gray-300" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-tight">Saldo</p>
                      </div>
                      <p className="text-xs font-bold text-white leading-none">
                        {loadingMetricas ? (
                          <span className="text-gray-500 animate-pulse">...</span>
                        ) : metricas.orcamentoEstimado > 0 ? (
                          formatarMoedaDisplay(metricas.saldoDisponivel)
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>

                    {/* Custo por m² */}
                    <div className="bg-white/[0.04] rounded p-1 border border-white/[0.06]">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-4 h-4 bg-white/[0.08] rounded flex items-center justify-center flex-shrink-0">
                          <Home className="w-3 h-3 text-gray-300" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-tight">Custo/m²</p>
                      </div>
                      <p className="text-xs font-bold text-white leading-none">
                        {loadingMetricas ? (
                          <span className="text-gray-500 animate-pulse">...</span>
                        ) : metricas.areaM2 > 0 ? (
                          formatarMoedaDisplay(metricas.custoPorM2)
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>

                    {/* Mão de Obra */}
                    <div className="bg-white/[0.04] rounded p-1 border border-white/[0.06]">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-4 h-4 bg-white/[0.08] rounded flex items-center justify-center flex-shrink-0">
                          <Users className="w-3 h-3 text-gray-300" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-tight">Mão de Obra</p>
                      </div>
                      <p className="text-xs font-bold text-white leading-none">
                        {loadingMetricas ? "..." : formatarMoedaDisplay(maoObraObras[obra.id] || 0)}
                      </p>
                    </div>

                    {/* Materiais / Outros */}
                    <div className="bg-white/[0.04] rounded p-1 border border-white/[0.06]">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-4 h-4 bg-white/[0.08] rounded flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-3 h-3 text-gray-300" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-tight">Materiais/Outros</p>
                      </div>
                      <p className="text-xs font-bold text-white leading-none">
                        {loadingMetricas ? (
                          <span className="text-gray-500 animate-pulse">...</span>
                        ) : (
                          formatarMoedaDisplay(materiaisObras[obra.id] ?? 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bloco de Recebimentos do Cliente */}
                {userProfile === "builder" && (() => {
                  const recData = recebimentosObras[obra.id]
                  const totalContrato = recData?.totalContrato ?? 0
                  const totalRecebido = recData?.totalRecebido ?? 0
                  const saldoAReceber = Math.max(0, totalContrato - totalRecebido)
                  return (
                    <div className="mb-1 pt-1">
                      <div className="flex items-center gap-1 mb-0.5">
                        <HandCoins className="w-3 h-3 text-gray-400" />
                        <h3 className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Recebimentos do Cliente</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="bg-[#1f2228]/50 rounded p-1">
                          <p className="text-[9px] text-gray-500 leading-tight">Contratado</p>
                          <p className="text-[10px] font-bold text-gray-300 leading-tight">
                            {loadingMetricas ? "..." : totalContrato > 0 ? formatarMoedaDisplay(totalContrato) : "—"}
                          </p>
                        </div>
                        <div className="bg-[#1f2228]/50 rounded p-1">
                          <p className="text-[9px] text-gray-500 leading-tight">Recebido</p>
                          <p className="text-[10px] font-bold text-green-400 leading-tight">
                            {loadingMetricas ? "..." : formatarMoedaDisplay(totalRecebido)}
                          </p>
                        </div>
                        <div className="bg-[#1f2228]/50 rounded p-1">
                          <p className="text-[9px] text-gray-500 leading-tight">A Receber</p>
                          <p className="text-[10px] font-bold text-[#7eaaee] leading-tight">
                            {loadingMetricas ? "..." : totalContrato > 0 ? formatarMoedaDisplay(saldoAReceber) : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Botões de ação rápida */}
                {userProfile === "builder" ? (
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    <Button
                      className="flex-1 flex-col gap-0.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 text-[9px] px-0 h-10 sm:h-9 sm:flex-row sm:gap-1 sm:text-xs sm:px-2"
                      onClick={(e) => handleNovaDespesa(e, obra.id)}
                      disabled={isDeleting}
                      title="Adicionar nova despesa"
                    >
                      <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Despesa</span>
                    </Button>
                    <Button
                      className="flex-1 flex-col gap-0.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 text-[9px] px-0 h-10 sm:h-9 sm:flex-row sm:gap-1 sm:text-xs sm:px-2"
                      onClick={(e) => handleRegistrarRecebimento(e, obra)}
                      disabled={isDeleting}
                      title="Registrar recebimento do cliente"
                    >
                      <HandCoins className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Recebimento</span>
                    </Button>
                    <Button
                      className="flex-1 flex-col gap-0.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 text-[9px] px-0 h-10 sm:h-9 sm:flex-row sm:gap-1 sm:text-xs sm:px-2"
                      onClick={(e) => handleNovoPagamento(e, obra.id)}
                      disabled={isDeleting}
                      title="Adicionar novo pagamento"
                    >
                      <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Pagamento</span>
                    </Button>
                    <Button
                      className="flex-1 flex-col gap-0.5 bg-[#2a2d35] hover:bg-white/[0.13] border border-white/[0.08] text-gray-300 text-[9px] px-0 h-10 sm:h-9 sm:flex-row sm:gap-1 sm:text-xs sm:px-2"
                      onClick={(e) => handleGerarRelatorio(e, obra.id)}
                      disabled={isDeleting}
                      title="Gerar relatório em PDF"
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Relatório</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <Button
                      className="w-full flex-col gap-0.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 text-[9px] px-0 h-10 sm:h-9 sm:flex-row sm:gap-1 sm:text-xs sm:px-2"
                      onClick={(e) => handleNovaDespesa(e, obra.id)}
                      disabled={isDeleting}
                      title="Adicionar nova despesa"
                    >
                      <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Despesa</span>
                    </Button>
                    <Button
                      className="w-full flex-col gap-0.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 text-[9px] px-0 h-10 sm:h-9 sm:flex-row sm:gap-1 sm:text-xs sm:px-2"
                      onClick={(e) => handleNovoPagamento(e, obra.id)}
                      disabled={isDeleting}
                      title="Adicionar novo pagamento"
                    >
                      <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Pagamento</span>
                    </Button>
                    <Button
                      className="w-full flex-col gap-0.5 bg-[#2a2d35] hover:bg-white/[0.13] border border-white/[0.08] text-gray-300 text-[9px] px-0 h-10 sm:h-9 sm:flex-row sm:gap-1 sm:text-xs sm:px-2"
                      onClick={(e) => handleGerarRelatorio(e, obra.id)}
                      disabled={isDeleting}
                      title="Gerar relatório em PDF"
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Relatório</span>
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
          {(() => {
            const obrasFiltradas = obras.filter(o => {
              if (filtroTipo !== "todos" && o.tipo !== filtroTipo) return false
              if (!busca.trim()) return true
              const q = busca.toLowerCase()
              return o.nome.toLowerCase().includes(q) || ((o as any).nome_cliente || (o as any).nomeCliente || "").toLowerCase().includes(q)
            })
            if (obrasFiltradas.length === 0) return (
              <div className="col-span-full flex flex-col items-center py-10 text-center">
                <Search className="w-8 h-8 text-gray-600 mb-3" />
                <p className="text-sm text-gray-400">Nenhuma obra encontrada{busca ? <> para <span className="text-white font-medium">"{busca}"</span></> : ""}</p>
                <button onClick={() => { setBusca(""); setFiltroTipo("todos") }} className="mt-2 text-xs text-[#7eaaee] transition-colors">Limpar filtros</button>
              </div>
            )
            return null
          })()}
        </div>
      </div>

      {/* Modal upgrade — owner com limite atingido */}
      {showUpgradeModal && (
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
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 h-10 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 border border-white/[0.1] rounded-xl text-sm"
              >
                Voltar
              </Button>
              <Button
                onClick={() => router.push("/dashboard/plano?upgrade=1")}
                className="flex-1 h-10 bg-[#0B3064] hover:bg-[#082551] text-white rounded-xl text-sm font-semibold"
              >
                Fazer upgrade
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {showEditModal && obraToEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800/90 rounded-2xl shadow-2xl max-w-3xl w-full my-8 border border-white/10">
            <div className="p-6 border-b border-white/[0.1]">
              <h2 className="text-2xl font-bold text-white">Editar Obra</h2>
              <p className="text-sm text-gray-400 mt-1">Atualize os dados básicos da obra</p>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Dados da Obra */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white pb-2 border-b-2 border-[#0B3064]/40">
                  Dados da Obra
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="edit-nome" className="text-gray-300">Nome da Obra *</Label>
                  <Input
                    id="edit-nome"
                    value={editFormData.nome}
                    onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                    placeholder="Ex: Casa da Praia"
                    className="bg-[#2a2d35] border-white/[0.1] text-white"
                  />
                </div>

                {/* Campo Nome do Cliente - apenas para perfil builder */}
                {userProfile === "builder" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-nome-cliente" className="text-gray-300">Nome do Cliente</Label>
                    <Input
                      id="edit-nome-cliente"
                      value={editFormData.nomeCliente}
                      onChange={(e) => setEditFormData({ ...editFormData, nomeCliente: e.target.value })}
                      placeholder="Ex: João da Silva"
                      className="bg-[#2a2d35] border-white/[0.1] text-white"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="edit-tipo" className="text-gray-300">Tipo *</Label>
                  <Select
                    value={editFormData.tipo}
                    onValueChange={(value) => setEditFormData({ ...editFormData, tipo: value })}
                  >
                    <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                      <SelectItem value="construcao">Construção</SelectItem>
                      <SelectItem value="reforma">Reforma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-area" className="text-gray-300">Área em m² *</Label>
                  <Input
                    id="edit-area"
                    type="text"
                    value={areaFormatada}
                    onChange={handleAreaChange}
                    placeholder="Ex: 1.020,50"
                    className="bg-[#2a2d35] border-white/[0.1] text-white"
                  />
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white pb-2 border-b-2 border-[#0B3064]/40">
                  Localização
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-estado" className="text-gray-300">Estado *</Label>
                    <Select
                      value={editFormData.estado}
                      onValueChange={(value) => setEditFormData({ ...editFormData, estado: value })}
                    >
                      <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                        {ESTADOS_BRASILEIROS.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-cidade" className="text-gray-300">Cidade *</Label>
                    <Input
                      id="edit-cidade"
                      value={editFormData.cidade}
                      onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })}
                      placeholder="Ex: São Paulo"
                      className="bg-[#2a2d35] border-white/[0.1] text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-bairro" className="text-gray-300">Bairro</Label>
                  <Input
                    id="edit-bairro"
                    value={editFormData.bairro}
                    onChange={(e) => setEditFormData({ ...editFormData, bairro: e.target.value })}
                    placeholder="Ex: Jardins"
                    className="bg-[#2a2d35] border-white/[0.1] text-white"
                  />
                </div>
              </div>

              {/* Orçamento */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white pb-2 border-b-2 border-[#0B3064]/40">
                  Orçamento Estimado
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="edit-orcamento" className="text-gray-300">Orçamento Estimado</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                      R$
                    </span>
                    <Input
                      id="edit-orcamento"
                      type="text"
                      value={orcamentoFormatado}
                      onChange={handleOrcamentoChange}
                      placeholder="0,00"
                      className="pl-12 bg-[#2a2d35] border-white/[0.1] text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/[0.1] flex gap-3">
              <Button
                variant="outline"
                onClick={handleCloseEditModal}
                className="flex-1 bg-[#1F2937] hover:bg-[#374151] text-white border-0"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1 bg-[#0B3064] hover:bg-[#082551] text-white"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && obraToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#1f2228] rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-white/[0.1]">
            {/* Ícone de alerta */}
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-red-500/30">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Excluir obra?
            </h2>

            {/* Nome da obra */}
            <p className="text-center text-gray-300 font-medium mb-4">
              {obraToDelete.nome}
            </p>

            {/* Texto de aviso */}
            <p className="text-gray-400 text-center mb-6">
              Essa ação é permanente e removerá despesas, profissionais, pagamentos e configurações vinculadas a esta obra.
            </p>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                onClick={handleCloseDeleteModal}
                variant="ghost"
                className="flex-1 bg-[#2a2d35] border border-slate-500 text-white hover:bg-white/[0.13]"
                disabled={deletingObraId !== null}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deletingObraId !== null}
              >
                {deletingObraId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de registro de recebimento */}
      {showRecebimentoModal && obraParaRecebimento && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#1f2228] rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 border border-white/[0.1]">
            {/* Cabeçalho */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <HandCoins className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Registrar Recebimento</h2>
                  <p className="text-sm text-gray-400">{obraParaRecebimento.nome}</p>
                </div>
              </div>
            </div>

            {loadingClientes ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#0B3064] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clientesObra.length === 0 ? (
              <>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 space-y-3 mb-6">
                  <p className="text-sm text-yellow-400/80">
                    Nenhum cliente cadastrado nesta obra. Cadastre um cliente antes de registrar um recebimento.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseRecebimentoModal()
                      setActiveObraId(obraParaRecebimento.id)
                      router.push("/dashboard/clientes/novo")
                    }}
                    className="flex items-center gap-1.5 h-9 px-4 bg-[#0B3064] hover:bg-[#082551] active:scale-95 text-white text-sm font-semibold rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar cliente
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCloseRecebimentoModal}
                    className="h-10 px-6 bg-[#2a2d35] hover:bg-slate-600 text-gray-300 border border-white/[0.1] rounded-md text-sm transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Formulário */}
                <div className="space-y-4">
                  {/* Cliente */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Cliente *</Label>
                    <Select value={recebimentoFormData.clienteId} onValueChange={(value) => setRecebimentoFormData({ ...recebimentoFormData, clienteId: value })}>
                      <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white">
                        <SelectValue placeholder="Selecionar cliente..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                        {clientesObra.map(c => (
                          <SelectItem key={c.id} value={c.id} className="text-white">{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Valor */}
                  <div className="space-y-2">
                    <Label htmlFor="valor-recebimento" className="text-gray-300">Valor Recebido *</Label>
                    <Input
                      id="valor-recebimento"
                      type="text"
                      value={recebimentoFormData.valor}
                      onChange={handleValorRecebimentoChange}
                      placeholder="R$ 0,00"
                      className="bg-[#2a2d35] border-white/[0.1] text-white"
                    />
                  </div>

                  {/* Data */}
                  <div className="space-y-2">
                    <Label htmlFor="data-recebimento" className="text-gray-300">Data do Recebimento *</Label>
                    <Input
                      id="data-recebimento"
                      type="date"
                      value={recebimentoFormData.data}
                      onChange={(e) => setRecebimentoFormData({ ...recebimentoFormData, data: e.target.value })}
                      className="bg-[#2a2d35] border-white/[0.1] text-white"
                    />
                  </div>

                  {/* Forma de Pagamento */}
                  <div className="space-y-2">
                    <Label htmlFor="forma-pagamento" className="text-gray-300">Forma de Pagamento</Label>
                    <Select
                      value={recebimentoFormData.formaPagamento}
                      onValueChange={(value) => setRecebimentoFormData({ ...recebimentoFormData, formaPagamento: value })}
                    >
                      <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                        <SelectItem value="Pix">Pix</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Transferência bancária">Transferência bancária</SelectItem>
                        <SelectItem value="Cartão de crédito">Cartão de crédito</SelectItem>
                        <SelectItem value="Cartão de débito">Cartão de débito</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Observação */}
                  <div className="space-y-2">
                    <Label htmlFor="observacao-recebimento" className="text-gray-300">Observação (opcional)</Label>
                    <Input
                      id="observacao-recebimento"
                      type="text"
                      value={recebimentoFormData.observacao}
                      onChange={(e) => setRecebimentoFormData({ ...recebimentoFormData, observacao: e.target.value })}
                      placeholder="Ex: Parcela 1/3"
                      className="bg-[#2a2d35] border-white/[0.1] text-white"
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCloseRecebimentoModal}
                    className="flex-1 h-10 !bg-[#2a2d35] hover:!bg-slate-600 !text-red-400 border border-white/[0.1] rounded-md text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <Button
                    onClick={handleSalvarRecebimento}
                    disabled={!recebimentoFormData.clienteId}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salvar Recebimento
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
