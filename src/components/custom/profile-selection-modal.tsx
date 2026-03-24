"use client"

import { useState } from "react"
import { Home, Briefcase, CheckCircle2, AlertCircle } from "lucide-react"
import { setUserProfile, type UserProfile } from "@/lib/storage"
import { Button } from "@/components/ui/button"

interface ProfileSelectionModalProps {
  onComplete: (profile: UserProfile) => void
  isChangingProfile?: boolean
}

export default function ProfileSelectionModal({ onComplete, isChangingProfile = false }: ProfileSelectionModalProps) {
  const [selectedProfile, setSelectedProfile] = useState<UserProfile>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectProfile = (profile: UserProfile) => {
    setSelectedProfile(profile)
    setShowWarning(false)
  }

  const handleConfirm = async () => {
    if (!selectedProfile) {
      setShowWarning(true)
      return
    }

    setIsSubmitting(true)

    // Salvar perfil (agora é assíncrono)
    const success = await setUserProfile(selectedProfile)

    if (success || isChangingProfile) {
      // Aguardar pequeno delay para feedback visual
      // Chamar onComplete que iniciará a navegação
      // O loading permanece ativo e o modal só fecha quando a nova página carregar
      setTimeout(() => {
        onComplete(selectedProfile)
        // NÃO desligar isSubmitting - mantém loading até navegação completar
      }, 600)
    } else {
      setShowWarning(true)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      {/* Loading overlay quando está processando */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="bg-[#1f2228] rounded-2xl p-8 shadow-2xl border border-white/[0.1] flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-semibold">Configurando sua conta...</p>
          </div>
        </div>
      )}

      <div className="bg-[#13151a] rounded-2xl max-w-3xl w-full shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 sm:p-8 pb-4 sm:pb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-[#0B3064]/15 rounded-full mb-3 sm:mb-6">
            <Home className="w-6 h-6 sm:w-8 sm:h-8 text-[#7eaaee]" />
          </div>

          {isChangingProfile ? (
            <>
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                Alterar Plano de Uso
              </h1>

              <h2 className="text-base sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                Como você vai usar o OBREASY?
              </h2>

              <p className="text-sm text-gray-400">
                Escolha o perfil que melhor se adapta às suas necessidades. As funcionalidades serão ajustadas automaticamente.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                Bem-vindo ao OBREASY!
              </h1>

              <h2 className="text-base sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                Antes de começar, precisamos entender como você vai usar o app
              </h2>

              <p className="text-sm text-gray-400">
                Essa escolha é importante para liberar as funcionalidades corretas. Você poderá alterar depois.
              </p>
            </>
          )}
        </div>

        {/* Body */}
        <div className="px-4 sm:px-8 pb-5 sm:pb-8">
          {/* Mensagem de aviso */}
          {showWarning && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-300">
                  Selecione como você pretende usar o app para continuar.
                </p>
              </div>
            </div>
          )}

          {/* Cards de seleção */}
          <div className="grid md:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
            {/* Dono da obra */}
            <button
              onClick={() => handleSelectProfile("owner")}
              disabled={isSubmitting}
              className={`text-left p-4 sm:p-6 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedProfile === "owner"
                  ? "border-blue-500 bg-[#0B3064]/10 shadow-lg shadow-blue-500/20 scale-[1.02]"
                  : "border-white/[0.1] bg-[#1f2228]/80 hover:border-blue-400 hover:bg-slate-700/40"
              }`}
            >
              <div className="flex items-center gap-3 mb-2 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors ${
                  selectedProfile === "owner" ? "bg-blue-500" : "bg-slate-600"
                }`}>
                  <Home className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-xl font-bold text-white">Dono da obra</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-2 sm:mb-4">
                Para quem quer acompanhar gastos, pagamentos e relatórios da própria obra.
              </p>
              {selectedProfile === "owner" && (
                <div className="flex items-center gap-2 text-[#7eaaee] text-sm font-semibold animate-in slide-in-from-left-2 duration-200">
                  <CheckCircle2 className="w-4 h-4" />
                  Selecionado
                </div>
              )}
            </button>

            {/* Construtor / Profissional */}
            <button
              onClick={() => handleSelectProfile("builder")}
              disabled={isSubmitting}
              className={`text-left p-4 sm:p-6 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedProfile === "builder"
                  ? "border-blue-500 bg-[#0B3064]/10 shadow-lg shadow-blue-500/20 scale-[1.02]"
                  : "border-white/[0.1] bg-[#1f2228]/80 hover:border-blue-400 hover:bg-slate-700/40"
              }`}
            >
              <div className="flex items-center gap-3 mb-2 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors ${
                  selectedProfile === "builder" ? "bg-blue-500" : "bg-slate-600"
                }`}>
                  <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-xl font-bold text-white">Engenheiro, Arquiteto ou Construtor</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-2 sm:mb-4">
                Para quem gerencia múltiplas obras, acompanha despesas e controla os recebimentos de clientes.
              </p>
              {selectedProfile === "builder" && (
                <div className="flex items-center gap-2 text-[#7eaaee] text-sm font-semibold animate-in slide-in-from-left-2 duration-200">
                  <CheckCircle2 className="w-4 h-4" />
                  Selecionado
                </div>
              )}
            </button>
          </div>

          {/* Botão de confirmação */}
          <Button
            onClick={handleConfirm}
            disabled={!selectedProfile || isSubmitting}
            size="lg"
            className={`w-full py-6 text-lg shadow-lg transition-all ${
              selectedProfile && !isSubmitting
                ? "bg-[#0B3064] hover:bg-[#082551] text-white hover:shadow-xl"
                : "bg-[#2a2d35] text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </div>
            ) : selectedProfile ? (
              "Confirmar e continuar"
            ) : (
              "Selecione uma opção acima"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
