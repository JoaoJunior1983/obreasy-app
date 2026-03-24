"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation"

function ResetPasswordContent() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    // Registrar listener ANTES de qualquer verificação assíncrona
    // para não perder o evento PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSessionReady(true)
        setChecking(false)
      }
    })
    unsubscribe = () => subscription.unsubscribe()

    // getSession aguarda a inicialização interna do Supabase (incluindo detectSessionInUrl)
    // então é seguro chamar logo após registrar o listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
        setChecking(false)
      } else {
        // Sem sessão e sem hash de recovery → link inválido
        const hash = window.location.hash
        if (!hash.includes("access_token")) {
          setChecking(false)
        }
        // Se há hash, aguarda o evento PASSWORD_RECOVERY acima
      }
    })

    return () => unsubscribe?.()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error!)
      return
    }

    const matchValidation = validatePasswordMatch(password, confirmPassword)
    if (!matchValidation.isValid) {
      setError(matchValidation.error!)
      return
    }

    setIsLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => router.push("/"), 3000)
    } catch (err: any) {
      setError(err.message || "Erro ao redefinir senha. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#1f2228]/80 rounded-2xl border border-white/[0.08] max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/15 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Senha redefinida!</h2>
          <p className="text-gray-400 text-sm">Você será redirecionado para o login em instantes...</p>
        </div>
      </div>
    )
  }

  // Verificando token
  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#1f2228]/80 rounded-2xl border border-white/[0.08] max-w-md w-full p-8 text-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Verificando link de recuperação...</p>
        </div>
      </div>
    )
  }

  // Link inválido
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#1f2228]/80 rounded-2xl border border-white/[0.08] max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/15 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Link inválido ou expirado</h2>
          <p className="text-gray-400 text-sm mb-6">Solicite um novo link de recuperação de senha.</p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-[#0B3064] hover:bg-[#082551] text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    )
  }

  // Formulário de nova senha
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <span className="text-2xl font-black text-white tracking-tight">OBREASY</span>
          <p className="text-sm text-[#555] mt-1 font-light">Redefinir senha</p>
        </div>

        <div className="bg-[#1f2228]/80 rounded-2xl border border-white/[0.08] p-6">
          {error && (
            <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#888] mb-1.5">
                Nova senha
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-[#2a2d35] border border-white/[0.08] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#0B3064]/60 transition-colors text-sm"
                />
              </div>
              <p className="text-xs text-[#555] mt-1">Mínimo 6 caracteres, letras e números</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#888] mb-1.5">
                Confirmar nova senha
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-[#2a2d35] border border-white/[0.08] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#0B3064]/60 transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0B3064] text-white py-3.5 rounded-xl hover:bg-[#082551] transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir senha"
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full text-[#555] hover:text-[#888] transition-colors text-sm"
            >
              Voltar para o login
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
