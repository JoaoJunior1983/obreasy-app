"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { getNotificacoesNaoLidas, type Notificacao } from "@/lib/alerts"

interface NotificationBellProps {
  obraId: string
  onClick: () => void
}

export function NotificationBell({ obraId, onClick }: NotificationBellProps) {
  const [count, setCount] = useState(0)

  const updateCount = () => {
    const naoLidas = getNotificacoesNaoLidas(obraId)
    setCount(naoLidas.length)
  }

  useEffect(() => {
    updateCount()

    // Escutar eventos de novas notificações
    const handleNovaNotificacao = () => updateCount()
    const handleNotificacaoLida = () => updateCount()

    window.addEventListener("novaNotificacao", handleNovaNotificacao)
    window.addEventListener("notificacaoLida", handleNotificacaoLida)

    return () => {
      window.removeEventListener("novaNotificacao", handleNovaNotificacao)
      window.removeEventListener("notificacaoLida", handleNotificacaoLida)
    }
  }, [obraId])

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="Notificações"
    >
      <Bell className="w-6 h-6 text-gray-700" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  )
}
