/**
 * Funções centralizadas para manipulação de dados no localStorage
 * Garante consistência e reutilização em todo o projeto
 *
 * FONTE ÚNICA DE VERDADE PARA MÃO DE OBRA:
 * - Pagamentos de profissionais = Despesas com category="mao_obra" + profissionalId
 * - Sempre sincronizados bidirecionalmente
 */

import { avisoAposExcluirDespesa, avisoAposExcluirPagamento } from './alert-manager'

/**
 * Validar se uma string é um UUID válido
 * @param value - Valor a ser validado
 * @returns true se for UUID válido, false caso contrário
 */
export function isValidUUID(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false

  // Regex para UUID v4 (padrão do gen_random_uuid() do PostgreSQL)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Validar UUID antes de operações no banco
 * Lança erro descritivo se o UUID for inválido
 * @param value - UUID a ser validado
 * @param fieldName - Nome do campo (para mensagem de erro)
 * @throws Error se o UUID for inválido
 */
export function validateUUID(value: string | null | undefined, fieldName: string): void {
  if (!isValidUUID(value)) {
    const errorMsg = `UUID inválido para ${fieldName}: "${value}". Apenas UUIDs do banco são permitidos.`
    console.error(errorMsg, {
      value,
      type: typeof value,
      isTemporaryId: value?.includes('_') || false
    })
    throw new Error(errorMsg)
  }
}

export interface Despesa {
  id: string
  obraId: string
  data: string
  tipo: string
  categoria: string
  descricao: string
  valor: number
  formaPagamento: string
  fornecedor?: string
  observacoes?: string
  category?: string
  professionalId?: string
  profissionalId?: string // Suporte a ambos os nomes
  criadoEm?: string
  atualizadoEm?: string
}

export interface Pagamento {
  id: string
  obraId: string
  profissionalId: string
  data: string
  valor: number
  formaPagamento?: string
  observacao?: string
}

export interface Obra {
  id: string
  userId: string
  nome: string
  nomeCliente?: string
  tipo: string
  area: number
  localizacao: {
    estado: string
    cidade: string
  }
  orcamento: number | null
  valorContratado?: number | null
  dataInicio?: string | null
  dataTermino?: string | null
  criadaEm: string
}

export interface Profissional {
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

export interface Recebimento {
  id: string
  obraId: string
  valor: number
  data: string
  formaPagamento?: string
  observacao?: string
  comprovanteUrl?: string | null
  criadoEm: string
}

export type UserProfile = "owner" | "builder" | null

export interface User {
  name: string
  email: string
  profile?: UserProfile
}

/**
 * Normalizar ID do profissional (suporta professionalId e profissionalId)
 */
function getProfissionalId(despesa: Despesa): string | undefined {
  return (despesa as any).professionalId || despesa.profissionalId
}

/**
 * Excluir uma despesa do localStorage e Supabase
 * @param obraId - ID da obra (para validação futura)
 * @param despesaId - ID da despesa a ser excluída
 * @returns true se excluiu com sucesso, false caso contrário
 */
export async function deleteDespesa(obraId: string, despesaId: string): Promise<boolean> {
  try {
    if (!despesaId) {
      return false
    }

    // Validar UUID antes de deletar
    try {
      validateUUID(despesaId, "despesaId")
    } catch (error) {
      console.error("Erro de validação ao deletar despesa:", error)
      return false
    }

    // Excluir do Supabase
    const { supabase } = await import("@/lib/supabase")
    const { error } = await supabase
      .from("despesas")
      .delete()
      .eq("id", despesaId)

    if (error) {
      console.error("Erro ao excluir despesa do Supabase:", error)
      return false
    }

    // Limpar do localStorage se existir (cache local)
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]") as Despesa[]
    const despesasAtualizadas = todasDespesas.filter(d => d.id !== despesaId)
    localStorage.setItem("despesas", JSON.stringify(despesasAtualizadas))

    // CRÍTICO: Recalcular avisos após excluir despesa
    if (obraId) {
      avisoAposExcluirDespesa(obraId)
    }

    return true
  } catch (error) {
    console.error("Erro ao excluir despesa:", error)
    return false
  }
}

/**
 * Excluir um pagamento (que é uma despesa de mão de obra vinculada a profissional)
 * @param obraId - ID da obra (para validação futura)
 * @param profissionalId - ID do profissional (para validação futura)
 * @param pagamentoId - ID do pagamento (despesa) a ser excluído
 * @returns true se excluiu com sucesso, false caso contrário
 */
export async function deletePagamento(obraId: string, profissionalId: string, pagamentoId: string): Promise<boolean> {
  try {
    if (!pagamentoId) {
      return false
    }

    // Validar UUID antes de deletar
    try {
      validateUUID(pagamentoId, "pagamentoId")
    } catch (error) {
      console.error("Erro de validação ao deletar pagamento:", error)
      return false
    }

    // Excluir do Supabase
    const { supabase } = await import("@/lib/supabase")
    const { error } = await supabase
      .from("pagamentos")
      .delete()
      .eq("id", pagamentoId)

    if (error) {
      console.error("Erro ao excluir pagamento do Supabase:", error)
      // Continuar para excluir do localStorage mesmo se falhar no Supabase
    }

    // Pagamentos são despesas de mão de obra vinculadas ao profissional
    // Usar a mesma função de deleteDespesa
    const sucesso = await deleteDespesa(obraId, pagamentoId)

    // CRÍTICO: Recalcular avisos após excluir pagamento
    if (sucesso && obraId) {
      avisoAposExcluirPagamento(obraId)
    }

    return sucesso
  } catch (error) {
    console.error("Erro ao excluir pagamento:", error)
    return false
  }
}

/**
 * Obter todas as despesas de uma obra
 * @param obraId - ID da obra
 * @returns Array de despesas da obra
 */
export function getDespesasByObra(obraId: string): Despesa[] {
  try {
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]") as Despesa[]
    return todasDespesas.filter(d => d.obraId === obraId)
  } catch (error) {
    console.error("Erro ao carregar despesas:", error)
    return []
  }
}

