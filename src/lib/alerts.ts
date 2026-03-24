// Sistema de Alertas e Notificações - OBREASY

export interface AlertaOrcamento {
  id: string
  obraId: string
  ativo: boolean
  percentuais: number[] // ex: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  disparados: number[] // percentuais já disparados
}

export interface AlertaPrazo {
  id: string
  obraId: string
  titulo: string
  data: string // ISO date
  avisoAntecipado: number // dias antes (1, 3, 7)
  disparado: boolean
  criadoEm: string
}

export interface AlertaPagamento {
  id: string
  obraId: string
  titulo: string
  categoria: "profissional" | "material" | "outros"
  valor?: number
  profissionalId?: string
  dataInicial: string // ISO date
  recorrencia: "unico" | "semanal" | "mensal"
  diaSemana?: number // 0-6 (domingo-sábado) para semanal
  lembreteAntecipado?: number // dias antes
  proximaData: string // próxima data de disparo
  disparado: boolean
  criadoEm: string
  anexo?: string // Base64 do arquivo anexado
}

export interface Notificacao {
  id: string
  obraId: string
  tipo: "orcamento" | "prazo" | "pagamento"
  titulo: string
  mensagem: string
  lida: boolean
  criadaEm: string
  alertaId?: string // ID do alerta que gerou a notificação
}

// STORAGE KEYS
const ALERTAS_ORCAMENTO_KEY = "alertasOrcamento"
const ALERTAS_PRAZO_KEY = "alertasPrazo"
const ALERTAS_PAGAMENTO_KEY = "alertasPagamento"
const NOTIFICACOES_KEY = "notificacoes"

// ============= ALERTAS DE ORÇAMENTO =============

export function getAlertasOrcamento(): AlertaOrcamento[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(ALERTAS_ORCAMENTO_KEY)
  return data ? JSON.parse(data) : []
}

export function saveAlertasOrcamento(alertas: AlertaOrcamento[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ALERTAS_ORCAMENTO_KEY, JSON.stringify(alertas))
}

export function getAlertaOrcamentoByObra(obraId: string): AlertaOrcamento | null {
  const alertas = getAlertasOrcamento()
  return alertas.find(a => a.obraId === obraId) || null
}

export function createOrUpdateAlertaOrcamento(
  obraId: string,
  ativo: boolean,
  percentuais: number[]
): AlertaOrcamento {
  const alertas = getAlertasOrcamento()
  const existente = alertas.find(a => a.obraId === obraId)

  if (existente) {
    existente.ativo = ativo
    existente.percentuais = percentuais
    // Se desativou, limpar disparados
    if (!ativo) {
      existente.disparados = []
    }
    saveAlertasOrcamento(alertas)
    return existente
  }

  const novoAlerta: AlertaOrcamento = {
    id: `alerta-orc-${Date.now()}`,
    obraId,
    ativo,
    percentuais,
    disparados: []
  }

  alertas.push(novoAlerta)
  saveAlertasOrcamento(alertas)
  return novoAlerta
}

// ============= ALERTAS DE PRAZO =============

export function getAlertasPrazo(): AlertaPrazo[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(ALERTAS_PRAZO_KEY)
  return data ? JSON.parse(data) : []
}

export function saveAlertasPrazo(alertas: AlertaPrazo[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ALERTAS_PRAZO_KEY, JSON.stringify(alertas))
}

export function getAlertasPrazoByObra(obraId: string): AlertaPrazo[] {
  const alertas = getAlertasPrazo()
  return alertas.filter(a => a.obraId === obraId)
}

export function createAlertaPrazo(
  obraId: string,
  titulo: string,
  data: string,
  avisoAntecipado: number
): AlertaPrazo {
  const alertas = getAlertasPrazo()

  const novoAlerta: AlertaPrazo = {
    id: `alerta-prazo-${Date.now()}`,
    obraId,
    titulo,
    data,
    avisoAntecipado,
    disparado: false,
    criadoEm: new Date().toISOString()
  }

  alertas.push(novoAlerta)
  saveAlertasPrazo(alertas)
  return novoAlerta
}

export function deleteAlertaPrazo(id: string): void {
  const alertas = getAlertasPrazo()
  const filtrados = alertas.filter(a => a.id !== id)
  saveAlertasPrazo(filtrados)
}

// ============= ALERTAS DE PAGAMENTO =============

export function getAlertasPagamento(): AlertaPagamento[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(ALERTAS_PAGAMENTO_KEY)
  return data ? JSON.parse(data) : []
}

