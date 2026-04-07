"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Plus,
  Trash2,
  Calendar,
  Wallet,
  AlertCircle,
  Settings,
  Check,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FileUpload } from "@/components/custom/FileUpload"
import {
  getAlertaOrcamentoByObra,
  createOrUpdateAlertaOrcamento,
  getAlertasPrazoByObra,
  createAlertaPrazo,
  deleteAlertaPrazo,
  getAlertasPagamentoByObra,
  createAlertaPagamento,
  deleteAlertaPagamento,
  verificarTodosAlertas,
  type AlertaPrazo,
  type AlertaPagamento
} from "@/lib/alerts"
import { inicializarAvisos } from "@/lib/alert-manager"

// Percentuais disponíveis para seleção (10% a 100% em intervalos de 10%)
const PERCENTUAIS_DISPONIVEIS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

export default function AlertasPage() {
  const router = useRouter()
  const [obraId, setObraId] = useState<string>("")
  const [obraNome, setObraNome] = useState<string>("")
  const [orcamento, setOrcamento] = useState<number>(0)
  const [totalGasto, setTotalGasto] = useState<number>(0)

  // Alertas de orçamento
  const [alertaOrcamentoAtivo, setAlertaOrcamentoAtivo] = useState(false)
  const [percentuais, setPercentuais] = useState<number[]>([])

  // Alertas de prazo
  const [alertasPrazo, setAlertasPrazo] = useState<AlertaPrazo[]>([])

  // Alertas de pagamento
  const [alertasPagamento, setAlertasPagamento] = useState<AlertaPagamento[]>([])

  // Modais
  const [modalConfig, setModalConfig] = useState(false)
  const [modalPrazo, setModalPrazo] = useState(false)
  const [modalPagamento, setModalPagamento] = useState(false)

  // Profissionais (para select)
  const [profissionais, setProfissionais] = useState<any[]>([])

  // Estados para o formulário de pagamento
  const [valorPagamentoFormatado, setValorPagamentoFormatado] = useState("")
  const [anexoPagamento, setAnexoPagamento] = useState<string | null>(null)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    const activeObraId = localStorage.getItem("activeObraId")
    if (!activeObraId) {
      router.push("/obras")
      return
    }

    setObraId(activeObraId)

    // Carregar obra
    const obras = JSON.parse(localStorage.getItem("obras") || "[]")
    const obra = obras.find((o: any) => o.id === activeObraId)
    if (obra) {
      setObraNome(obra.nome)
      setOrcamento(obra.orcamento || 0)

      // Ativar alertas de orçamento automaticamente se ainda não existir
      const alertaExistente = getAlertaOrcamentoByObra(activeObraId)
      if (!alertaExistente && obra.orcamento && obra.orcamento > 0) {
        // CRÍTICO: Criar alerta automático com 50% e 100% obrigatórios
        createOrUpdateAlertaOrcamento(activeObraId, true, [50, 100])
      } else if (alertaExistente && obra.orcamento && obra.orcamento > 0) {
        // Garantir que 50% e 100% estejam sempre ativos
        const percentuaisObrigatorios = [50, 100]
        const percentuaisAtuais = alertaExistente.percentuais || []
        const percentuaisUnicos = [...new Set([...percentuaisObrigatorios, ...percentuaisAtuais])].sort((a, b) => a - b)

        if (JSON.stringify(percentuaisUnicos) !== JSON.stringify(percentuaisAtuais)) {
          createOrUpdateAlertaOrcamento(activeObraId, alertaExistente.ativo, percentuaisUnicos)
        }
      }
    }

    // Calcular total gasto
    const despesas = JSON.parse(localStorage.getItem("despesas") || "[]")
    const despesasObra = despesas.filter((d: any) => d.obraId === activeObraId)
    const total = despesasObra.reduce((acc: number, d: any) => acc + (d.valor || 0), 0)
    setTotalGasto(total)

    // Carregar profissionais
    const profs = JSON.parse(localStorage.getItem("profissionais") || "[]")
    const profsObra = profs.filter((p: any) => p.obraId === activeObraId)
    setProfissionais(profsObra)

    // Carregar alertas
    loadAlertas(activeObraId)

    // Verificar alertas automaticamente
    verificarTodosAlertas(activeObraId, obra?.orcamento || 0, total)

    // CRÍTICO: Inicializar sistema de avisos inteligentes
    inicializarAvisos(activeObraId)
  }, [router])

  const loadAlertas = (obraId: string) => {
    // Alerta de orçamento
    const alertaOrc = getAlertaOrcamentoByObra(obraId)
    if (alertaOrc) {
      setAlertaOrcamentoAtivo(alertaOrc.ativo)
      setPercentuais(alertaOrc.percentuais)
    }

    // Alertas de prazo
    const prazo = getAlertasPrazoByObra(obraId)
    setAlertasPrazo(prazo)

    // Alertas de pagamento
    const pagamento = getAlertasPagamentoByObra(obraId)
    setAlertasPagamento(pagamento)
  }

  const handleTogglePercentual = (percentual: number) => {
    if (percentuais.includes(percentual)) {
      setPercentuais(percentuais.filter(p => p !== percentual))
    } else {
      setPercentuais([...percentuais, percentual].sort((a, b) => a - b))
    }
  }

  const handleSalvarAlertaOrcamento = () => {
    createOrUpdateAlertaOrcamento(obraId, alertaOrcamentoAtivo, percentuais)
    setModalConfig(false)
    loadAlertas(obraId)

    // Verificar imediatamente
    verificarTodosAlertas(obraId, orcamento, totalGasto)
  }

  const handleCriarAlertaPrazo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const titulo = formData.get("titulo") as string
    const data = formData.get("data") as string
    const avisoAntecipado = parseInt(formData.get("avisoAntecipado") as string)

    createAlertaPrazo(obraId, titulo, data, avisoAntecipado)
    loadAlertas(obraId)
    setModalPrazo(false)

    // Verificar
    verificarTodosAlertas(obraId, orcamento, totalGasto)
  }

  const handleExcluirAlertaPrazo = (id: string) => {
    if (confirm("Deseja excluir este alerta de prazo?")) {
      deleteAlertaPrazo(id)
      loadAlertas(obraId)
    }
  }

  const handleCriarAlertaPagamento = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const titulo = formData.get("titulo") as string
    const categoria = formData.get("categoria") as "profissional" | "material" | "outros"
    const valor = valorPagamentoFormatado ? removerFormatacao(valorPagamentoFormatado) : undefined
    const profissionalId = formData.get("profissionalId") as string || undefined
    const dataInicial = formData.get("dataInicial") as string
    const recorrencia = formData.get("recorrencia") as "unico" | "semanal" | "mensal"
    const diaSemanaStr = formData.get("diaSemana") as string
    const diaSemana = diaSemanaStr ? parseInt(diaSemanaStr) : undefined
    const lembreteStr = formData.get("lembreteAntecipado") as string
    const lembreteAntecipado = lembreteStr ? parseInt(lembreteStr) : 1 // Padrão: 1 dia antes

    createAlertaPagamento(
      obraId,
      titulo,
      categoria,
      dataInicial,
      recorrencia,
      valor,
      profissionalId,
      diaSemana,
      lembreteAntecipado,
      anexoPagamento || undefined
    )

    loadAlertas(obraId)
    setModalPagamento(false)
    setAnexoPagamento(null)
    setValorPagamentoFormatado("")

    // Verificar
    verificarTodosAlertas(obraId, orcamento, totalGasto)
  }

  const handleExcluirAlertaPagamento = (id: string) => {
    if (confirm("Deseja excluir este alerta de pagamento?")) {
      deleteAlertaPagamento(id)
      loadAlertas(obraId)
    }
  }

  const formatarData = (dataISO: string): string => {
    const data = new Date(dataISO)
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  // Função para formatar valor monetário enquanto o usuário digita
  const formatarValorInput = (valor: string): string => {
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

  const handleValorPagamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value
    const valorFormatado = formatarValorInput(valorDigitado)
    setValorPagamentoFormatado(valorFormatado)
  }

  // Obter data atual no formato YYYY-MM-DD
  const getDataAtual = (): string => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const dia = String(hoje.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Bell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Alertas e Notificações
            </h1>
            <p className="text-sm text-gray-400">
              {obraNome}
            </p>
          </div>
        </div>

        {/* Card Configurações Gerais */}
        <Card className="p-5 mb-5 bg-[#1f2228]/60 border border-white/[0.08] shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Configurações Gerais</h2>
              <p className="text-sm text-gray-400">
                Configure alertas de orçamento e outros avisos importantes
              </p>
            </div>
            <Button
              onClick={() => setModalConfig(true)}
              className="bg-[#0B3064] hover:bg-[#082551] text-white shadow-lg shadow-blue-600/20"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
          </div>
        </Card>

        {/* Status dos Alertas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card className="p-4 bg-slate-800/35 border border-white/[0.08] shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Orçamento</h3>
            </div>
            <p className={`text-sm font-medium ${alertaOrcamentoAtivo ? "text-green-400" : "text-gray-500"}`}>
              {alertaOrcamentoAtivo ? "Ativado" : "Desativado"}
            </p>
            {alertaOrcamentoAtivo && percentuais.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {percentuais.length} {percentuais.length === 1 ? "alerta configurado" : "alertas configurados"}
              </p>
            )}
          </Card>

          <Card className="p-4 bg-slate-800/35 border border-white/[0.08] shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Prazos</h3>
            </div>
            <p className="text-sm font-medium text-white">
              {alertasPrazo.length} {alertasPrazo.length === 1 ? "alerta" : "alertas"}
            </p>
          </Card>

          <Card className="p-4 bg-slate-800/35 border border-white/[0.08] shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-[#0B3064]/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[#7eaaee]" />
              </div>
              <h3 className="text-sm font-bold text-white">Pagamentos</h3>
            </div>
            <p className="text-sm font-medium text-white">
              {alertasPagamento.length} {alertasPagamento.length === 1 ? "alerta" : "alertas"}
            </p>
          </Card>
        </div>

        {/* Alertas de Prazo */}
        <Card className="p-5 mb-5 bg-[#1f2228]/60 border border-white/[0.08] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Alertas de Prazo</h2>
            </div>
            <Button
              onClick={() => setModalPrazo(true)}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Alerta
            </Button>
          </div>

          {alertasPrazo.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum alerta de prazo configurado
            </div>
          ) : (
            <div className="space-y-2">
              {alertasPrazo.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-center justify-between p-3 bg-[#1f2228]/50 rounded-lg border border-white/[0.08] hover:bg-[#1f2228]/80 transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{alerta.titulo}</h3>
                    <p className="text-xs text-gray-400">
                      Data: {formatarData(alerta.data)} • Aviso: {alerta.avisoAntecipado} {alerta.avisoAntecipado === 1 ? "dia" : "dias"} antes
                    </p>
                    {alerta.disparado && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium mt-1">
                        <Check className="w-3 h-3" />
                        Disparado
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExcluirAlertaPrazo(alerta.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Alertas de Pagamento */}
        <Card className="p-5 bg-[#1f2228]/60 border border-white/[0.08] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0B3064]/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[#7eaaee]" />
              </div>
              <h2 className="text-lg font-bold text-white">Alertas de Pagamento</h2>
            </div>
            <Button
              onClick={() => setModalPagamento(true)}
              size="sm"
              className="bg-[#0B3064] hover:bg-[#082551] text-white shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Alerta
            </Button>
          </div>

          {alertasPagamento.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum alerta de pagamento configurado
            </div>
          ) : (
            <div className="space-y-2">
              {alertasPagamento.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-center justify-between p-3 bg-[#1f2228]/50 rounded-lg border border-white/[0.08] hover:bg-[#1f2228]/80 transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{alerta.titulo}</h3>
                    <p className="text-xs text-gray-400">
                      {alerta.valor && `${formatarMoeda(alerta.valor)} • `}
                      {alerta.categoria === "profissional" ? "Profissional" : alerta.categoria === "material" ? "Material" : "Outros"}
                      {" • "}
                      {alerta.recorrencia === "unico" ? "Único" : alerta.recorrencia === "semanal" ? "Semanal" : "Mensal"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Próxima data: {formatarData(alerta.proximaData)}
                      {alerta.lembreteAntecipado && ` • Lembrete: ${alerta.lembreteAntecipado} ${alerta.lembreteAntecipado === 1 ? "dia" : "dias"} antes`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExcluirAlertaPagamento(alerta.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Modal Configurar Alertas de Orçamento */}
        <Dialog open={modalConfig} onOpenChange={setModalConfig}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-[#1f2228] border-white/[0.1]">
            <DialogHeader>
              <DialogTitle className="text-white">Configurar Alertas de Orçamento</DialogTitle>
              <DialogDescription className="text-gray-400">
                Receba avisos quando os gastos atingirem percentuais do orçamento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ativo" className="text-base text-gray-300">
                  Ativar alertas de orçamento
                </Label>
                <Switch
                  id="ativo"
                  checked={alertaOrcamentoAtivo}
                  onCheckedChange={setAlertaOrcamentoAtivo}
                />
              </div>

              {alertaOrcamentoAtivo && (
                <div className="space-y-3 pt-4 border-t border-white/[0.1]">
                  <Label className="text-gray-300">Alertar quando atingir:</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PERCENTUAIS_DISPONIVEIS.map((percentual) => (
                      <label
                        key={percentual}
                        className="flex items-center gap-2 cursor-pointer hover:bg-white/[0.08] p-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={percentuais.includes(percentual)}
                          onChange={() => handleTogglePercentual(percentual)}
                          className="w-4 h-4 text-[#0B3064] bg-[#2a2d35] border-white/[0.1] rounded focus:ring-[#0B3064]"
                        />
                        <span className="text-sm font-medium text-gray-300">
                          {percentual}% do orçamento
                        </span>
                      </label>
                    ))}
                  </div>

                  {percentuais.length === 0 && (
                    <p className="text-sm text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
                      Selecione pelo menos um percentual para ativar os alertas
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setModalConfig(false)}
                className="flex-1 bg-[#2a2d35] hover:bg-white/[0.13] text-white border-white/[0.1]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarAlertaOrcamento}
                className="flex-1 bg-[#0B3064] hover:bg-[#082551] text-white"
                disabled={alertaOrcamentoAtivo && percentuais.length === 0}
              >
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Novo Alerta de Prazo */}
        <Dialog open={modalPrazo} onOpenChange={setModalPrazo}>
          <DialogContent className="sm:max-w-md bg-[#1f2228] border-white/[0.1]">
            <DialogHeader>
              <DialogTitle className="text-white">Novo Alerta de Prazo</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure uma data importante da obra
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCriarAlertaPrazo} className="space-y-4 py-4">
              <div>
                <Label htmlFor="titulo" className="text-gray-300">Título do alerta</Label>
                <Input
                  id="titulo"
                  name="titulo"
                  placeholder="Ex: Entrega de material"
                  className="bg-[#2a2d35] border-white/[0.1] text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="data" className="text-gray-300">Data</Label>
                <Input
                  id="data"
                  name="data"
                  type="date"
                  className="bg-[#2a2d35] border-white/[0.1] text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="avisoAntecipado" className="text-gray-300">Avisar com antecedência</Label>
                <Select name="avisoAntecipado" defaultValue="1" required>
                  <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                    <SelectItem value="1">1 dia antes</SelectItem>
                    <SelectItem value="3">3 dias antes</SelectItem>
                    <SelectItem value="7">7 dias antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalPrazo(false)}
                  className="flex-1 bg-[#2a2d35] hover:bg-white/[0.13] text-white border-white/[0.1]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Criar Alerta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Novo Alerta de Pagamento */}
        <Dialog open={modalPagamento} onOpenChange={(open) => {
          setModalPagamento(open)
          if (!open) {
            setValorPagamentoFormatado("")
            setAnexoPagamento(null)
          }
        }}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-[#1f2228] border-white/[0.1]">
            <DialogHeader>
              <DialogTitle className="text-white">Novo Alerta de Pagamento</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure um lembrete de pagamento
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCriarAlertaPagamento} className="space-y-4 py-4">
              <div>
                <Label htmlFor="titulo-pag" className="text-gray-300">Título do pagamento</Label>
                <Input
                  id="titulo-pag"
                  name="titulo"
                  placeholder="Ex: Pagamento pedreiro"
                  className="bg-[#2a2d35] border-white/[0.1] text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoria" className="text-gray-300">Categoria</Label>
                <Select name="categoria" defaultValue="profissional" required>
                  <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valor-pag" className="text-gray-300">
                  Valor <span className="text-xs text-gray-500">(opcional)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                    R$
                  </span>
                  <Input
                    id="valor-pag"
                    name="valor"
                    type="text"
                    value={valorPagamentoFormatado}
                    onChange={handleValorPagamentoChange}
                    placeholder="0,00"
                    className="bg-[#2a2d35] border-white/[0.1] text-white pl-10"
                  />
                </div>
              </div>

              {profissionais.length > 0 && (
                <div>
                  <Label htmlFor="profissionalId" className="text-gray-300">Profissional (opcional)</Label>
                  <Select name="profissionalId">
                    <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                      {profissionais.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="dataInicial" className="text-gray-300">Data inicial</Label>
                <Input
                  id="dataInicial"
                  name="dataInicial"
                  type="date"
                  defaultValue={getDataAtual()}
                  className="bg-[#2a2d35] border-white/[0.1] text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="recorrencia" className="text-gray-300">Recorrência</Label>
                <Select name="recorrencia" defaultValue="unico" required>
                  <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                    <SelectItem value="unico">Único</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lembreteAntecipado" className="text-gray-300">
                  Lembrete antecipado <span className="text-xs text-gray-500">(opcional)</span>
                </Label>
                <Select name="lembreteAntecipado" defaultValue="1">
                  <SelectTrigger className="bg-[#2a2d35] border-white/[0.1] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2d35] border-white/[0.1]">
                    <SelectItem value="1">1 dia antes</SelectItem>
                    <SelectItem value="3">3 dias antes</SelectItem>
                    <SelectItem value="7">7 dias antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FileUpload
                label="Anexar documento"
                accept="image/jpeg,image/png,application/pdf"
                maxSize={10}
                value={anexoPagamento}
                onChange={(file, preview) => setAnexoPagamento(preview)}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalPagamento(false)
                    setValorPagamentoFormatado("")
                    setAnexoPagamento(null)
                  }}
                  className="flex-1 bg-[#2a2d35] hover:bg-white/[0.13] text-white border-white/[0.1]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#0B3064] hover:bg-[#082551] text-white"
                >
                  Criar Alerta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
