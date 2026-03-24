export type PlanoTipo = "essencial" | "profissional" | "trial"

export const PLANOS = {
  essencial: {
    nome: "Essencial",
    preco: 29,
    limiteObras: 1,
    descricao: "Perfeito para uma obra",
  },
  profissional: {
    nome: "Profissional",
    preco: 49,
    limiteObras: Infinity,
    descricao: "Para múltiplas obras",
  },
} as const

/** Lê o plano atual do usuário (localStorage).
 *  Construtoras (builder) são sempre Profissional por padrão. */
export function getPlanoAtual(): PlanoTipo {
  if (typeof window === "undefined") return "essencial"
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (user.profile === "builder") return "profissional"
  } catch {}
  return (localStorage.getItem("userPlan") as PlanoTipo) || "essencial"
}

/** Salva o plano do usuário */
export function setPlanoAtual(plano: PlanoTipo) {
  localStorage.setItem("userPlan", plano)
}

/**
 * Lê o plano do usuário diretamente do Supabase (fonte autoritativa).
 * Retorna "profissional" para trial ativo, "essencial" se expirado.
 * Usar em contextos assíncronos (page load, hooks).
 */
export async function getPlanoAtualDB(userId: string): Promise<PlanoTipo> {
  try {
    const { supabase } = await import("@/lib/supabase")

    const [{ data }, { data: { user: authUser } }] = await Promise.all([
      supabase.from("user_profiles").select("plano, plano_expira_em, profile_type").eq("id", userId).single(),
      supabase.auth.getUser(),
    ])

    if (!data) return getPlanoAtual()

    // Builder sempre tem plano profissional
    if (data.profile_type === "builder") return "profissional"

    // Verificar se há trial ativo em admin_trials pelo email do auth
    if (authUser?.email) {
      const { data: trialData } = await supabase
        .from("admin_trials")
        .select("expires_at")
        .eq("email", authUser.email.toLowerCase())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (trialData) {
        const trialAtivo = !trialData.expires_at || new Date(trialData.expires_at) > new Date()
        if (trialAtivo) {
          setPlanoAtual("profissional")
          return "profissional"
        }
      }
    }

    // Trial expirado → essencial
    if (data.plano === "profissional" && data.plano_expira_em) {
      if (new Date(data.plano_expira_em) < new Date()) {
        await supabase.from("user_profiles").update({ plano: "essencial", plano_expira_em: null }).eq("id", userId)
        setPlanoAtual("essencial")
        return "essencial"
      }
    }

    const plano = (data.plano as PlanoTipo) || "essencial"
    setPlanoAtual(plano === "trial" ? "profissional" : plano)
    return plano === "trial" ? "profissional" : plano
  } catch {
    return getPlanoAtual()
  }
}

/** Retorna true se o plano tem data de expiração e ainda está ativo */
export function isTrialAtivo(planoExpiraEm: string | null): boolean {
  if (!planoExpiraEm) return false
  return new Date(planoExpiraEm) > new Date()
}

export type TrialStatus = "ok" | "warning2" | "warning1" | "expired" | "none"

/**
 * Retorna o status do trial com base em trialExpiraEm (localStorage ou param).
 * "none"     → usuário não tem trial (assinante ou sem data)
 * "ok"       → trial ativo, mais de 2 dias restantes
 * "warning2" → restam exatamente 2 dias (5º dia de uso)
 * "warning1" → resta 1 dia (6º dia de uso)
 * "expired"  → trial encerrado
 */
export function getTrialStatus(trialExpiraEm?: string | null): TrialStatus {
  const expira = trialExpiraEm ?? (typeof window !== "undefined" ? localStorage.getItem("trialExpiraEm") : null)
  if (!expira) return "none"

  const agora = new Date()
  const fim = new Date(expira)
  const msRestantes = fim.getTime() - agora.getTime()
  const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24))

  if (diasRestantes <= 0) return "expired"
  if (diasRestantes === 1) return "warning1"
  if (diasRestantes === 2) return "warning2"
  return "ok"
}

/** Retorna quantos dias inteiros restam no trial (0 se expirado) */
export function getTrialDiasRestantes(trialExpiraEm?: string | null): number {
  const expira = trialExpiraEm ?? (typeof window !== "undefined" ? localStorage.getItem("trialExpiraEm") : null)
  if (!expira) return 0
  const ms = new Date(expira).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

/** Retorna true se o usuário pode criar mais obras */
export function podecriarObra(totalObrasAtuais: number): boolean {
  const plano = getPlanoAtual()
  return totalObrasAtuais < PLANOS[plano].limiteObras
}

/**
 * Calcula a diferença proporcional para upgrade no meio do ciclo.
 * Assume ciclo mensal de 30 dias a partir do dia de contratação.
 */
export function calcularProrrataUpgrade(diaContratacao: number): {
  diasRestantes: number
  valorProporcional: number
  totalAPagar: number
} {
  const hoje = new Date()
  const diaHoje = hoje.getDate()
  const diasNoMes = 30

  let diasRestantes: number
  if (diaHoje <= diaContratacao) {
    diasRestantes = diaContratacao - diaHoje
  } else {
    diasRestantes = diasNoMes - diaHoje + diaContratacao
  }

  const diffPreco = PLANOS.profissional.preco - PLANOS.essencial.preco
  const valorProporcional = parseFloat(((diffPreco / diasNoMes) * diasRestantes).toFixed(2))
  const totalAPagar = parseFloat((PLANOS.profissional.preco - valorProporcional).toFixed(2))

  return { diasRestantes, valorProporcional, totalAPagar }
}
