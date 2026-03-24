"use client"

export interface PercentualAlertData {
  type: 'profissional' | 'obra'
  percentage: number
  nomeProfissional?: string
}

interface PercentualAlertModalProps {
  alert: PercentualAlertData
  onOk: () => void
}

export function PercentualAlertModal({ alert, onOk }: PercentualAlertModalProps) {
  const isCritical = alert.percentage >= 100
  const isWarning = alert.percentage >= 75

  const emoji = isCritical ? '🎯' : isWarning ? '⚠️' : 'ℹ️'

  const colorClass = isCritical
    ? 'text-red-400'
    : isWarning
    ? 'text-yellow-400'
    : 'text-[#7eaaee]'

  const borderClass = isCritical
    ? 'border-red-500/30 bg-red-500/10'
    : isWarning
    ? 'border-yellow-500/30 bg-yellow-500/10'
    : 'border-[#0B3064]/40 bg-[#0B3064]/10'

  const getMessage = () => {
    if (alert.type === 'profissional') {
      return `Você atingiu ${alert.percentage}% do valor previsto do profissional ${alert.nomeProfissional}.`
    }
    return `O total gasto da obra atingiu ${alert.percentage}% do orçamento.`
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-[#1f2228] rounded-2xl shadow-2xl max-w-xs w-full p-5 border border-white/[0.1] animate-in zoom-in-95 duration-150">
        <div className={`rounded-xl border p-4 mb-4 ${borderClass}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{emoji}</span>
            <p className={`text-sm font-bold ${colorClass}`}>
              {alert.percentage}% atingido
            </p>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{getMessage()}</p>
        </div>
        <button
          onClick={onOk}
          className="w-full h-9 bg-[#0B3064] hover:bg-[#082551] text-white text-sm font-medium rounded-xl transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  )
}
