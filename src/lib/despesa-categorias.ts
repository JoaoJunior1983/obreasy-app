export interface DespesaCategoria {
  value: string
  label: string
}

export const CATEGORIAS_DESPESA_PADRAO: DespesaCategoria[] = [
  { value: "material", label: "Material de Construção" },
  { value: "ferramentas", label: "Ferramentas e Equipamentos" },
  { value: "licencas", label: "Licenças e Documentação" },
  { value: "transporte", label: "Transporte e Frete" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "limpeza", label: "Limpeza" },
  { value: "seguranca", label: "Segurança e EPIs" },
  { value: "energia_agua", label: "Energia e Água" },
  { value: "aluguel", label: "Aluguel de Equipamentos" },
  { value: "projetos", label: "Projetos e Consultorias" },
  { value: "outros", label: "Outros" },
]

const CUSTOM_CATEGORIAS_KEY = "despesa_categorias_custom"

export function getCustomCategorias(): DespesaCategoria[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIAS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (c) => c && typeof c.value === "string" && typeof c.label === "string"
    )
  } catch {
    return []
  }
}

export function saveCustomCategorias(list: DespesaCategoria[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CUSTOM_CATEGORIAS_KEY, JSON.stringify(list))
}

export function slugifyCategoria(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `custom_${Date.now()}`
}

export function addCustomCategoria(label: string): DespesaCategoria | null {
  const trimmed = label.trim()
  if (!trimmed) return null

  const existing = getCustomCategorias()
  const allCurrent = [...CATEGORIAS_DESPESA_PADRAO, ...existing]

  const labelExists = allCurrent.some(
    (c) => c.label.toLowerCase() === trimmed.toLowerCase()
  )
  if (labelExists) {
    return allCurrent.find((c) => c.label.toLowerCase() === trimmed.toLowerCase()) || null
  }

  let value = slugifyCategoria(trimmed)
  let suffix = 1
  while (allCurrent.some((c) => c.value === value)) {
    value = `${slugifyCategoria(trimmed)}_${suffix++}`
  }

  const novaCategoria: DespesaCategoria = { value, label: trimmed }
  saveCustomCategorias([...existing, novaCategoria])
  return novaCategoria
}

export function getAllCategorias(): DespesaCategoria[] {
  return [...CATEGORIAS_DESPESA_PADRAO, ...getCustomCategorias()]
}

export function getCategoriaLabel(value: string | undefined | null): string {
  if (!value) return "—"
  const all = getAllCategorias()
  const found = all.find((c) => c.value === value)
  if (found) return found.label
  if (value === "mao_obra") return "Mão de Obra"
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
