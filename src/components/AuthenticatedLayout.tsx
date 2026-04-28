"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Header from "./Header"
import TrialBanner from "./custom/TrialBanner"
import { cleanupLocalStorageBase64 } from "@/lib/cleanup-local-storage"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showHeader, setShowHeader] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    cleanupLocalStorageBase64()
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Verificar se deve mostrar o header
    const isAuthenticated = localStorage.getItem("isAuthenticated")

    // Rotas onde o header NÃO deve aparecer
    const noHeaderRoutes = ["/", "/login", "/reset-password", "/em-breve", "/relatorios/imprimir"]

    // Proteção adicional: Se estiver na landing/login mas autenticado, redirecionar
    if ((pathname === "/" || pathname === "/login") && isAuthenticated === "true") {
      router.replace("/dashboard")
      return
    }

    // Mostrar header se estiver autenticado E não estiver em rota de exceção
    const shouldShow: boolean = isAuthenticated === "true" && !noHeaderRoutes.includes(pathname)
    setShowHeader(shouldShow)
  }, [pathname, mounted, router])

  if (!mounted || !showHeader) {
    return <>{children}</>
  }

  // Rotas onde o botão "Voltar" NÃO deve aparecer
  const noBackButtonRoutes = ["/dashboard", "/dashboard/obra", "/obras", "/admin", "/admin/usuarios", "/admin/trial"]
  const showBackButton = !noBackButtonRoutes.includes(pathname)

  return (
    <>
      <Header />
      <div className="pt-16 bg-[#0a0a0f] min-h-screen">
        <TrialBanner />
        {showBackButton && (
          <div className="px-3 pt-3 pb-0">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  )
}