/**
 * Obter todos os pagamentos de um profissional
 * FONTE ÚNICA DE VERDADE: Despesas com category="mao_obra" + profissionalId
 * @param obraId - ID da obra
 * @param profissionalId - ID do profissional
 * @returns Array de pagamentos (despesas de mão de obra) do profissional
 */
export function getPagamentosByProfissional(obraId: string, profissionalId: string): Despesa[] {
  try {
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]") as Despesa[]
    return todasDespesas.filter(d => {
      const category = String(d.category ?? d.categoria ?? "").toLowerCase()
      const profId = getProfissionalId(d)
      return d.obraId === obraId && 
             profId === profissionalId && 
             (category === "mao_obra" || category === "mão de obra")
    })
  } catch (error) {
    console.error("Erro ao carregar pagamentos:", error)
    return []
  }
}

/**
 * Obter todas as obras do usuário autenticado
 * @returns Array de obras do usuário
 */
export function getObrasDoUsuario(): Obra[] {
  try {
    const userData = localStorage.getItem("user")
    if (!userData) return []
    
    const user = JSON.parse(userData)
    const todasObras = JSON.parse(localStorage.getItem("obras") || "[]") as Obra[]
    
    return todasObras.filter(o => o.userId === user.email)
  } catch (error) {
    console.error("Erro ao carregar obras:", error)
    return []
  }
}

/**
 * Definir a obra ativa no localStorage
 * @param obraId - ID da obra a ser definida como ativa
 */
export function setActiveObraId(obraId: string): void {
  try {
    localStorage.setItem("activeObraId", obraId)
  } catch (error) {
    console.error("Erro ao definir obra ativa:", error)
  }
}

/**
 * Obter o ID da obra ativa do localStorage
 * @returns ID da obra ativa ou null se não houver
 */
export function getActiveObraId(): string | null {
  try {
    return localStorage.getItem("activeObraId")
  } catch (error) {
    console.error("Erro ao obter obra ativa:", error)
    return null
  }
}

/**
 * Obter a obra ativa completa (SÍNCRONO - apenas localStorage)
 * @returns Obra ativa ou null se não houver
 */
export function getActiveObra(): Obra | null {
  try {
    const activeId = getActiveObraId()
    if (!activeId) return null

    const todasObras = JSON.parse(localStorage.getItem("obras") || "[]") as Obra[]
    return todasObras.find(o => o.id === activeId) || null
  } catch (error) {
    console.error("Erro ao obter obra ativa:", error)
    return null
  }
}

/**
 * Obter a obra ativa do Supabase (ASSÍNCRONO)
 * Carrega a obra diretamente do banco de dados usando o activeObraId
 * @returns Promise com a obra ativa ou null se não houver
 */
export async function getActiveObraFromSupabase(): Promise<Obra | null> {
  try {
    const activeId = getActiveObraId()
    if (!activeId) return null

    // Importar supabase dinamicamente
    const { supabase } = await import("@/lib/supabase")

    // Buscar a obra no Supabase
    const { data, error } = await supabase
      .from("obras")
      .select("*")
      .eq("id", activeId)
      .single()

    if (error) {
      console.error("Erro ao carregar obra do Supabase:", error)
      return null
    }

    if (!data) return null

    // Converter para formato da interface Obra
    const obraData = data as any
    return {
      id: obraData.id,
      userId: obraData.user_id,
      nome: obraData.nome,
      nomeCliente: obraData.nome_cliente || undefined,
      tipo: obraData.tipo,
      area: obraData.area,
      localizacao: obraData.localizacao,
      orcamento: obraData.orcamento,
      valorContratado: obraData.valor_contratado || null,
      dataInicio: obraData.data_inicio || null,
      dataTermino: obraData.data_termino || null,
      criadaEm: obraData.criada_em,
    } as Obra
  } catch (error) {
    console.error("Erro ao obter obra ativa do Supabase:", error)
    return null
  }
}

/**
 * Calcular valor total pago a um profissional
 * FONTE ÚNICA: Soma das despesas de mão de obra vinculadas ao profissional
 * @param obraId - ID da obra
 * @param profissionalId - ID do profissional
 * @returns Valor total pago
 */
export function calcularValorPagoProfissional(obraId: string, profissionalId: string): number {
  const pagamentos = getPagamentosByProfissional(obraId, profissionalId)
  return pagamentos.reduce((acc, p) => acc + (p.valor ?? 0), 0)
}

/**
 * Calcular métricas financeiras de uma obra
 * @param obraId - ID da obra
 * @returns Objeto com métricas financeiras
 */
export function calcularMetricasObra(obraId: string) {
  try {
    const despesas = getDespesasByObra(obraId)
    const totalGasto = despesas.reduce((acc, d) => acc + (d.valor ?? 0), 0)
    
    const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]") as Profissional[]
    const profissionaisObra = todosProfissionais.filter(p => p.obraId === obraId)
    
    const todasObras = JSON.parse(localStorage.getItem("obras") || "[]") as Obra[]
    const obra = todasObras.find(o => o.id === obraId)
    
    const orcamentoEstimado = obra?.orcamento || 0
    const saldoDisponivel = orcamentoEstimado - totalGasto
    const areaM2 = obra?.area || 0
    const custoPorM2 = areaM2 > 0 ? totalGasto / areaM2 : 0
    
    return {
      orcamentoEstimado,
      totalGasto,
      saldoDisponivel,
      custoPorM2,
      areaM2
    }
  } catch (error) {
    console.error("Erro ao calcular métricas:", error)
    return {
      orcamentoEstimado: 0,
      totalGasto: 0,
      saldoDisponivel: 0,
      custoPorM2: 0,
      areaM2: 0
    }
  }
}

/**
 * Calcular métricas financeiras de uma obra do SUPABASE (ASSÍNCRONO)
 * Carrega dados diretamente do banco de dados
 * @param obraId - ID da obra
 * @returns Promise com objeto de métricas financeiras
 */
