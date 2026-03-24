"use client"

import { AlertTriangle, AlertCircle, X, ArrowRight } from "lucide-react"
import { BudgetAlert, dismissAlert, markAlertAsShown, getAlertActionRoute } from "@/lib/budget-alerts"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface BudgetAlertBannerProps {
  alert: BudgetAlert
  onDismiss: () => void
  onEdit?: () => void
}

export function BudgetAlertBanner({ alert, onDismiss, onEdit }: BudgetAlertBannerProps) {
  const router = useRouter()

  // Marcar como exibido ao montar
  useEffect(() => {
    markAlertAsShown(alert.id)
  }, [alert.id])

  const handleDismiss = () => {
    dismissAlert(alert.id)
    onDismiss()
  }

  const handleAction = () => {
    const route = getAlertActionRoute(alert)

    // Se for alerta de 100%, abrir modal de edição ao invés de navegar
    if (alert.level === '100%' && onEdit) {
      onEdit()
      handleDismiss()
    } else {
      router.push(route)
      handleDismiss()
    }
  }

  // Cores e ícones baseados no nível
  const is100Percent = alert.level === '100%'
  const bgColor = is100Percent
    ? 'bg-red-900/20 border-red-500/30'
    : 'bg-yellow-900/20 border-yellow-500/30'

  const textColor = is100Percent ? 'text-red-300' : 'text-yellow-300'
  const iconColor = is100Percent ? 'text-red-400' : 'text-yellow-400'
  const buttonColor = is100Percent
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-yellow-600 hover:bg-yellow-700 text-white'

  const Icon = is100Percent ? AlertCircle : AlertTriangle

  return (
    <div
      className={`${bgColor} border rounded-xl p-4 mb-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <div className="flex items-start gap-4">
        {/* Ícone */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className={`${textColor} font-medium mb-1`}>
                {alert.message}
              </p>
              <p className="text-sm text-gray-400">
                Percentual atingido: <span className="font-semibold">{alert.percentage.toFixed(1)}%</span>
              </p>
            </div>

            {/* Botão fechar */}
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/[0.08]"
              title="Dispensar aviso"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Botão de ação */}
          <button
            onClick={handleAction}
            className={`${buttonColor} px-4 py-2 rounded-lg font-medium text-sm mt-3 transition-all hover:scale-105 transform shadow-md inline-flex items-center gap-2`}
          >
            {is100Percent ? 'Ajustar orçamento' : 'Ver detalhes'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
