"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, Plus, Trash2, Pencil, HandCoins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getClientesSupabase, deleteClienteSupabase, type Cliente } from "@/lib/storage"
import { toast } from "sonner"

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function ClientesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obraId, setObraId] = useState("")
  const [deletandoId, setDeletandoId] = useState<string | null>(null)
  const [confirmarDeleteId, setConfirmarDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const carregar = async () => {
      const isAuthenticated = localStorage.getItem("isAuthenticated")
      if (!isAuthenticated) { router.push("/login"); return }

      const activeObraId = localStorage.getItem("activeObraId")
      if (!activeObraId) { router.push("/obras"); return }

      setObraId(activeObraId)

      try {
        const { supabase } = await import("@/lib/supabase")
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push("/login"); return }

        const data = await getClientesSupabase(activeObraId, user.id)
        setClientes(data)
      } catch {
        toast.error("Erro ao carregar clientes")
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [router])

  const handleDelete = async (clienteId: string) => {
    setDeletandoId(clienteId)
    const ok = await deleteClienteSupabase(clienteId)
    if (ok) {
      setClientes(prev => prev.filter(c => c.id !== clienteId))
      toast.success("Cliente removido")
    } else {
      toast.error("Erro ao remover cliente")
    }
    setDeletandoId(null)
    setConfirmarDeleteId(null)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3">
      {/* Modal de confirmação de exclusão */}
      {confirmarDeleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f2228] rounded-2xl shadow-2xl max-w-xs w-full p-5 border border-white/[0.1]">
            <p className="text-sm font-bold text-white mb-1">Remover cliente?</p>
            <p className="text-xs text-gray-400 mb-4">Os recebimentos vinculados serão desvinculados mas não excluídos.</p>
            <div className="flex gap-2">
              <Button
                onClick={() => setConfirmarDeleteId(null)}
                className="flex-1 h-9 bg-[#2a2d35] hover:bg-white/[0.13] text-gray-300 border border-white/[0.1] rounded-xl text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDelete(confirmarDeleteId)}
                disabled={deletandoId === confirmarDeleteId}
                className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm"
              >
                {deletandoId === confirmarDeleteId ? "Removendo..." : "Remover"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/[0.08] rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-300" />
            </div>
            <h1 className="text-base font-bold text-white">Clientes</h1>
          </div>
          <Button
            onClick={() => router.push("/dashboard/clientes/novo")}
            className="h-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-xl px-3"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Novo cliente
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
          </div>
        )}

        {/* Empty state */}
        {!loading && clientes.length === 0 && (
          <Card className="p-6 bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl text-center">
            <div className="w-12 h-12 bg-white/[0.08] rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Nenhum cliente cadastrado</p>
            <p className="text-xs text-gray-500 mb-4">Cadastre clientes para registrar recebimentos por cliente.</p>
            <Button
              onClick={() => router.push("/dashboard/clientes/novo")}
              className="bg-[#0B3064] hover:bg-[#082551] text-white text-sm h-9 rounded-xl px-4"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Cadastrar primeiro cliente
            </Button>
          </Card>
        )}

        {/* Lista de clientes */}
        {!loading && clientes.length > 0 && (
          <div className="space-y-2">
            {clientes.map(cliente => (
              <Card
                key={cliente.id}
                className="p-3 bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#0B3064]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-4 h-4 text-[#7eaaee]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-snug truncate">{cliente.nome}</p>
                    {cliente.contratoValor ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Contrato: <span className="text-gray-300">{formatarMoeda(cliente.contratoValor)}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">Contrato não definido</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => router.push(`/dashboard/clientes/${cliente.id}`)}
                      className="w-7 h-7 flex items-center justify-center bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors"
                      title="Recebimentos"
                    >
                      <HandCoins className="w-3.5 h-3.5 text-green-400" />
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/clientes/${cliente.id}?edit=1`)}
                      className="w-7 h-7 flex items-center justify-center bg-white/[0.08] hover:bg-[#2a2d35] rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setConfirmarDeleteId(cliente.id)}
                      className="w-7 h-7 flex items-center justify-center bg-white/[0.08] hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
