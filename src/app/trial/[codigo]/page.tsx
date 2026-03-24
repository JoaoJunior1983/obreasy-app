"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { CheckCircle2, XCircle, Gift, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Status = "loading" | "valid" | "invalid" | "used" | "expired" | "no_auth" | "success" | "error"

export default function TrialPage() {
  const router = useRouter()
  const params = useParams()
  const codigo = params?.codigo as string
  const [status, setStatus] = useState<Status>("loading")
  const [trialData, setTrialData] = useState<any>(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (codigo) validateCode()
  }, [codigo])

  const validateCode = async () => {
    const { supabase } = await import("@/lib/supabase")

    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Salvar código para redirecionar depois do login
      localStorage.setItem("pendingTrialCode", codigo)
      setStatus("no_auth")
      return
    }

    // Buscar código
    const { data: trial, error } = await supabase
      .from("admin_trials")
      .select("*")
      .eq("code", codigo.toUpperCase())
      .single()

    if (error || !trial) { setStatus("invalid"); return }
    if (trial.used_at) { setStatus("used"); setTrialData(trial); return }
    if (trial.expires_at && new Date(trial.expires_at) < new Date()) { setStatus("expired"); setTrialData(trial); return }
    if (trial.email && trial.email.toLowerCase() !== user.email?.toLowerCase()) { setStatus("invalid"); return }

    setTrialData(trial)
    setStatus("valid")
  }

  const handleAplicar = async () => {
    setApplying(true)
    const { supabase } = await import("@/lib/supabase")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus("no_auth"); setApplying(false); return }

    const expira = new Date()
    expira.setDate(expira.getDate() + trialData.days)

    // Atualizar plano no user_profiles
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        plano: "profissional",
        plano_expira_em: expira.toISOString(),
      })
      .eq("id", user.id)

    if (updateError) { setStatus("error"); setApplying(false); return }

    // Marcar código como usado
    await supabase
      .from("admin_trials")
      .update({ used_at: new Date().toISOString(), used_by: user.id })
      .eq("id", trialData.id)

    // Atualizar localStorage
    localStorage.setItem("userPlan", "profissional")
    localStorage.removeItem("pendingTrialCode")

    setStatus("success")
    setApplying(false)
  }

  const content: Record<Status, JSX.Element> = {
    loading: (
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-gray-400 text-sm">Validando código...</p>
      </div>
    ),
    no_auth: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center">
          <Gift className="w-7 h-7 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Acesso especial</h2>
        <p className="text-sm text-gray-400">Faça login para ativar seu acesso gratuito ao plano Profissional.</p>
        <Button onClick={() => router.push(`/?redirect=/trial/${codigo}`)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Entrar / Criar conta
        </Button>
      </div>
    ),
    valid: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center">
          <Gift className="w-7 h-7 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Código válido!</h2>
        <div className="bg-slate-700/50 rounded-xl p-4 w-full text-left space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-400">Plano</span><span className="text-blue-400 font-semibold">Profissional</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Duração</span><span className="text-white">{trialData?.days} dias</span></div>
          {trialData?.label && <div className="flex justify-between text-sm"><span className="text-gray-400">Parceria</span><span className="text-white">{trialData.label}</span></div>}
        </div>
        <p className="text-xs text-gray-500">Ao ativar, você terá acesso completo ao plano Profissional por {trialData?.days} dias, sem necessidade de cartão de crédito.</p>
        <Button onClick={handleAplicar} disabled={applying} className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold">
          {applying ? "Ativando..." : "Ativar acesso gratuito"}
        </Button>
      </div>
    ),
    invalid: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center">
          <XCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Código inválido</h2>
        <p className="text-sm text-gray-400">Este código não existe ou não está disponível para sua conta.</p>
        <Button onClick={() => router.push("/dashboard")} className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600">Ir para o app</Button>
      </div>
    ),
    used: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
          <XCircle className="w-7 h-7 text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Código já utilizado</h2>
        <p className="text-sm text-gray-400">Este código já foi resgatado anteriormente e não pode ser usado novamente.</p>
        <Button onClick={() => router.push("/dashboard")} className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600">Ir para o app</Button>
      </div>
    ),
    expired: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center">
          <XCircle className="w-7 h-7 text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Código expirado</h2>
        <p className="text-sm text-gray-400">Este código de acesso já passou da data de validade.</p>
        <Button onClick={() => router.push("/dashboard/plano")} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Ver planos disponíveis</Button>
      </div>
    ),
    success: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Acesso ativado!</h2>
        <p className="text-sm text-gray-400">
          Seu plano <span className="text-blue-400 font-semibold">Profissional</span> foi ativado por {trialData?.days} dias. Aproveite!
        </p>
        <Button onClick={() => router.push("/obras")} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          Ir para o app
        </Button>
      </div>
    ),
    error: (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center">
          <XCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Erro ao ativar</h2>
        <p className="text-sm text-gray-400">Ocorreu um erro ao ativar o trial. Tente novamente ou entre em contato.</p>
        <Button onClick={validateCode} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Tentar novamente</Button>
      </div>
    ),
  }

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold">OBREASY</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          {content[status]}
        </div>
      </div>
    </div>
  )
}
