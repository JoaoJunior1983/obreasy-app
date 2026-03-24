"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, Building2, FileText, ArrowRight, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BuilderSetupGuideProps {
  onClose: () => void
}

const STEPS = [
  {
    id: 1,
    icon: Briefcase,
    title: "Perfil atualizado!",
    subtitle: "Bem-vindo ao modo Construtor/Profissional",
    description:
      "Agora você pode gerenciar obras de clientes, contratos, recebimentos e profissionais contratados. Vamos configurar sua obra atual para esse perfil.",
    actionLabel: "Vamos lá",
  },
  {
    id: 2,
    icon: Building2,
    title: "Configure sua obra",
    subtitle: "Adicione o nome do cliente",
    description:
      "Na tela de Obras, clique em Editar na sua obra e preencha o campo \"Nome do Cliente\". Isso identifica para quem a obra está sendo executada.",
    actionLabel: "Ir para Obras",
    actionRoute: "/obras",
  },
  {
    id: 3,
    icon: FileText,
    title: "Defina o contrato",
    subtitle: "Valor contratado e anexo",
    description:
      "Ainda na edição da obra, informe o valor total contratado com o cliente e, se preferir, anexe o contrato assinado. Isso habilita o controle de recebimentos e saldo a receber.",
    actionLabel: "Ir para Obras",
    actionRoute: "/obras",
  },
]

export default function BuilderSetupGuide({ onClose }: BuilderSetupGuideProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  const handleNext = () => {
    if (current.actionRoute) {
      localStorage.setItem("builderSetupSeen", "true")
      onClose()
      router.push(current.actionRoute)
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem("builderSetupSeen", "true")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-[#13151a] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">

        {/* Progress bar */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-blue-500" : "bg-[#2a2d35]"
              }`}
            />
          ))}
        </div>

        {/* Close button */}
        <div className="flex justify-end px-4 pt-3">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded"
            title="Pular configuração"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-2">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-[#0B3064]/15 border border-[#0B3064]/40 rounded-2xl flex items-center justify-center">
              <Icon className="w-8 h-8 text-[#7eaaee]" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-6">
            <p className="text-xs text-[#7eaaee] font-semibold uppercase tracking-wider mb-1">
              {current.subtitle}
            </p>
            <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{current.description}</p>
          </div>

          {/* Checklist visual (apenas no step 1 e 2) */}
          {step === 0 && (
            <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-4 mb-6 space-y-2">
              {[
                { label: "Perfil atualizado", done: true },
                { label: "Nome do cliente na obra", done: false },
                { label: "Contrato e valor acordado", done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${item.done ? "text-emerald-400" : "text-slate-600"}`}
                  />
                  <span className={`text-sm ${item.done ? "text-white" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-4 mb-6 space-y-2">
              {[
                { label: "Perfil atualizado", done: true },
                { label: "Nome do cliente na obra", done: false },
                { label: "Contrato e valor acordado", done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${item.done ? "text-emerald-400" : "text-slate-600"}`}
                  />
                  <span className={`text-sm ${item.done ? "text-white" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-xl p-4 mb-6 space-y-2">
              {[
                { label: "Perfil atualizado", done: true },
                { label: "Nome do cliente na obra", done: true },
                { label: "Contrato e valor acordado", done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${item.done ? "text-emerald-400" : "text-slate-600"}`}
                  />
                  <span className={`text-sm ${item.done ? "text-white" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            {!current.actionRoute && (
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="flex-1 text-gray-400 hover:text-white border border-white/[0.1] hover:bg-[#1f2228]"
              >
                Pular
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`${current.actionRoute ? "w-full" : "flex-1"} bg-[#0B3064] hover:bg-[#082551] text-white flex items-center justify-center gap-2`}
            >
              {current.actionLabel}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
