"use client"

import { AlertTriangle, AlertCircle, TrendingUp } from "lucide-react"
import { BudgetAlert, markAlertAsShown } from "@/lib/budget-alerts"
import { Button } from "@/components/ui/button"

interface BudgetAlertModalProps {
  alert: BudgetAlert
  onConfirm: () => void
}

export function BudgetAlertModal({ alert, onConfirm }: BudgetAlertModalProps) {
  const isExcedido = alert.level === 'excedido'
  const is100Percent = alert.level === '100%'
  const isCritico = isExcedido || is100Percent

  const handleConfirm = () => {
    markAlertAsShown(alert.id)
    onConfirm()
  }

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div
        className={`bg-[#1f2228] rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-300 border-2 ${
          isCritico ? 'border-red-500/50' : 'border-yellow-500/50'
        }`}
      >
        {/* Ícone */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isCritico
            ? 'bg-red-500/20 ring-2 ring-red-500/50'
            : 'bg-yellow-500/20 ring-2 ring-yellow-500/50'
        }`}>
          {isCritico ? (
            <AlertCircle className="w-8 h-8 text-red-400" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          )}
        </div>

        {/* Título */}
        <h2 className={`text-2xl font-bold text-center mb-3 ${
          isCritico ? 'text-red-300' : 'text-yellow-300'
        }`}>
          {alert.type === 'profissional' && alert.detalhes.profissionalNome
            ? `Alerta: ${alert.detalhes.profissionalNome}`
            : 'Atenção ao Orçamento'}
        </h2>

        {/* Mensagem principal */}
        <p className="text-center text-gray-300 mb-4 text-base leading-relaxed whitespace-pre-line">
          {alert.message}
        </p>

        {/* Detalhes do orçamento */}
        <div className="space-y-3 mb-6">
          {/* Percentual */}
          <div className="bg-[#13151a]/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm font-medium">Percentual atingido:</span>
              <span className={`text-2xl font-bold ${
                isCritico ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {alert.percentage}%
              </span>
            </div>
          </div>

          {/* Valor do lançamento */}
          <div className="bg-[#13151a]/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm font-medium">Valor deste lançamento:</span>
              <span className="text-white text-lg font-bold">
                {formatCurrency(alert.detalhes.valorLancamento)}
              </span>
            </div>
          </div>

          {/* Total após lançamento */}
          <div className="bg-[#13151a]/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm font-medium">
                {alert.type === 'profissional'
                  ? 'Total pago ao profissional:'
                  : 'Total gasto na obra:'}
              </span>
              <span className="text-white text-lg font-bold">
                {formatCurrency(alert.detalhes.totalGastoApos)}
              </span>
            </div>
          </div>

          {/* Orçamento/Valor negociado */}
          {alert.type === 'orcamento_total' && alert.detalhes.orcamentoTotal && (
            <div className="bg-[#13151a]/80 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm font-medium">Orçamento total:</span>
                <span className="text-[#7eaaee] text-lg font-bold">
                  {formatCurrency(alert.detalhes.orcamentoTotal)}
                </span>
              </div>
            </div>
          )}

          {alert.type === 'profissional' && alert.detalhes.valorNegociado && (
            <div className="bg-[#13151a]/80 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm font-medium">Valor negociado:</span>
                <span className="text-[#7eaaee] text-lg font-bold">
                  {formatCurrency(alert.detalhes.valorNegociado)}
                </span>
              </div>
            </div>
          )}

          {/* Saldo disponível (se não excedeu) */}
          {!isExcedido && alert.detalhes.saldoDisponivel !== undefined && (
            <div className={`rounded-xl p-4 border-2 ${
              alert.detalhes.saldoDisponivel > 0
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Saldo disponível:
                </span>
                <span className={`text-lg font-bold ${
                  alert.detalhes.saldoDisponivel > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {formatCurrency(alert.detalhes.saldoDisponivel)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Info adicional */}
        <div className={`${isCritico ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} border rounded-lg p-4 mb-6`}>
          <p className={`text-sm ${isCritico ? 'text-red-300' : 'text-yellow-300'} text-center font-medium`}>
            {isCritico
              ? '⚠️ Você pode revisar o orçamento depois na tela da obra'
              : '💡 Você pode revisar o orçamento depois na tela da obra'}
          </p>
        </div>

        {/* Botão único */}
        <Button
          onClick={handleConfirm}
          className={`w-full h-12 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105 transform ${
            isCritico
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-yellow-600 hover:bg-yellow-700'
          }`}
        >
          Efetivar lançamento e estou ciente
        </Button>

        {/* Tipo de alerta */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {alert.type === 'orcamento_total' && `Impacto no orçamento total da obra (${alert.detalhes.tipo})`}
            {alert.type === 'profissional' && `Alerta de valor negociado com profissional`}
          </p>
        </div>
      </div>
    </div>
  )
}