export function saveAlertasPagamento(alertas: AlertaPagamento[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ALERTAS_PAGAMENTO_KEY, JSON.stringify(alertas))
}

export function getAlertasPagamentoByObra(obraId: string): AlertaPagamento[] {
  const alertas = getAlertasPagamento()
  return alertas.filter(a => a.obraId === obraId)
}

export function createAlertaPagamento(
  obraId: string,
  titulo: string,
  categoria: "profissional" | "material" | "outros",
  dataInicial: string,
  recorrencia: "unico" | "semanal" | "mensal",
  valor?: number,
  profissionalId?: string,
  diaSemana?: number,
  lembreteAntecipado?: number,
  anexo?: string
): AlertaPagamento {
  const alertas = getAlertasPagamento()

  const novoAlerta: AlertaPagamento = {
    id: `alerta-pag-${Date.now()}`,
    obraId,
    titulo,
    categoria,
    valor,
    profissionalId,
    dataInicial,
    recorrencia,
    diaSemana,
    lembreteAntecipado,
    proximaData: dataInicial,
    disparado: false,
    criadoEm: new Date().toISOString(),
    anexo
  }

  alertas.push(novoAlerta)
  saveAlertasPagamento(alertas)
  return novoAlerta
}

export function deleteAlertaPagamento(id: string): void {
  const alertas = getAlertasPagamento()
  const filtrados = alertas.filter(a => a.id !== id)
  saveAlertasPagamento(filtrados)
}

// Calcular próxima data de recorrência
export function calcularProximaData(alerta: AlertaPagamento): string {
  const dataAtual = new Date(alerta.proximaData)

  if (alerta.recorrencia === "semanal") {
    dataAtual.setDate(dataAtual.getDate() + 7)
  } else if (alerta.recorrencia === "mensal") {
    dataAtual.setMonth(dataAtual.getMonth() + 1)
  }

  return dataAtual.toISOString().split("T")[0]
}

// ============= NOTIFICAÇÕES =============

export function getNotificacoes(): Notificacao[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(NOTIFICACOES_KEY)
  return data ? JSON.parse(data) : []
}

export function saveNotificacoes(notificacoes: Notificacao[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(NOTIFICACOES_KEY, JSON.stringify(notificacoes))
}

export function getNotificacoesByObra(obraId: string): Notificacao[] {
  const notificacoes = getNotificacoes()
  return notificacoes.filter(n => n.obraId === obraId).sort((a, b) => 
    new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime()
  )
}

export function getNotificacoesNaoLidas(obraId: string): Notificacao[] {
  const notificacoes = getNotificacoesByObra(obraId)
  return notificacoes.filter(n => !n.lida)
}

export function createNotificacao(
  obraId: string,
  tipo: "orcamento" | "prazo" | "pagamento",
  titulo: string,
  mensagem: string,
  alertaId?: string
): Notificacao {
  const notificacoes = getNotificacoes()

  const novaNotificacao: Notificacao = {
    id: `notif-${Date.now()}`,
    obraId,
    tipo,
    titulo,
    mensagem,
    lida: false,
    criadaEm: new Date().toISOString(),
    alertaId
  }

  notificacoes.push(novaNotificacao)
  saveNotificacoes(notificacoes)
  
  // Disparar evento customizado
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("novaNotificacao", { detail: novaNotificacao }))
  }

  return novaNotificacao
}

export function marcarNotificacaoComoLida(id: string): void {
  const notificacoes = getNotificacoes()
  const notificacao = notificacoes.find(n => n.id === id)
  
  if (notificacao) {
    notificacao.lida = true
    saveNotificacoes(notificacoes)
    
    // Disparar evento
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("notificacaoLida"))
    }
  }
}

export function marcarTodasComoLidas(obraId: string): void {
  const notificacoes = getNotificacoes()
  
  notificacoes.forEach(n => {
    if (n.obraId === obraId) {
      n.lida = true
    }
  })
  
  saveNotificacoes(notificacoes)
  
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notificacaoLida"))
  }
}

// ============= VERIFICAÇÃO AUTOMÁTICA =============

