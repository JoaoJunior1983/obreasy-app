"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

// Rota legacy. Redirecionada para o caminho canônico /dashboard/despesas/[id]/editar
// (que tem o layout compacto correto). Esta rota antiga tinha layout desktop e
// ficou órfã quando a nova foi introduzida; um cliente caiu aqui via cache do
// PWA. Mantida como redirect para não quebrar bookmarks/atalhos.
export default function EditarDespesaLegacyRedirect() {
  const router = useRouter()
  const params = useParams()
  const despesaId = params.id as string

  useEffect(() => {
    if (despesaId) {
      router.replace(`/dashboard/despesas/${despesaId}/editar`)
    } else {
      router.replace("/dashboard/despesas")
    }
  }, [despesaId, router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Redirecionando...</p>
      </div>
    </div>
  )
}
