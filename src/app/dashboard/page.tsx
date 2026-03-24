"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HardHat, ArrowRight } from "lucide-react"
import { getUserProfile, type UserProfile } from "@/lib/storage"

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [obras, setObras] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndLoadObras = async () => {
      try {
        // Verificar autenticação no localStorage primeiro (fallback)
        const isAuthenticated = localStorage.getItem("isAuthenticated")

        if (isAuthenticated !== "true") {
          // Se não autenticado, redirecionar para landing page
          router.push("/")
          return
        }

        // Verificar autenticação no Supabase
        const { supabase } = await import("@/lib/supabase")
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          // Se não tiver sessão no Supabase mas tiver no localStorage,
          // permitir acesso (usuário fez login simulado)
          console.log("Usuário autenticado via localStorage (modo desenvolvimento)")
        }

        // Carregar obras do usuário do Supabase
        let obrasDoUsuario: any[] = []

        if (user) {
          const { data: obrasData, error: obrasError } = await supabase
            .from("obras")
            .select("*")
            .eq("user_id", user.id)
            .order("criada_em", { ascending: false })

          if (obrasError) {
            console.error("Erro ao carregar obras:", obrasError)
          } else {
            obrasDoUsuario = obrasData || []
          }
        }

        setObras(obrasDoUsuario)

        // Se o usuário TEM obras, redirecionar para a página de obras
        // Esta página /dashboard só deve ser exibida se NÃO houver obras
        if (obrasDoUsuario.length > 0) {
          const activeObraId = localStorage.getItem("activeObraId")
          if (activeObraId && obrasDoUsuario.some((o: any) => o.id === activeObraId)) {
            router.push("/dashboard/obra")
          } else {
            router.push("/obras")
          }
          return
        }

        // Carregar perfil do usuário
        const profile = getUserProfile()
        setUserProfile(profile)

        setIsLoading(false)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/")
      }
    }

    checkAuthAndLoadObras()
  }, [router])

  // Mostrar loading enquanto verifica obras
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white font-semibold">Carregando...</p>
        </div>
      </div>
    )
  }

  const handleCriarObra = () => {
    router.push("/dashboard/criar-obra")
  }

  const handleAcessarObras = () => {
    // Sempre navegar para /obras (a página /obras gerencia a lógica de redirecionamento)
    router.push("/obras")
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0a0a0a] flex items-start justify-center pt-16 px-4 pb-8">
      <div className="w-full max-w-sm">

        {/* Ícone + saudação */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-[#0B3064]/10 border border-[#0B3064]/30 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/10">
            <HardHat className="w-8 h-8 text-[#7eaaee]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 leading-tight">
            {userName ? `Olá, ${userName.split(" ")[0]}! 👋` : "Bem-vindo!"}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Cadastre sua primeira obra e tenha controle total sobre gastos e profissionais.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleCriarObra}
          className="w-full bg-[#0B3064] hover:bg-[#082551] text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          Criar minha obra
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  )
}
