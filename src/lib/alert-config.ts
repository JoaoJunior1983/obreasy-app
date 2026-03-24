/**
 * Configuração de Alertas - Sistema Configurável
 *
 * Permite ao usuário:
 * - Ativar/desativar alertas por tipo
 * - Definir marcos percentuais customizados
 */

const CONFIG_KEY = 'alert_thresholds_config'

export interface AlertConfig {
  enabled: boolean
  profissional: {
    enabled: boolean
    thresholds: number[] // ex: [50, 75, 100]
  }
  obra: {
    enabled: boolean
    thresholds: number[] // ex: [30, 50, 70, 100]
  }
}

const DEFAULT_CONFIG: AlertConfig = {
  enabled: true,
  profissional: {
    enabled: true,
    thresholds: [50, 75, 100]
  },
  obra: {
    enabled: true,
    thresholds: [30, 50, 70, 100]
  }
}

export function loadAlertConfig(): AlertConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (!stored) return DEFAULT_CONFIG
    const parsed = JSON.parse(stored) as Partial<AlertConfig>
    return {
      enabled: parsed.enabled ?? DEFAULT_CONFIG.enabled,
      profissional: {
        enabled: parsed.profissional?.enabled ?? DEFAULT_CONFIG.profissional.enabled,
        thresholds: parsed.profissional?.thresholds ?? DEFAULT_CONFIG.profissional.thresholds
      },
      obra: {
        enabled: parsed.obra?.enabled ?? DEFAULT_CONFIG.obra.enabled,
        thresholds: parsed.obra?.thresholds ?? DEFAULT_CONFIG.obra.thresholds
      }
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveAlertConfig(config: AlertConfig): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function getDefaultConfig(): AlertConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG))
}
