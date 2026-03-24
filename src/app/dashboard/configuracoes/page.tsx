"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Settings } from "lucide-react"

export default function ConfiguracoesPage() {
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticação
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Card principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Settings className="w-8 h-8 text-[#0B3064]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-gray-500">Personalize sua experiência no OBREASY</p>
            </div>
          </div>

          {/* Mensagem de desenvolvimento */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Configurações avançadas estarão disponíveis em breve.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
