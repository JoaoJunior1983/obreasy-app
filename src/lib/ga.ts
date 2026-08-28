/**
 * Ponte entre os eventos internos (tabela `user_events`) e o Google Analytics 4.
 *
 * O funil já era registrado no Supabase antes do GA existir. Em vez de sair
 * instrumentando as telas de novo — e correr o risco de os dois lados
 * divergirem — o mesmo `trackEvent` alimenta os dois destinos.
 *
 * Os nomes mudam na travessia porque o GA4 tem eventos recomendados próprios
 * (`sign_up`, `login`, `purchase`), e usar o nome recomendado é o que faz o
 * relatório de conversão do GA funcionar sem configuração extra.
 */

type Gtag = (comando: string, ...args: unknown[]) => void

const NOMES_GA4: Record<string, string> = {
  signup: "sign_up",
  login: "login",
  trial_start: "trial_start",
  profile_selected: "profile_selected",
  first_obra: "primeira_obra",
  first_despesa: "primeira_despesa",
  first_report: "primeiro_relatorio",
  subscription_started: "purchase",
  plan_changed: "plano_alterado",
  plan_cancelled: "plano_cancelado",
}

/** Etapas que representam avanço no funil site → cadastro → teste → assinatura. */
export const CONVERSOES_DO_FUNIL = ["sign_up", "trial_start", "primeira_obra", "purchase"] as const

export function enviarEventoGA(evento: string, parametros?: Record<string, unknown>): void {
  if (typeof window === "undefined") return

  const gtag = (window as unknown as { gtag?: Gtag }).gtag
  // Sem GA configurado (local, preview) a função não existe: sai calado em vez
  // de quebrar o fluxo que chamou.
  if (typeof gtag !== "function") return

  const nome = NOMES_GA4[evento] ?? evento

  try {
    gtag("event", nome, parametros ?? {})
  } catch {
    // medição nunca pode derrubar o fluxo do usuário
  }
}
