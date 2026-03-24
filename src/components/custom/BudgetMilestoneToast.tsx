"use client"

import { useEffect, useState } from "react"
import type { MilestoneNotificationData } from "@/lib/push-notifications"
import { X } from "lucide-react"

interface ToastItem extends MilestoneNotificationData {
  id: number
}

let counter = 0

export function BudgetMilestoneToast() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const data = (e as CustomEvent<MilestoneNotificationData>).detail
      const item: ToastItem = { ...data, id: ++counter }
      setItems(prev => [...prev, item])

      // Auto-dismiss após 7 segundos
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== item.id))
      }, 7000)
    }

    window.addEventListener("budget-milestone", handler)
    return () => window.removeEventListener("budget-milestone", handler)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
      {items.map(item => (
        <div
          key={item.id}
          className="pointer-events-auto bg-[#1f2228] border border-white/[0.1] rounded-2xl px-4 py-3 shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300"
        >
          <span className="text-2xl leading-none mt-0.5 shrink-0">{item.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-snug">{item.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{item.body}</p>
          </div>
          <button
            onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
            className="text-gray-500 hover:text-gray-300 transition-colors shrink-0 mt-0.5"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