export async function calcularMetricasObraFromSupabase(obraId: string) {
  try {
    // Importar supabase dinamicamente
    const { supabase } = await import("@/lib/supabase")

    // Buscar obra no Supabase
    const { data: obraData, error: obraError } = await supabase
      .from("obras")
      .select("*")
      .eq("id", obraId)
      .single()

    if (obraError || !obraData) {
      console.error("Erro ao carregar obra:", obraError)
      return {
        orcamentoEstimado: 0,
        totalGasto: 0,
        saldoDisponivel: 0,
        custoPorM2: 0,
        areaM2: 0
      }
    }

    const obra = obraData as any

    // Carregar despesas (ainda no localStorage - será migrado depois)
    // Filtrar profissionalId: esses são cópias de pagamentos já contados abaixo
    const despesas = getDespesasByObra(obraId)
    const totalDespesas = despesas
      .filter(d => !d.profissionalId && !(d as any).professionalId)
      .reduce((acc, d) => acc + (d.valor ?? 0), 0)

    // Carregar pagamentos do Supabase (pagamentos a profissionais)
    let totalPagamentos = 0
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: pagamentosData } = await supabase
          .from("pagamentos")
          .select("valor")
          .eq("obra_id", obraId)
          .eq("user_id", user.id)

        if (pagamentosData && pagamentosData.length > 0) {
          totalPagamentos = pagamentosData.reduce((acc: number, p: any) => acc + (parseFloat(p.valor) || 0), 0)
        }
      }
    } catch (pagError) {
      console.error("Erro ao carregar pagamentos:", pagError)
    }

    const totalGasto = totalDespesas + totalPagamentos

    const orcamentoEstimado = obra.orcamento || 0
    const saldoDisponivel = orcamentoEstimado - totalGasto
    const areaM2 = obra.area || 0
    const custoPorM2 = areaM2 > 0 ? totalGasto / areaM2 : 0

    return {
      orcamentoEstimado,
      totalGasto,
      saldoDisponivel,
      custoPorM2,
      areaM2
    }
  } catch (error) {
    console.error("Erro ao calcular métricas do Supabase:", error)
    return {
      orcamentoEstimado: 0,
      totalGasto: 0,
      saldoDisponivel: 0,
      custoPorM2: 0,
      areaM2: 0
    }
  }
}

/**
 * Obter o perfil do usuário atual
 * @returns UserProfile ou null se não estiver definido
 */
export function getUserProfile(): UserProfile {
  try {
    const userData = localStorage.getItem("user")
    if (!userData) return null

    const user: User = JSON.parse(userData)
    return user.profile || null
  } catch (error) {
    console.error("Erro ao obter perfil do usuário:", error)
    return null
  }
}

/**
 * Definir o perfil do usuário atual
 * @param profile - Perfil a ser definido ("owner" ou "builder")
 * @returns true se salvou com sucesso, false caso contrário
 */
export async function setUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    console.log('💾 setUserProfile - Iniciando com profile:', profile)

    const userData = localStorage.getItem("user")
    if (!userData) {
      console.error('❌ setUserProfile - userData não encontrado no localStorage')
      return false
    }

    const user: User = JSON.parse(userData)
    user.profile = profile

    // Salvar no localStorage
    localStorage.setItem("user", JSON.stringify(user))
    console.log('✅ setUserProfile - Salvo no localStorage:', user)

    // Salvar no Supabase
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user: authUser } } = await supabase.auth.getUser()

      console.log('🔍 setUserProfile - authUser ID:', authUser?.id)

      if (authUser) {
        // Tentar atualizar primeiro; se não existir registro, fazer upsert
        const { data: updateData, error: updateError } = await supabase
          .from('user_profiles')
          .update({ profile_type: profile })
          .eq('id', authUser.id)
          .select()

        if (updateError) {
          console.error('❌ setUserProfile - Erro ao atualizar no Supabase:', updateError)
        } else if (!updateData || updateData.length === 0) {
          // Registro não existe, criar novo
          console.log('⚠️ setUserProfile - Nenhum registro atualizado, criando novo...')
          const userData = localStorage.getItem("user")
          const user = userData ? JSON.parse(userData) : {}
          const { data: insertData, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: authUser.id,
              first_name: user.firstName || authUser.email?.split('@')[0] || '',
              last_name: user.lastName || '',
              phone: user.phone || '',
              profile_type: profile
            } as any)
            .select()

          if (insertError) {
            console.error('❌ setUserProfile - Erro ao inserir no Supabase:', insertError)
          } else {
            console.log('✅ setUserProfile - Novo registro criado no Supabase:', insertData)
          }
        } else {
          console.log('✅ setUserProfile - Salvo no Supabase:', updateData)
        }
      } else {
        console.error('❌ setUserProfile - authUser não encontrado')
      }
    } catch (supabaseError) {
      console.error("❌ setUserProfile - Erro ao salvar perfil no Supabase:", supabaseError)
      // Continua mesmo se falhar no Supabase, pois já salvou no localStorage
    }

    return true
  } catch (error) {
    console.error("❌ setUserProfile - Erro ao definir perfil do usuário:", error)
    return false
  }
}

/**
 * Verificar se o usuário já definiu um perfil
 * @returns true se o perfil já foi definido, false caso contrário
 */
export function hasUserProfile(): boolean {
  const profile = getUserProfile()
  return profile !== null
}

/**
 * Verificar se deve mostrar a tela de seleção de perfil
 * Regra: Só mostra se o usuário NÃO tem perfil definido E NÃO tem obras cadastradas
 * @returns true se deve mostrar, false caso contrário
 */
export function shouldShowProfileSelection(): boolean {
  // Se já tem perfil definido, não mostrar
  const profile = getUserProfile()
  if (profile !== null) {
    return false
  }

  // Se não tem perfil, verificar se tem obras
  const obras = getObrasDoUsuario()

  // Só mostra se não tem perfil E não tem obras
  return obras.length === 0
}

