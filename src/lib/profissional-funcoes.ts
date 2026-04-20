export const FUNCOES_PADRAO: string[] = [
  "Pedreiro",
  "Eletricista",
  "Encanador",
  "Azulejista",
  "Pintor",
  "Gesseiro",
  "Marceneiro",
  "Engenheiro",
  "Arquiteto",
  "Outros",
]

const CUSTOM_FUNCOES_KEY = "profissional_funcoes_custom"

export function getCustomFuncoes(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CUSTOM_FUNCOES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((f) => typeof f === "string" && f.trim().length > 0)
  } catch {
    return []
  }
}

export function saveCustomFuncoes(list: string[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CUSTOM_FUNCOES_KEY, JSON.stringify(list))
}

export function addCustomFuncao(label: string): string | null {
  const trimmed = label.trim()
  if (!trimmed) return null

  const existing = getCustomFuncoes()
  const all = [...FUNCOES_PADRAO, ...existing]

  const exists = all.find((f) => f.toLowerCase() === trimmed.toLowerCase())
  if (exists) return exists

  saveCustomFuncoes([...existing, trimmed])
  return trimmed
}

export function getAllFuncoes(): string[] {
  return [...FUNCOES_PADRAO, ...getCustomFuncoes()]
}

export function formatarTelefoneBR(valor: string): string {
  const apenasNumeros = (valor ?? "").replace(/\D/g, "")
  if (!apenasNumeros) return ""

  if (apenasNumeros.length <= 2) return `(${apenasNumeros}`
  if (apenasNumeros.length <= 7) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`
  }
  if (apenasNumeros.length <= 11) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`
  }
  return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`
}
