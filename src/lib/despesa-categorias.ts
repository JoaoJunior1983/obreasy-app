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

export interface CategoriaColor {
  bar: string
  text: string
  dot: string
}

export const CATEGORIA_COLORS: Record<string, CategoriaColor> = {
  material:     { bar: "bg-blue-500",    text: "text-blue-400",    dot: "bg-blue-500" },
  mao_obra:     { bar: "bg-orange-500",  text: "text-orange-400",  dot: "bg-orange-500" },
  licencas:     { bar: "bg-amber-500",   text: "text-amber-400",   dot: "bg-amber-500" },
  ferramentas:  { bar: "bg-slate-400",   text: "text-slate-300",   dot: "bg-slate-400" },
  transporte:   { bar: "bg-cyan-500",    text: "text-cyan-400",    dot: "bg-cyan-500" },
  alimentacao:  { bar: "bg-pink-500",    text: "text-pink-400",    dot: "bg-pink-500" },
  limpeza:      { bar: "bg-teal-500",    text: "text-teal-400",    dot: "bg-teal-500" },
  seguranca:    { bar: "bg-red-500",     text: "text-red-400",     dot: "bg-red-500" },
  energia_agua: { bar: "bg-sky-500",     text: "text-sky-400",     dot: "bg-sky-500" },
  aluguel:      { bar: "bg-indigo-500",  text: "text-indigo-400",  dot: "bg-indigo-500" },
  projetos:     { bar: "bg-violet-500",  text: "text-violet-400",  dot: "bg-violet-500" },
  outros:       { bar: "bg-purple-500",  text: "text-purple-400",  dot: "bg-purple-500" },
}

const FALLBACK_CATEGORIA_COLOR: CategoriaColor = {
  bar: "bg-purple-500",
  text: "text-purple-400",
  dot: "bg-purple-500",
}

export function getCategoriaColor(value: string | null | undefined): CategoriaColor {
  if (!value) return FALLBACK_CATEGORIA_COLOR
  return CATEGORIA_COLORS[value] ?? FALLBACK_CATEGORIA_COLOR
}