/**
 * Obter todos os recebimentos de uma obra (para construtores)
 * @param obraId - ID da obra
 * @returns Array de recebimentos da obra
 */
export function getRecebimentosByObra(obraId: string): Recebimento[] {
  try {
    const todosRecebimentos = JSON.parse(localStorage.getItem("recebimentos") || "[]") as Recebimento[]
    return todosRecebimentos.filter(r => r.obraId === obraId)
  } catch (error) {
    console.error("Erro ao carregar recebimentos:", error)
    return []
  }
}

/**
 * Salvar um recebimento
 * @param recebimento - Recebimento a ser salvo
 * @returns true se salvou com sucesso, false caso contrário
 */
export function saveRecebimento(recebimento: Recebimento): boolean {
  try {
    const todosRecebimentos = JSON.parse(localStorage.getItem("recebimentos") || "[]") as Recebimento[]
    todosRecebimentos.push(recebimento)
    localStorage.setItem("recebimentos", JSON.stringify(todosRecebimentos))
    return true
  } catch (error) {
    console.error("Erro ao salvar recebimento:", error)
    return false
  }
}

/**
 * Calcular total recebido de uma obra
 * @param obraId - ID da obra
 * @returns Valor total recebido
 */
export function calcularTotalRecebido(obraId: string): number {
  const recebimentos = getRecebimentosByObra(obraId)
  return recebimentos.reduce((acc, r) => acc + (r.valor ?? 0), 0)
}

/**
 * Excluir uma obra e TODOS os dados vinculados (CASCADE)
 * Remove: despesas, profissionais, contratos, pagamentos, alertas, notificações, recebimentos
 * @param obraId - ID da obra a ser excluída
 * @returns true se excluiu com sucesso, false caso contrário
 */
export function deleteObraCascade(obraId: string): boolean {
  try {
    if (!obraId) {
      return false
    }

    // 1. Remover a obra
    const todasObras = JSON.parse(localStorage.getItem("obras") || "[]") as Obra[]
    const obrasAtualizadas = todasObras.filter(o => o.id !== obraId)
    localStorage.setItem("obras", JSON.stringify(obrasAtualizadas))

    // 2. Remover todas as despesas da obra
    const todasDespesas = JSON.parse(localStorage.getItem("despesas") || "[]") as Despesa[]
    const despesasAtualizadas = todasDespesas.filter(d => d.obraId !== obraId)
    localStorage.setItem("despesas", JSON.stringify(despesasAtualizadas))

    // 3. Remover todos os profissionais da obra
    const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]") as Profissional[]
    const profissionaisAtualizados = todosProfissionais.filter(p => p.obraId !== obraId)
    localStorage.setItem("profissionais", JSON.stringify(profissionaisAtualizados))

    // 4. Remover contratos/combined da obra
    const todosCombined = JSON.parse(localStorage.getItem("combined") || "[]")
    const combinedAtualizados = todosCombined.filter((c: any) => c.obraId !== obraId)
    localStorage.setItem("combined", JSON.stringify(combinedAtualizados))

    // 5. Remover alertas da obra
    const todosAlertas = JSON.parse(localStorage.getItem("alertas") || "[]")
    const alertasAtualizados = todosAlertas.filter((a: any) => a.obraId !== obraId)
    localStorage.setItem("alertas", JSON.stringify(alertasAtualizados))

    // 6. Remover notificações da obra
    const todasNotificacoes = JSON.parse(localStorage.getItem("notificacoes") || "[]")
    const notificacoesAtualizadas = todasNotificacoes.filter((n: any) => n.obraId !== obraId)
    localStorage.setItem("notificacoes", JSON.stringify(notificacoesAtualizadas))

    // 7. Remover recebimentos da obra
    const todosRecebimentos = JSON.parse(localStorage.getItem("recebimentos") || "[]")
    const recebimentosAtualizados = todosRecebimentos.filter((r: any) => r.obraId !== obraId)
    localStorage.setItem("recebimentos", JSON.stringify(recebimentosAtualizados))

    // 8. Limpar obra ativa se for a que está sendo excluída
    const activeObraId = getActiveObraId()
    if (activeObraId === obraId) {
      localStorage.removeItem("activeObraId")
    }

    return true
  } catch (error) {
    console.error("Erro ao excluir obra em cascata:", error)
    return false
  }
}

// ============================================
// FUNÇÕES DE PERSISTÊNCIA NO SUPABASE
// ============================================

/**
 * Salvar profissional no Supabase
 * @param profissional - Profissional a ser salvo
 * @param userId - ID do usuário autenticado
 * @returns Promise com o ID do profissional salvo ou null em caso de erro
 */
export async function saveProfissionalSupabase(profissional: any, userId: string): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase")

    // Validar UUIDs obrigatórios antes de salvar
    try {
      validateUUID(userId, "userId")
      validateUUID(profissional.obraId, "obra_id")
    } catch (error) {
      console.error("Erro de validação ao salvar profissional:", error)
      return null
    }

    // NUNCA enviar id - Supabase gera automaticamente com gen_random_uuid()
    const profissionalData = {
      user_id: userId,
      obra_id: profissional.obraId,
      nome: profissional.nome,
      funcao: profissional.funcao,
      telefone: profissional.telefone || null,
      email: profissional.email || null,
      cpf: profissional.cpf || null,
      observacoes: profissional.observacoes || null
    }

    console.log("Salvando profissional no Supabase (sem ID):", profissionalData)

    const { data, error } = await supabase
      .from("profissionais")
      .insert(profissionalData as any)
      .select()
      .single()

    if (error) {
      console.error("Erro detalhado ao salvar profissional:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    const savedId = (data as any)?.id || null
    console.log("Profissional salvo com UUID gerado pelo banco:", savedId)
    return savedId
  } catch (error) {
    console.error("Erro ao salvar profissional:", error)
    return null
  }
}

/**
 * Carregar profissionais de uma obra do Supabase
 * @param obraId - ID da obra
 * @param userId - ID do usuário autenticado
 * @returns Promise com array de profissionais
 */
