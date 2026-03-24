"use client"

import { useEffect, useState } from "react"
import { Plus, Check, Gift, Clock, XCircle, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Trial {
  id: string
  email: string
  label: string | null
  days: number
  created_at: string
  expires_at: string | null
}

export default function AdminTrialPage() {
  const [trials, setTrials] = useState<Trial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nome: "", email: "", days: "30" })

  useEffect(() => { loadTrials() }, [])

  const loadTrials = async () => {
    const { supabase } = await import("@/lib/supabase")
    const { data } = await supabase
      .from("admin_trials")
      .select("id, email, label, days, created_at, expires_at")
      .order("created_at", { ascending: false })
    setTrials(data ?? [])
    setLoading(false)
  }

  const handleCriar = async () => {
    if (!form.email.trim()) { toast.error("Email é obrigatório"); return }
    const days = parseInt(form.days) || 30
    setSaving(true)
    const { supabase } = await import("@/lib/supabase")

    const expires = new Date()
    expires.setDate(expires.getDate() + days)

    const { data, error } = await supabase
      .from("admin_trials")
      .insert([{
        email: form.email.trim().toLowerCase(),
        label: form.nome.trim() || null,
        days,
        expires_at: expires.toISOString(),
      }])
      .select()
      .single()

    if (error) {
      toast.error("Erro ao cadastrar: " + error.message)
    } else {
      // Atualizar plano no user_profiles se o usuário já existe
      await supabase
        .from("user_profiles")
        .update({ plano: "profissional", plano_expira_em: expires.toISOString() })
        .eq("email", form.email.trim().toLowerCase())

      setTrials(prev => [data, ...prev])
      setForm({ nome: "", email: "", days: "30" })
      setShowForm(false)
      toast.success("Acesso trial cadastrado!")
    }
    setSaving(false)
  }

  const handleRemover = async (id: string) => {
    const { supabase } = await import("@/lib/supabase")
    await supabase.from("admin_trials").delete().eq("id", id)
    setTrials(prev => prev.filter(t => t.id !== id))
    toast.success("Removido")
  }

  const getStatus = (trial: Trial) => {
    if (!trial.expires_at) return { label: "Sem expiração", color: "text-blue-400", icon: Check, ativo: true }
    if (new Date(trial.expires_at) < new Date()) return { label: "Expirado", color: "text-red-400", icon: XCircle, ativo: false }
    return { label: "Ativo", color: "text-green-400", icon: Clock, ativo: true }
  }

  const diasRestantes = (expires_at: string | null) => {
    if (!expires_at) return null
    const diff = Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86400000)
    return diff > 0 ? diff : 0
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Acessos Trial</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gerencie usuários com acesso temporário</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Novo acesso
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="p-5 bg-slate-800/50 border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-4">Cadastrar acesso trial</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-400">Nome</Label>
              <Input
                placeholder="Nome do usuário"
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Email <span className="text-red-400">*</span></Label>
              <Input
                type="email"
                placeholder="usuario@email.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Duração (dias)</Label>
              <Input
                type="number"
                placeholder="30"
                value={form.days}
                onChange={e => setForm(p => ({ ...p, days: e.target.value }))}
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600 text-sm">Cancelar</Button>
            <Button onClick={handleCriar} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
              {saving ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </Card>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {trials.length === 0 && (
          <Card className="p-8 bg-slate-800/50 border-slate-700/50 text-center">
            <Gift className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum acesso trial cadastrado</p>
          </Card>
        )}
        {trials.map(trial => {
          const status = getStatus(trial)
          const StatusIcon = status.icon
          const dias = diasRestantes(trial.expires_at)

          return (
            <Card key={trial.id} className={`p-4 bg-slate-800/50 border-slate-700/50 ${!status.ativo ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {trial.label && <p className="text-sm font-semibold text-white">{trial.label}</p>}
                    <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </div>
                  </div>
                  <p className="text-sm text-blue-400 mb-1">{trial.email}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>{trial.days} dias de trial</span>
                    {trial.expires_at && status.ativo && dias !== null && (
                      <span className="text-green-400">• {dias} dias restantes</span>
                    )}
                    {trial.expires_at && (
                      <span>• Expira: {new Date(trial.expires_at).toLocaleDateString("pt-BR")}</span>
                    )}
                    <span>• Criado: {new Date(trial.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemover(trial.id)}
                  className="flex-shrink-0 p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
