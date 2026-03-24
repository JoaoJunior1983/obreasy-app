"use client"

import { useEffect, useState } from "react"
import { X, Bell, AlertCircle, Calendar, Wallet, Check } from "lucide-react"
import {
  getNotificacoesByObra,
  marcarNotificacaoComoLida,
  marcarTodasComoLidas,
  type Notificacao
} from "@/lib/alerts"

interface NotificationPanelProps {
  obraId: string
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ obraId, isOpen, onClose }: NotificationPanelProps) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])

  const loadNotificacoes = () => {
    const notifs = getNotificacoesByObra(obraId)
    setNotificacoes(notifs)
  }

  useEffect(() => {
    if (isOpen) {
      loadNotificacoes()
    }

    const handleNovaNotificacao = () => loadNotificacoes()
    const handleNotificacaoLida = () => loadNotificacoes()

    window.addEventListener("novaNotificacao", handleNovaNotificacao)
    window.addEventListener("notificacaoLida", handleNotificacaoLida)

    return () => {
      window.removeEventListener("novaNotificacao", handleNovaNotificacao)
      window.removeEventListener("notificacaoLida", handleNotificacaoLida)
    }
  }, [isOpen, obraId])

  const handleMarcarComoLida = (id: string) => {
    marcarNotificacaoComoLida(id)
  }

  const handleMarcarTodasComoLidas = () => {
    marcarTodasComoLidas(obraId)
  }

  const getIconByTipo = (tipo: string) => {
    switch (tipo) {
      case "orcamento":
        return <Wallet className="w-5 h-5 text-red-400" />
      case "prazo":
        return <Calendar className="w-5 h-5 text-amber-400" />
      case "pagamento":
        return <AlertCircle className="w-5 h-5 text-[#7eaaee]" />
      default:
        return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  const formatarData = (dataISO: string): string => {
    const data = new Date(dataISO)
    const hoje = new Date()

    const diffMs = hoje.getTime() - data.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHoras = Math.floor(diffMs / 3600000)
    const diffDias = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `Há ${diffMins} min`
    if (diffHoras < 24) return `Há ${diffHoras}h`
    if (diffDias === 1) return "Ontem"
    if (diffDias < 7) return `Há ${diffDias} dias`

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short"
    })
  }

  if (!isOpen) return null

  const naoLidas = notificacoes.filter(n => !n.lida)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-slate-900/95 backdrop-blur-sm shadow-2xl z-50 animate-in slide-in-from-right duration-300 border-l border-white/10">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#7eaaee]" />
              <h2 className="text-lg font-bold text-white">Notificações</h2>
              {naoLidas.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {naoLidas.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#1f2228] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Actions */}
          {naoLidas.length > 0 && (
            <div className="p-3 border-b border-white/10">
              <button
                onClick={handleMarcarTodasComoLidas}
                className="text-sm text-[#7eaaee] hover:text-[#7eaaee] font-medium flex items-center gap-1 transition-colors"
              >
                <Check className="w-4 h-4" />
                Marcar todas como lidas
              </button>
            </div>
          )}

          {/* Lista de notificações */}
          <div className="flex-1 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-[#1f2228] rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-300 font-medium mb-1">Nenhuma notificação</p>
                <p className="text-sm text-gray-500">
                  Você será notificado sobre alertas importantes da obra
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/30">
                {notificacoes.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-[#1f2228]/80 transition-colors cursor-pointer ${
                      !notif.lida ? "bg-[#1f2228]/50" : ""
                    }`}
                    onClick={() => !notif.lida && handleMarcarComoLida(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIconByTipo(notif.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`text-sm font-semibold ${
                            !notif.lida ? "text-white" : "text-gray-300"
                          }`}>
                            {notif.titulo}
                          </h3>
                          {!notif.lida && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
                          )}
                        </div>
                        <p className={`text-sm ${
                          !notif.lida ? "text-gray-300" : "text-gray-400"
                        }`}>
                          {notif.mensagem}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatarData(notif.criadaEm)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