export async function getProfissionaisSupabase(obraId: string, userId: string): Promise<any[]> {
  try {
    const { supabase } = await import("@/lib/supabase")

    console.log("[GET_PROFISSIONAIS] Carregando profissionais. obra_id:", obraId, "user_id:", userId)

    const { data, error } = await supabase
      .from("profissionais")
      .select("*")
      .eq("obra_id", obraId)
      .eq("user_id", userId)
      .order("criada_em", { ascending: false })

    if (error) {
      console.error("[GET_PROFISSIONAIS] Erro ao carregar profissionais do Supabase:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log("[GET_PROFISSIONAIS] Profissionais retornados do banco:", data?.length || 0)

    // Converter snake_case para camelCase
    const profissionais = (data || []).map((p: any) => ({
      id: p.id,
      obraId: p.obra_id,
      nome: p.nome,
      funcao: p.funcao,
      telefone: p.telefone,
      email: p.email,
      cpf: p.cpf,
      observacoes: p.observacoes,
      valorPrevisto: p.valor_previsto ? parseFloat(p.valor_previsto) : 0,
      contrato: p.contrato || undefined, // JSONB do contrato
      criadoEm: p.criada_em,
      atualizadoEm: p.atualizada_em
    }))

    console.log("[GET_PROFISSIONAIS] Profissionais convertidos:", profissionais.map(p => ({
      id: p.id,
      nome: p.nome,
      temContrato: !!p.contrato,
      valorPrevisto: p.valorPrevisto
    })))

    return profissionais
  } catch (error) {
    console.error("[GET_PROFISSIONAIS] Erro ao carregar profissionais:", error)
    return []
  }
}

/**
 * Salvar despesa no Supabase
 * @param despesa - Despesa a ser salva
 * @param userId - ID do usuário autenticado
 * @returns Promise com objeto contendo id e error
 */
export async function saveDespesaSupabase(despesa: any, userId: string): Promise<{ id: string | null; error: string | null }> {
  try {
    const { supabase } = await import("@/lib/supabase")

    // Validar campos obrigatórios
    if (!despesa.obraId) {
      console.error("Validação falhou: obra_id é obrigatório")
      return { id: null, error: "ID da obra é obrigatório" }
    }

    if (!despesa.valor || despesa.valor <= 0) {
      console.error("Validação falhou: valor inválido", despesa.valor)
      return { id: null, error: "Valor deve ser maior que zero" }
    }

    if (!despesa.categoria && !despesa.category) {
      console.error("Validação falhou: categoria é obrigatória")
      return { id: null, error: "Categoria é obrigatória" }
    }

    // Validar que categoria é uma string válida
    const categoriaValor = despesa.categoria || despesa.category
    const categoriasValidas = [
      "material", "mao_obra", "ferramentas", "licencas", "transporte",
      "alimentacao", "limpeza", "seguranca", "energia_agua", "aluguel",
      "projetos", "outros"
    ]
    if (!categoriaValor || !categoriasValidas.includes(categoriaValor)) {
      console.error("Validação falhou: categoria inválida", categoriaValor)
      return { id: null, error: `Categoria inválida: ${categoriaValor}` }
    }

    if (!despesa.data) {
      console.error("Validação falhou: data é obrigatória")
      return { id: null, error: "Data é obrigatória" }
    }

    // Validar UUIDs obrigatórios antes de salvar
    try {
      validateUUID(userId, "userId")
      validateUUID(despesa.obraId, "obra_id")

      // profissional_id é opcional, mas se fornecido deve ser UUID válido
      const profId = despesa.profissionalId || despesa.professionalId
      if (profId && !isValidUUID(profId)) {
        throw new Error(`profissional_id inválido: "${profId}"`)
      }
    } catch (error) {
      console.error("Erro de validação ao salvar despesa:", error)
      return { id: null, error: error instanceof Error ? error.message : "UUID inválido" }
    }

    // NUNCA enviar id - Supabase gera automaticamente com gen_random_uuid()
    const despesaData = {
      user_id: userId,
      obra_id: despesa.obraId,
      descricao: despesa.descricao?.trim() || "",
      valor: despesa.valor,
      categoria: despesa.categoria || despesa.category,
      data: despesa.data,
      forma_pagamento: despesa.formaPagamento || null,
      fornecedor: despesa.fornecedor || null,
      profissional_id: despesa.profissionalId || despesa.professionalId || null,
      observacao: despesa.observacao || despesa.observacoes || null,
      anexo: despesa.anexo || null
    }

    console.log("Salvando despesa no Supabase (sem ID):", {
      ...despesaData,
      valor: `R$ ${despesaData.valor}`
    })

    const { data, error } = await supabase
      .from("despesas")
      .insert(despesaData as any)
      .select()
      .single()

    if (error) {
      console.error("Erro detalhado do Supabase ao salvar despesa:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return {
        id: null,
        error: `Erro do banco: ${error.message}${error.hint ? ` (${error.hint})` : ''}`
      }
    }

    const savedId = (data as any)?.id || null
    console.log("Despesa salva com UUID gerado pelo banco:", savedId)
    return { id: savedId, error: null }
  } catch (error) {
    console.error("Erro inesperado ao salvar despesa:", error)
    return {
      id: null,
      error: error instanceof Error ? error.message : "Erro desconhecido ao salvar despesa"
    }
  }
}

/**
 * Atualizar uma despesa existente no Supabase
 * @param despesaId - ID da despesa a ser atualizada
 * @param despesa - Objeto com dados da despesa
 * @param userId - ID do usuário autenticado
 * @returns Promise com sucesso ou erro
 */
export async function updateDespesaSupabase(
  despesaId: string,
  despesa: any,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { supabase } = await import("@/lib/supabase")

    // Preparar dados para atualização
    const despesaData = {
      descricao: despesa.descricao?.trim(),
      valor: despesa.valor,
      categoria: despesa.categoria || despesa.category || despesa.tipo,
      data: despesa.data,
      forma_pagamento: despesa.formaPagamento || null,
      fornecedor: despesa.fornecedor || null,
      profissional_id: despesa.profissionalId || despesa.professionalId || null,
      observacao: despesa.observacao || despesa.observacoes || null,
      anexo: despesa.anexo || null,
      atualizada_em: new Date().toISOString()
    }

    console.log("Atualizando despesa no Supabase:", {
      id: despesaId,
      ...despesaData,
      valor: `R$ ${despesaData.valor}`
    })

    const { error } = await supabase
      .from("despesas")
      .update(despesaData as any)
      .eq("id", despesaId)
      .eq("user_id", userId)

    if (error) {
      console.error("Erro detalhado do Supabase ao atualizar despesa:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return {
        success: false,
        error: `Erro do banco: ${error.message}${error.hint ? ` (${error.hint})` : ''}`
      }
    }

    console.log("Despesa atualizada com sucesso:", despesaId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Erro inesperado ao atualizar despesa:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao atualizar despesa"
    }
  }
}

/**
 * Carregar despesas de uma obra do Supabase
 * @param obraId - ID da obra
 * @param userId - ID do usuário autenticado
 * @returns Promise com array de despesas
 */
export async function getDespesasSupabase(obraId: string, userId: string): Promise<any[]> {
  try {
    const { supabase } = await import("@/lib/supabase")

    const { data, error } = await supabase
      .from("despesas")
      .select("*")
      .eq("obra_id", obraId)
      .eq("user_id", userId)
      .order("data", { ascending: false })

    if (error) {
      console.error("Erro ao carregar despesas do Supabase:", error)
      return []
    }

    // Converter snake_case para camelCase
    return (data || []).map((d: any) => ({
      id: d.id,
      obraId: d.obra_id,
      descricao: d.descricao,
      valor: parseFloat(d.valor),
      categoria: d.categoria,
      category: d.categoria,
      tipo: d.categoria, // tipo é o mesmo que categoria
      data: d.data,
      formaPagamento: d.forma_pagamento,
      fornecedor: d.fornecedor,
      profissionalId: d.profissional_id,
      professionalId: d.profissional_id,
      observacao: d.observacao,
      observacoes: d.observacao,
      anexo: d.anexo,
      comprovanteAnexo: d.anexo, // Compatibilidade com nome alternativo
      criadaEm: d.criada_em,
      criadoEm: d.criada_em,
      atualizadaEm: d.atualizada_em,
      atualizadoEm: d.atualizada_em
    }))
  } catch (error) {
    console.error("Erro ao carregar despesas:", error)
    return []
  }
}

/**
 * Fazer upload de arquivo no Supabase Storage
 * @param file - Arquivo a ser enviado
 * @param bucket - Nome do bucket
 * @param path - Caminho do arquivo dentro do bucket
 * @returns Promise com a URL pública ou null em caso de erro
 */
export async function uploadFileToStorage(
  file: File,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase")

    console.log(`[UPLOAD] Iniciando upload para ${bucket}/${path}`)
    console.log(`[UPLOAD] Arquivo: ${file.name}, Tipo: ${file.type}, Tamanho: ${file.size} bytes`)

    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Substituir se já existir
      })

    if (error) {
      console.error("[UPLOAD] Erro detalhado ao fazer upload:", {
        message: error.message,
        statusCode: (error as any).statusCode,
        error: error
      })
      return null
    }

    console.log("[UPLOAD] Upload concluído com sucesso:", data)

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    const publicUrl = publicUrlData.publicUrl
    console.log("[UPLOAD] URL pública gerada:", publicUrl)

    return publicUrl
  } catch (error) {
    console.error("[UPLOAD] Erro inesperado ao fazer upload:", error)
    return null
  }
}

