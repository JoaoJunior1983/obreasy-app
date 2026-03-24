"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, X } from "lucide-react"

export function NotificationPermissionBanner() {
  const [status, setStatus] = useState<NotificationPermission | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setStatus(Notification.permission)
    }
  }, [])

  // Não exibir se: não suporta notificações, já decidiu, ou dispensou o banner
  if (!status || status !== "default" || dismissed) return null

  const handleEnable = async () => {
    const result = await Notification.requestPermission()
    setStatus(result)
  }

  return (
    <div className="flex items-center gap-2 bg-[#0B3064]/10 border border-[#0B3064]/40 rounded-xl px-3 py-2 mb-2">
      <Bell className="w-3.5 h-3.5 text-[#7eaaee] shrink-0" />
      <span className="flex-1 text-xs text-[#7eaaee]">
        Ative notificações para receber alertas de orçamento
      </span>
      <button
        onClick={handleEnable}
        className="bg-[#0B3064] hover:bg-[#082551] text-white text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors shrink-0"
      >
        Ativar
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-[#777777] hover:text-[#cccccc] transition-colors shrink-0"
        aria-label="Dispensar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
