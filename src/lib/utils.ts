import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte uma string de data ISO (YYYY-MM-DD) para um objeto Date local
 * Evita problemas de timezone ao interpretar a data
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date()

  // Se a string já tem horário (ISO completo), use diretamente
  if (dateString.includes('T')) {
    return new Date(dateString)
  }

  // Para datas no formato YYYY-MM-DD, parse como data local
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/YYYY)
 * Mantém a data local sem conversão de timezone
 */
export function formatarData(dateString: string | Date): string {
  if (!dateString) return ''

  let date: Date
  if (typeof dateString === 'string') {
    date = parseLocalDate(dateString)
  } else {
    date = dateString
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Retorna a data atual no formato YYYY-MM-DD para inputs
 * Usa timezone local
 */
export function getDataHoje(): string {
  const hoje = new Date()
  const year = hoje.getFullYear()
  const month = String(hoje.getMonth() + 1).padStart(2, '0')
  const day = String(hoje.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