/**
 * Salvar pagamento no Supabase
 * @param pagamento - Pagamento a ser salvo
 * @param userId - ID do usuário autenticado
 * @returns Promise com o ID do pagamento salvo ou null em caso de erro
 */
export async function savePagamentoSupabase(pagamento: any, userId: string): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase")

    // Validar UUIDs obrigatórios antes de salvar
    try {
      validateUUID(userId, "userId")
      validateUUID(pagamento.obraId, "obra_id")
      validateUUID(pagamento.profissionalId, "profissional_id")
    } catch (error) {
      console.error("Erro de validação ao salvar pagamento:", error)
      return null
    }

    // VALIDAÇÃO DEFENSIVA: comprovante_url deve ser string ou null
    if (pagamento.comprovanteUrl !== undefined && pagamento.comprovanteUrl !== null) {
      if (typeof pagamento.comprovanteUrl !== 'string') {
        console.error("[VALIDAÇÃO] comprovanteUrl não é uma string válida:", {
          type: typeof pagamento.comprovanteUrl,
          value: pagamento.comprovanteUrl
        })
        throw new Error("comprovanteUrl deve ser uma string (URL) ou null")
      }
    }

    // NUNCA enviar id - Supabase gera automaticamente com gen_random_uuid()
    const pagamentoData = {
      user_id: userId,
      obra_id: pagamento.obraId,
      profissional_id: pagamento.profissionalId,
      valor: pagamento.valor,
      data: pagamento.data,
      forma_pagamento: pagamento.formaPagamento,
      observacao: pagamento.observacao || null,
      comprovante_url: pagamento.comprovanteUrl || null
    }

    console.log("[PAGAMENTO] Payload final enviado ao Supabase:", {
      ...pagamentoData,
      comprovante_url: pagamentoData.comprovante_url ? "URL definida" : null
    })

    const { data, error } = await supabase
      .from("pagamentos")
      .insert(pagamentoData as any)
      .select()
      .single()

    if (error) {
      console.error("[PAGAMENTO] Erro detalhado ao salvar pagamento:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    const savedId = (data as any)?.id || null
    console.log("[PAGAMENTO] Pagamento salvo com UUID gerado pelo banco:", savedId)
    return savedId
  } catch (error) {
    console.error("[PAGAMENTO] Erro ao salvar pagamento:", error)
    return null
  }
}