export function verificarAlertasOrcamento(obraId: string, orcamento: number, totalGasto: number): void {
  const alerta = getAlertaOrcamentoByObra(obraId)

  if (!alerta || !alerta.ativo || orcamento === 0) return

  const percentualAtual = (totalGasto / orcamento) * 100
  let houveMudanca = false

  // Resetar disparados se o gasto caiu abaixo dos percentuais
  // Isso permite que alertas sejam disparados novamente se o percentual for atingido após uma edição/exclusão
  const disparadosAtualizados = alerta.disparados.filter(percentual => {
    return percentualAtual >= percentual
  })

  if (disparadosAtualizados.length !== alerta.disparados.length) {
    alerta.disparados = disparadosAtualizados
    houveMudanca = true
  }

  alerta.percentuais.forEach(percentual => {
    // Se atingiu o percentual e ainda não foi disparado
    if (percentualAtual >= percentual && !alerta.disparados.includes(percentual)) {
      // Marcar como disparado
      alerta.disparados.push(percentual)
      houveMudanca = true

      // Criar notificação
      createNotificacao(
        obraId,
        "orcamento",
        `Alerta de Orçamento - ${percentual}%`,
        `Atenção! Os gastos da obra atingiram ${percentual}% do orçamento estimado (${formatarMoeda(totalGasto)} de ${formatarMoeda(orcamento)}).`,
        alerta.id
      )
    }
  })

  // Salvar alertas atualizados apenas se houve mudança
  if (houveMudanca) {
    const alertas = getAlertasOrcamento()
    const index = alertas.findIndex(a => a.id === alerta.id)
    if (index !== -1) {
      alertas[index] = alerta
      saveAlertasOrcamento(alertas)
    }
  }
}

export function verificarAlertasPrazo(obraId: string): void {
  const alertas = getAlertasPrazoByObra(obraId)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  alertas.forEach(alerta => {
    if (alerta.disparado) return

    const dataAlerta = new Date(alerta.data)
    dataAlerta.setHours(0, 0, 0, 0)

    const dataAviso = new Date(dataAlerta)
    dataAviso.setDate(dataAviso.getDate() - alerta.avisoAntecipado)

    // Se hoje é igual ou posterior à data de aviso
    if (hoje >= dataAviso) {
      alerta.disparado = true

      const diasRestantes = Math.ceil((dataAlerta.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      
      let mensagem = ""
      if (diasRestantes > 0) {
        mensagem = `Lembrete: "${alerta.titulo}" está próximo! Faltam ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}.`
      } else if (diasRestantes === 0) {
        mensagem = `Atenção: "${alerta.titulo}" é hoje!`
      } else {
        mensagem = `Alerta: "${alerta.titulo}" venceu há ${Math.abs(diasRestantes)} ${Math.abs(diasRestantes) === 1 ? "dia" : "dias"}!`
      }

      createNotificacao(
        obraId,
        "prazo",
        "Alerta de Prazo",
        mensagem,
        alerta.id
      )
    }
  })

  saveAlertasPrazo(alertas)
}

export function verificarAlertasPagamento(obraId: string): void {
  const alertas = getAlertasPagamentoByObra(obraId)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  alertas.forEach(alerta => {
    const proximaData = new Date(alerta.proximaData)
    proximaData.setHours(0, 0, 0, 0)

    const dataAviso = new Date(proximaData)
    if (alerta.lembreteAntecipado) {
      dataAviso.setDate(dataAviso.getDate() - alerta.lembreteAntecipado)
    }

    // Se hoje é igual ou posterior à data de aviso e ainda não disparou
    if (hoje >= dataAviso && !alerta.disparado) {
      alerta.disparado = true

      const diasRestantes = Math.ceil((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      
      let mensagem = `Pagamento: "${alerta.titulo}"`
      if (alerta.valor) {
        mensagem += ` - ${formatarMoeda(alerta.valor)}`
      }
      
      if (diasRestantes > 0) {
        mensagem += ` vence em ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}.`
      } else if (diasRestantes === 0) {
        mensagem += ` vence hoje!`
      } else {
        mensagem += ` está vencido há ${Math.abs(diasRestantes)} ${Math.abs(diasRestantes) === 1 ? "dia" : "dias"}!`
      }

      createNotificacao(
        obraId,
        "pagamento",
        "Alerta de Pagamento",
        mensagem,
        alerta.id
      )

      // Se for recorrente, calcular próxima data e resetar disparado
      if (alerta.recorrencia !== "unico") {
        alerta.proximaData = calcularProximaData(alerta)
        alerta.disparado = false
      }
    }
  })

  saveAlertasPagamento(alertas)
}

export function verificarTodosAlertas(obraId: string, orcamento: number, totalGasto: number): void {
  verificarAlertasOrcamento(obraId, orcamento, totalGasto)
  verificarAlertasPrazo(obraId)
  verificarAlertasPagamento(obraId)
}

// Helper
function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}
