"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from "lucide-react"
import LoadingScreen from "@/components/LoadingScreen"
import AuthModal from "@/components/custom/auth-modal"

const inputCls = "w-full pl-11 pr-4 py-3.5 bg-[#2a2d35] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#0B3064]/60 transition-colors"

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCadastro, setShowCadastro] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({ email: "", password: "" })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (typeof window === "undefined") return

    // Detect password recovery tokens and redirect to /reset-password
    const hash = window.location.hash
    if (hash && hash.includes("type=recovery")) {
      window.location.href = `/reset-password${hash}`
      return
    }

    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (isAuthenticated === "true") {
      setIsRedirecting(true)
      setTimeout(() => router.replace("/dashboard"), 50)
    }
  }, [router, mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { supabase } = await import("@/lib/supabase")
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        setError("E-mail ou senha inválidos. Verifique e tente novamente.")
        setIsLoading(false)
        return
      }

      if (data.user) {
        localStorage.setItem("isAuthenticated", "true")

        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        const userData = {
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Usuário",
          email: data.user.email || "",
          profile: !profileError && profileData ? (profileData as any).profile_type : null,
        }
        localStorage.setItem("user", JSON.stringify(userData))

        router.push("/dashboard")
      }
    } catch {
      setError("Erro inesperado ao fazer login. Tente novamente.")
      setIsLoading(false)
    }
  }

  if (!mounted || isRedirecting) {
    return <LoadingScreen message={isRedirecting ? "Redirecionando..." : "Carregando..."} />
  }

  if (showCadastro) {
    return <AuthModal onClose={() => setShowCadastro(false)} fromQuiz={true} />
  }

  if (showForgotPassword) {
    return <AuthModal onClose={() => setShowForgotPassword(false)} initialMode="forgot-password" />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <span className="text-2xl font-black text-white tracking-tight">OBREASY</span>
          <p className="text-sm text-[#555] mt-1 font-light">Acesse sua conta</p>
        </div>

        {/* Card */}
        <div className="bg-[#1f2228]/80 rounded-2xl border border-white/[0.08] p-6">

          {/* Erro */}
          {error && (
            <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#888] mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError("") }}
                  className={inputCls}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#888] mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError("") }}
                  className="w-full pl-11 pr-12 py-3.5 bg-[#2a2d35] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#0B3064]/60 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Esqueceu a senha */}
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-[#555] hover:text-[#888] transition-colors"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#0B3064] hover:bg-[#082551] active:bg-blue-800 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 group mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

          </form>

          {/* Divisor */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#1f2228] text-[#444]">ou</span>
            </div>
          </div>

          {/* Criar conta */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowCadastro(true)}
              className="text-sm text-[#7eaaee] hover:text-[#7eaaee]/80 transition-colors font-medium"
            >
              Criar uma conta
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