/**
 * Carregar pagamentos de um profissional do Supabase
 * @param obraId - ID da obra
 * @param profissionalId - ID do profissional
 * @param userId - ID do usuário autenticado
 * @returns Promise com array de pagamentos
 */
export async function getPagamentosSupabase(obraId: string, profissionalId: string, userId: string): Promise<any[]> {
  try {
    const { supabase } = await import("@/lib/supabase")

    const { data, error } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("obra_id", obraId)
      .eq("profissional_id", profissionalId)
      .eq("user_id", userId)
      .order("data", { ascending: false })

    if (error) {
      console.error("Erro ao carregar pagamentos do Supabase:", error)
      return []
    }

    // Converter snake_case para camelCase
    return (data || []).map((p: any) => ({
      id: p.id,
      obraId: p.obra_id,
      profissionalId: p.profissional_id,
      valor: parseFloat(p.valor),
      data: p.data,
      formaPagamento: p.forma_pagamento,
      observacao: p.observacao,
      criadoEm: p.criado_em,
      atualizadoEm: p.atualizado_em
    }))
  } catch (error) {
    console.error("Erro ao carregar pagamentos:", error)
    return []
  }
}

/**
 * Salvar recebimento no Supabase
 * @param recebimento - Recebimento a ser salvo
 * @param userId - ID do usuário autenticado
 * @returns Promise com o ID do recebimento salvo ou null em caso de erro
 */
export async function saveRecebimentoSupabase(recebimento: any, userId: string): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase")

    // Validar UUIDs obrigatórios antes de salvar
    try {
      validateUUID(userId, "userId")
      validateUUID(recebimento.obraId, "obra_id")
    } catch (error) {
      console.error("Erro de validação ao salvar recebimento:", error)
      return null
    }

    // NUNCA enviar id - Supabase gera automaticamente com gen_random_uuid()
    const recebimentoData: any = {
      user_id: userId,
      obra_id: recebimento.obraId,
      valor: recebimento.valor,
      data: recebimento.data,
      forma_pagamento: recebimento.formaPagamento || null,
      observacao: recebimento.observacao || null,
      comprovante_url: recebimento.comprovanteUrl || null
    }

    // Incluir cliente_id se informado
    if (recebimento.clienteId) {
      recebimentoData.cliente_id = recebimento.clienteId
    }

    console.log("Salvando recebimento no Supabase (sem ID):", recebimentoData)

    const { data, error } = await supabase
      .from("recebimentos")
      .insert(recebimentoData as any)
      .select()
      .single()

    if (error) {
      console.error("Erro detalhado ao salvar recebimento:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    const savedId = (data as any)?.id || null
    console.log("Recebimento salvo com UUID gerado pelo banco:", savedId)
    return savedId
  } catch (error) {
    console.error("Erro ao salvar recebimento:", error)
    return null
  }
}

/**
 * Carregar recebimentos de uma obra do Supabase
 * @param obraId - ID da obra
 * @param userId - ID do usuário autenticado
 * @returns Promise com array de recebimentos
 */
export async function getRecebimentosSupabase(obraId: string, userId: string): Promise<any[]> {
  try {
    const { supabase } = await import("@/lib/supabase")

    const { data, error } = await supabase
      .from("recebimentos")
      .select("*")
      .eq("obra_id", obraId)
      .eq("user_id", userId)
      .order("data", { ascending: false })

    if (error) {
      console.error("Erro ao carregar recebimentos do Supabase:", error)
      return []
    }

    // Converter snake_case para camelCase
    return (data || []).map((r: any) => ({
      id: r.id,
      obraId: r.obra_id,
      valor: parseFloat(r.valor),
      data: r.data,
      formaPagamento: r.forma_pagamento,
      observacao: r.observacao,
      comprovanteUrl: r.comprovante_url || null,
      criadoEm: r.criado_em
    }))
  } catch (error) {
    console.error("Erro ao carregar recebimentos:", error)
    return []
  }
}

/**
 * Excluir profissional do Supabase e localStorage
 * @param profissionalId - ID do profissional a ser excluído
 * @returns true se excluiu com sucesso, false caso contrário
 */
export async function deleteProfissionalSupabase(profissionalId: string): Promise<boolean> {
  try {
    if (!profissionalId) {
      return false
    }

    // Validar UUID antes de deletar
    try {
      validateUUID(profissionalId, "profissionalId")
    } catch (error) {
      console.error("Erro de validação ao deletar profissional:", error)
      return false
    }

    // Excluir do Supabase
    const { supabase } = await import("@/lib/supabase")
    const { error } = await supabase
      .from("profissionais")
      .delete()
      .eq("id", profissionalId)

    if (error) {
      console.error("Erro ao excluir profissional do Supabase:", error)
      return false
    }

    // Excluir do localStorage
    const todosProfissionais = JSON.parse(localStorage.getItem("profissionais") || "[]")
    const novosProfissionais = todosProfissionais.filter((p: any) => p.id !== profissionalId)
    localStorage.setItem("profissionais", JSON.stringify(novosProfissionais))

    return true
  } catch (error) {
    console.error("Erro ao excluir profissional:", error)
    return false
  }
}

/**
 * Carregar todos os dados de uma obra do Supabase (profissionais, despesas, pagamentos, recebimentos)
 * @param obraId - ID da obra
 * @param userId - ID do usuário autenticado
 * @returns Promise com objeto contendo todos os dados
 */
