"use client"

import { useState } from "react"
import { ArrowRight, ArrowLeft, CheckCircle2, Clock } from "lucide-react"
import Image from "next/image"

interface QuizData {
  etapaObra: string
  // Fluxo A - Já iniciou
  controleGastos?: string
  sabeGastos?: string
  preocupacaoObra?: string
  // Fluxo B - Ainda não iniciou
  evitarObra?: string
  orcamentoDefinido?: string
  acompanharGastos?: string
}

interface QuizProps {
  onClose: () => void
  onComplete: (data: QuizData) => void
}

export default function Quiz({ onClose, onComplete }: QuizProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [quizData, setQuizData] = useState<QuizData>({
    etapaObra: ""
  })
  const [showResults, setShowResults] = useState(false)
  const [fluxo, setFluxo] = useState<"A" | "B" | null>(null)

  const updateData = (field: keyof QuizData, value: string) => {
    setQuizData(prev => ({ ...prev, [field]: value }))
  }

  // Total de perguntas: 1 inicial + 3 do fluxo = 4 perguntas
  const totalSteps = 4
  const progress = ((currentStep + 1) / totalSteps) * 100

  const nextStep = () => {
    // Se é a primeira pergunta, determinar o fluxo
    if (currentStep === 0) {
      if (quizData.etapaObra === "Já iniciei a obra") {
        setFluxo("A")
      } else {
        setFluxo("B")
      }
      setCurrentStep(1) // Avança para próxima pergunta
      return
    }

    // Se está na última pergunta (step 3), mostrar resultado
    if (currentStep === 3) {
      setShowResults(true)
      return
    }

    // Caso contrário, avança normalmente
    setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      // Se voltar para step 0, resetar fluxo
      if (currentStep === 1) {
        setFluxo(null)
      }
    }
  }

  const canProceed = () => {
    if (currentStep === 0) return quizData.etapaObra !== ""
    
    if (fluxo === "A") {
      switch (currentStep) {
        case 1: return quizData.controleGastos !== undefined && quizData.controleGastos !== ""
        case 2: return quizData.sabeGastos !== undefined && quizData.sabeGastos !== ""
        case 3: return quizData.preocupacaoObra !== undefined && quizData.preocupacaoObra !== ""
        default: return false
      }
    }
    
    if (fluxo === "B") {
      switch (currentStep) {
        case 1: return quizData.evitarObra !== undefined && quizData.evitarObra !== ""
        case 2: return quizData.orcamentoDefinido !== undefined && quizData.orcamentoDefinido !== ""
        case 3: return quizData.acompanharGastos !== undefined && quizData.acompanharGastos !== ""
        default: return false
      }
    }
    
    return false
  }

  const handleCTA = () => {
    onComplete(quizData)
  }

  const renderQuestion = () => {
    // PERGUNTA 1 - TRIAGEM (comum a todos)
    if (currentStep === 0) {
      return {
        title: "Em que etapa sua obra está hoje?",
        options: [
          "Já iniciei a obra",
          "Vou iniciar em breve",
          "Ainda não iniciei, estou pesquisando e planejando",
          "Ainda não tenho data definida"
        ],
        field: "etapaObra" as keyof QuizData
      }
    }

    // FLUXO A - OBRA EM ANDAMENTO (3 perguntas)
    if (fluxo === "A") {
      switch (currentStep) {
        case 1:
          return {
            title: "Como você controla os gastos da sua obra hoje?",
            options: [
              "Anoto em caderno ou planilha",
              "Tento controlar, mas sempre me perco",
              "Não tenho controle estruturado",
              "Uso algum sistema/app"
            ],
            field: "controleGastos" as keyof QuizData
          }
        case 2:
          return {
            title: "Você sabe quanto já gastou na obra?",
            options: [
              "Sim, com clareza total",
              "Tenho uma noção aproximada",
              "Não sei ao certo"
            ],
            field: "sabeGastos" as keyof QuizData
          }
        case 3:
          return {
            title: "O que mais te preocupa na obra?",
            options: [
              "Gastar mais do que o planejado",
              "Falta de organização",
              "Pagamentos de profissionais",
              "Falta de visão geral dos custos"
            ],
            field: "preocupacaoObra" as keyof QuizData
          }
      }
    }

    // FLUXO B - OBRA NÃO INICIADA (3 perguntas)
    if (fluxo === "B") {
      switch (currentStep) {
        case 1:
          return {
            title: "O que mais quer evitar na sua obra?",
            options: [
              "Gastos fora do controle",
              "Atrasos no cronograma",
              "Conflitos com profissionais",
              "Falta de organização"
            ],
            field: "evitarObra" as keyof QuizData
          }
        case 2:
          return {
            title: "Já tem orçamento definido?",
            options: [
              "Sim, orçamento fechado",
              "Tenho uma estimativa",
              "Ainda estou levantando custos",
              "Não tenho orçamento"
            ],
            field: "orcamentoDefinido" as keyof QuizData
          }
        case 3:
          return {
            title: "Pretende acompanhar os gastos?",
            options: [
              "Sim, com bastante controle",
              "Quero tentar acompanhar",
              "Ainda não sei como fazer isso"
            ],
            field: "acompanharGastos" as keyof QuizData
          }
      }
    }

    return null
  }

  const question = renderQuestion()

  // TELA DE RESULTADO - COMPACTA E FOCADA EM CONVERSÃO
  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
          {/* Gradiente sutil no topo */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-50/50 to-transparent rounded-t-3xl pointer-events-none" />

          <div className="p-6 sm:p-8 relative z-10">
            {/* Ícone com animação pulse */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0B3064] rounded-full mb-4 shadow-lg animate-[pulse_3s_ease-in-out_infinite]">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              
              {/* Título principal - hierarquia forte, compacto */}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                Sem organização, obras costumam gerar gastos inesperados e atrasos
              </h2>
              
              {/* Subtítulo - reduzido visualmente */}
              <p className="text-base text-gray-600 leading-relaxed mb-4">
                Cada dia sem controle aumenta desperdícios e atrasos.
                Em poucos passos, você vê exatamente onde seu dinheiro está indo.
              </p>
            </div>

            {/* CTA principal - destaque máximo */}
            <div className="space-y-3 max-w-md mx-auto mb-4">
              <button
                onClick={handleCTA}
                className="w-full bg-[#0B3064] hover:bg-[#082551] text-white px-6 py-4 rounded-xl transition-all duration-300 font-bold text-base shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-700/40 flex items-center justify-center gap-2 hover:scale-[1.02] transform animate-[glow_4s_ease-in-out_infinite]"
              >
                👉 Quero controlar minha obra e economizar até 20%
              </button>
              
              {/* Micro-copy compacto - ícones + texto pequeno */}
              <div className="space-y-1.5 px-2">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0B3064]" />
                  <span>Leva menos de 2 minutos para começar</span>
                </p>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Você pode cancelar a qualquer momento</span>
                </p>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Sem planilhas. Tudo em um só lugar.</span>
                </p>
              </div>
            </div>

            {/* Frase de reforço - discreta */}
            <p className="text-center text-xs text-gray-400 mb-3 italic">
              Criado para quem quer controle real da obra e menos desperdício.
            </p>
            
            {/* Botão secundário - muito discreto */}
            <button
              onClick={onClose}
              className="w-full text-gray-400 hover:text-gray-500 px-4 py-1.5 transition-colors text-xs"
            >
              Voltar
            </button>
          </div>
        </div>

        {/* Keyframes para animação suave de glow */}
        <style jsx>{`
          @keyframes glow {
            0%, 100% {
              box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -4px rgba(37, 99, 235, 0.3);
            }
            50% {
              box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4), 0 8px 10px -6px rgba(37, 99, 235, 0.4);
            }
          }
        `}</style>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Logo OBREASY como marca d'água */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-2xl">
          <Image
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/65b95674-2df1-4ea5-a87c-c130e4cddfb8.png"
            alt=""
            width={600}
            height={600}
            className="opacity-[0.04] scale-125"
            style={{ filter: 'sepia(100%) saturate(300%) hue-rotate(180deg) brightness(0.6)' }}
          />
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8 sm:p-12 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm font-medium text-[#0B3064] mb-2">
              Veja sua obra com clareza em poucos passos
            </p>
            <p className="text-sm text-gray-500 mb-3">
              Pergunta {currentStep + 1} de {totalSteps}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {question.title}
            </h2>
          </div>

          {/* Options */}
          <div className="mb-10 space-y-3">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => updateData(question.field, option)}
                className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                  quizData[question.field] === option
                    ? "border-blue-600 bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{option}</span>
                  {quizData[question.field] === option && (
                    <div className="w-6 h-6 bg-[#0B3064] rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-all font-medium flex items-center gap-2 bg-white"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar
              </button>
            )}
            
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex-1 px-6 py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 ${
                canProceed()
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {currentStep === 3 ? "Ver resultado" : "Continuar"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-4 text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            Fechar quiz
          </button>
        </div>
      </div>
    </div>
  )
}