export async function carregarDadosObraSupabase(obraId: string, userId: string): Promise<{
  profissionais: any[]
  despesas: any[]
  pagamentos: any[]
  recebimentos: any[]
}> {
  try {
    // Carregar todos os dados em paralelo
    const [profissionais, despesas, recebimentos] = await Promise.all([
      getProfissionaisSupabase(obraId, userId),
      getDespesasSupabase(obraId, userId),
      getRecebimentosSupabase(obraId, userId)
    ])

    // Pagamentos são extraídos das despesas (mão de obra)
    const pagamentos = despesas.filter(d =>
      d.categoria === "mao_obra" && d.profissionalId
    )

    // Sincronizar com localStorage para compatibilidade
    if (profissionais.length > 0) {
      localStorage.setItem("profissionais", JSON.stringify(profissionais))
    }
    if (despesas.length > 0) {
      localStorage.setItem("despesas", JSON.stringify(despesas))
    }
    if (recebimentos.length > 0) {
      localStorage.setItem("recebimentos", JSON.stringify(recebimentos))
    }

    return {
      profissionais,
      despesas,
      pagamentos,
      recebimentos
    }
  } catch (error) {
    console.error("Erro ao carregar dados da obra:", error)
    return {
      profissionais: [],
      despesas: [],
      pagamentos: [],
      recebimentos: []
    }
  }
}

/**
 * Atualizar recebimento no Supabase
 */
export async function updateRecebimentoSupabase(recebimentoId: string, recebimento: any): Promise<boolean> {
  try {
    const { supabase } = await import("@/lib/supabase")

    validateUUID(recebimentoId, "recebimento_id")

    const updatePayload: any = {
      valor: recebimento.valor,
      data: recebimento.data,
      forma_pagamento: recebimento.formaPagamento || null,
      observacao: recebimento.observacao || null,
    }

    if (recebimento.comprovanteUrl !== undefined) {
      updatePayload.comprovante_url = recebimento.comprovanteUrl || null
    }

    const { error } = await supabase
      .from("recebimentos")
      .update(updatePayload)
      .eq("id", recebimentoId)

    if (error) {
      console.error("Erro ao atualizar recebimento no Supabase:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao atualizar recebimento:", error)
    return false
  }
}

/**
 * Excluir recebimento do Supabase
 */
export async function deleteRecebimentoSupabase(recebimentoId: string): Promise<boolean> {
  try {
    const { supabase } = await import("@/lib/supabase")

    validateUUID(recebimentoId, "recebimento_id")

    const { error } = await supabase
      .from("recebimentos")
      .delete()
      .eq("id", recebimentoId)

    if (error) {
      console.error("Erro ao excluir recebimento do Supabase:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao excluir recebimento:", error)
    return false
  }
}

// ============================================================
// CLIENTES
// ============================================================

export interface Cliente {
  id: string
  obraId: string
  userId: string
  nome: string
  contratoValor?: number | null
  contratoUrl?: string | null
  observacoes?: string | null
  criadaEm?: string
}

export async function saveClienteSupabase(
  cliente: { obraId: string; nome: string; contratoValor?: number | null; contratoUrl?: string | null; observacoes?: string | null },
  userId: string
): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase")
    validateUUID(userId, "userId")
    validateUUID(cliente.obraId, "obra_id")

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        user_id: userId,
        obra_id: cliente.obraId,
        nome: cliente.nome,
        contrato_valor: cliente.contratoValor ?? null,
        contrato_url: cliente.contratoUrl ?? null,
        observacoes: cliente.observacoes ?? null
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao salvar cliente:", error)
      return null
    }

    return (data as any)?.id ?? null
  } catch (error) {
    console.error("Erro ao salvar cliente:", error)
    return null
  }
}

export async function getClientesSupabase(obraId: string, userId: string): Promise<Cliente[]> {
  try {
    const { supabase } = await import("@/lib/supabase")

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("obra_id", obraId)
      .eq("user_id", userId)
      .order("criada_em", { ascending: true })

    if (error) {
      console.error("Erro ao carregar clientes:", error)
      return []
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      obraId: c.obra_id,
      userId: c.user_id,
      nome: c.nome,
      contratoValor: c.contrato_valor ? parseFloat(c.contrato_valor) : null,
      contratoUrl: c.contrato_url || null,
      observacoes: c.observacoes,
      criadaEm: c.criada_em
    }))
  } catch (error) {
    console.error("Erro ao carregar clientes:", error)
    return []
  }
}

export async function updateClienteSupabase(
  clienteId: string,
  data: { nome?: string; contratoValor?: number | null; contratoUrl?: string | null; observacoes?: string | null }
): Promise<boolean> {
  try {
    const { supabase } = await import("@/lib/supabase")
    validateUUID(clienteId, "cliente_id")

    const payload: any = {}
    if (data.nome !== undefined) payload.nome = data.nome
    if (data.contratoValor !== undefined) payload.contrato_valor = data.contratoValor
    if (data.contratoUrl !== undefined) payload.contrato_url = data.contratoUrl
    if (data.observacoes !== undefined) payload.observacoes = data.observacoes

    const { error } = await supabase
      .from("clientes")
      .update(payload)
      .eq("id", clienteId)

    if (error) {
      console.error("Erro ao atualizar cliente:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
    return false
  }
}

export async function deleteClienteSupabase(clienteId: string): Promise<boolean> {
  try {
    const { supabase } = await import("@/lib/supabase")
    validateUUID(clienteId, "cliente_id")

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", clienteId)

    if (error) {
      console.error("Erro ao excluir cliente:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao excluir cliente:", error)
    return false
  }
}

export async function getRecebimentosByClienteSupabase(clienteId: string, userId: string): Promise<any[]> {
  try {
    const { supabase } = await import("@/lib/supabase")

    const { data, error } = await supabase
      .from("recebimentos")
      .select("*")
      .eq("cliente_id", clienteId)
      .eq("user_id", userId)
      .order("data", { ascending: false })

    if (error) {
      console.error("Erro ao carregar recebimentos do cliente:", error)
      return []
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      obraId: r.obra_id,
      clienteId: r.cliente_id,
      valor: parseFloat(r.valor) || 0,
      data: r.data,
      formaPagamento: r.forma_pagamento,
      observacao: r.observacao,
      comprovanteUrl: r.comprovante_url,
      criadoEm: r.criado_em
    }))
  } catch (error) {
    console.error("Erro ao carregar recebimentos do cliente:", error)
    return []
  }
}
