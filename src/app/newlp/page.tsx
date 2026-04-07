"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  ArrowRight,
  Shield,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Send,
  Mail,
  Phone,
  User,
  Monitor,
  Building2,
  FileText,
  Camera,
  Smartphone,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
  MapPin,
  Wallet,
  PiggyBank,
  Home,
  Star,
  Pencil,
  Trash2,
  Plus,
  HandCoins,
} from "lucide-react"
import { BGPattern } from "@/components/ui/bg-pattern"

// ─── Data ────────────────────────────────────────────────────────────────────

const testimonials = [
  {
    quote:
      "Em três meses de obra, economizei mais de R$ 12 mil só porque o OBREASY me alertou sobre gastos fora do previsto. Consegui negociar melhor com fornecedores tendo os números na palma da mão.",
    name: "Carlos Silva",
    details: "Construtor • São Paulo",
    initial: "C",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    quote:
      "Uso em todos os meus projetos agora. Meus clientes adoram receber relatórios transparentes e atualizados. Aumentou muito a confiança e reduziu retrabalho de comunicação.",
    name: "Marina Costa",
    details: "Arquiteta • Rio de Janeiro",
    initial: "M",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    quote:
      "Antes eu passava horas no fim de semana organizando notas fiscais e atualizando planilhas. Hoje em dia, registro tudo pelo celular em segundos. Sobra mais tempo para focar no que importa: a obra.",
    name: "Roberto Almeida",
    details: "Dono de construtora • Belo Horizonte",
    initial: "R",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
  },
  {
    quote:
      "A visão de custo por m² me ajudou a perceber onde estava gastando demais. Renegociei dois contratos e fiquei dentro do orçamento pela primeira vez em anos.",
    name: "Ana Paula Ferreira",
    details: "Engenheira civil • Curitiba",
    initial: "A",
    avatar: "https://randomuser.me/api/portraits/women/28.jpg",
  },
]

const features = [
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Controle financeiro",
    description:
      "Registro de despesas por categoria, comparação orçado x realizado, histórico completo de pagamentos.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Gestão de profissionais",
    description:
      "Cadastro de pedreiros, eletricistas e outros. Controle de pagamentos e contratos.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Relatórios em PDF",
    description:
      "PDF exportável com resumo financeiro e gráficos de distribuição de gastos.",
  },
  {
    icon: <Camera className="w-6 h-6" />,
    title: "Diário de Fotos da Obra",
    description:
      "Registre o progresso com fotos por etapa. Histórico visual do avanço da obra.",
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Acesso multiplataforma",
    description:
      "App mobile Android e iOS. Versão web para computador e tablet.",
  },
  {
    icon: <Monitor className="w-6 h-6" />,
    title: "Suporte especializado",
    description:
      "Suporte com engenheiros e arquitetos para te orientar nas decisões técnicas e financeiras.",
  },
]

const painPoints = [
  {
    number: "01",
    icon: <AlertCircle className="w-6 h-6" />,
    title: "Saldo invisível",
    description:
      "Você só descobre o saldo real quando junta todos os recibos no fim de semana — e os números nunca batem.",
  },
  {
    number: "02",
    icon: <Clock className="w-6 h-6" />,
    title: "Pagamentos perdidos",
    description:
      "Não sabe quais fornecedores foram pagos, quais estão pendentes e o que vence essa semana.",
  },
  {
    number: "03",
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Registros lentos",
    description:
      "Registrar uma despesa exige abrir planilha, localizar a aba certa, digitar, salvar e torcer para não esquecer nada.",
  },
  {
    number: "04",
    icon: <DollarSign className="w-6 h-6" />,
    title: "Orçamento estourado",
    description:
      "O orçamento estoura silenciosamente. Você só percebe quando o dinheiro acabou.",
  },
]

const planProfessional = [
  "Obras ilimitadas",
  "Controle financeiro completo",
  "Gestão de profissionais",
  "Relatórios em PDF",
  "Alertas de orçamento",
  "Acesso mobile e web",
  "Visão consolidada de todas as obras",
  "Controle de recebimentos de clientes",
]

const planEssential = [
  "Para 1 obra",
  "Controle financeiro completo",
  "Gestão de profissionais",
  "Relatórios em PDF",
  "Alertas de orçamento",
  "Acesso mobile e web",
]

const faqItems = [
  {
    question: "Como funciona o teste grátis?",
    answer:
      "Você tem acesso completo ao plano escolhido por 7 dias sem pagar nada. Não pedimos cartão de crédito para começar. Após os 7 dias, você decide se quer continuar.",
  },
  {
    question: "Preciso instalar algum programa?",
    answer:
      "Não. O Obreasy funciona diretamente no navegador (web). Você pode acessar pelo celular, tablet ou computador a qualquer momento. Se preferir, também é possível adicionar o Obreasy à tela inicial do celular e utilizá-lo como um aplicativo.",
  },
  {
    question: "Como baixar o aplicativo no Android?",
    answer:
      "Acesse o Obreasy pelo navegador do seu celular Android. Depois toque no menu do navegador (três pontos no canto superior) e selecione \"Adicionar à tela inicial\". Assim o Obreasy ficará disponível no seu celular como um aplicativo.",
  },
  {
    question: "Como baixar o aplicativo no iOS (iPhone)?",
    answer:
      "Acesse o Obreasy pelo navegador Safari no seu iPhone. Depois toque no botão de compartilhar e selecione a opção \"Adicionar à tela de início\". Assim você poderá acessar o Obreasy diretamente da tela inicial do seu celular, como um aplicativo.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim, sem burocracia. Você cancela a qualquer momento diretamente pelo painel, sem precisar falar com ninguém. Não há fidelidade mínima.",
  },
  {
    question: "Quantas obras posso cadastrar?",
    answer:
      "No plano Essencial, você gerencia 1 obra. No plano Profissional, você gerencia obras ilimitadas e ainda tem visão consolidada de todas elas em um único painel.",
  },
  {
    question: "Os dados da minha obra são seguros?",
    answer:
      "Sim. Todos os dados são criptografados e armazenados em servidores seguros. Apenas você tem acesso às informações da sua obra.",
  },
  {
    question: "Posso exportar os dados da obra?",
    answer:
      "Sim. Você pode exportar relatórios em PDF com resumo financeiro, gráficos de distribuição de gastos e histórico completo de pagamentos.",
  },
  {
    question: "O suporte é incluso no plano?",
    answer:
      "Sim. Todos os planos incluem suporte especializado com engenheiros e arquitetos para te orientar nas decisões técnicas e financeiras da sua obra.",
  },
  {
    question: "Como funciona a cobrança?",
    answer:
      "A assinatura pode ser mensal ou anual. No plano mensal, a cobrança é feita automaticamente no cartão de crédito. No plano anual, você pode pagar por cartão de crédito ou Pix, com desconto em relação ao plano mensal. Você pode cancelar a qualquer momento.",
  },
]

// ─── Components ──────────────────────────────────────────────────────────────

function StickySection({
  id,
  zIndex,
  className,
  style,
  children,
}: {
  id?: string
  zIndex: number
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div id={id} className={className} style={style}>
      {children}
    </div>
  )
}

function AnnouncementBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="relative bg-[#0B3064]/20 border-b border-[#0B3064]/40 py-2.5 px-10 text-center">
      <p className="text-sm text-white leading-snug inline-flex items-center justify-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7eaaee] opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7eaaee]" />
        </span>
        <span className="font-semibold">Até 20% de economia na sua obra</span>
        <span className="text-white/50 mx-1 hidden sm:inline">·</span>
        <span className="text-white/65 hidden sm:inline">controle efetivo pode reduzir até 20% do custo total.</span>
      </p>
      <button
        onClick={onClose}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
        aria-label="Fechar aviso"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/[0.08] rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left text-[#F2F2F2] font-medium hover:bg-white/[0.03] transition-colors"
      >
        <span>{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-[#999999] flex-shrink-0 ml-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-[#999999] text-base leading-relaxed border-t border-white/[0.08]">
          <p className="pt-4">{answer}</p>
        </div>
      )}
    </div>
  )
}

const newLPScreenshots = [
  { label: "Dashboard geral", src: "https://blietvjzchjrzbmkitha.supabase.co/storage/v1/object/public/images/Captura%20de%20tela%202026-03-11%20194406.png" },
  { label: "Minhas Obras", src: "https://blietvjzchjrzbmkitha.supabase.co/storage/v1/object/public/images/Captura%20de%20tela%202026-03-11%20194502.png" },
  { label: "Gestão de Profissionais", src: "https://blietvjzchjrzbmkitha.supabase.co/storage/v1/object/public/images/Captura%20de%20tela%202026-03-11%20194532.png" },
]

function NewLPCarousel() {
  const [index, setIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const total = newLPScreenshots.length

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % total), 1800)
    return () => clearInterval(t)
  }, [total])

  const tx = isMobile ? "72%" : "62%"

  function getStyle(i: number): React.CSSProperties {
    const diff = ((i - index + total) % total + total) % total
    const pos = diff === 0 ? 0 : diff === 1 ? 1 : diff === total - 1 ? -1 : 2
    if (pos === 0) {
      return { transform: "translateX(0%) scale(1) rotateY(0deg)", zIndex: 10, opacity: 1, filter: "brightness(1)" }
    }
    if (pos === 1) {
      return { transform: `translateX(${tx}) scale(0.78) rotateY(-22deg)`, zIndex: 5, opacity: 0.55, filter: "brightness(0.6)" }
    }
    if (pos === -1) {
      return { transform: `translateX(-${tx}) scale(0.78) rotateY(22deg)`, zIndex: 5, opacity: 0.55, filter: "brightness(0.6)" }
    }
    return { transform: "translateX(0%) scale(0.6)", zIndex: 0, opacity: 0, pointerEvents: "none" }
  }

  return (
    <div>
      <div style={{ perspective: "1000px", position: "relative", height: isMobile ? "clamp(200px, 52vw, 280px)" : "clamp(200px, 30vw, 340px)", overflow: "visible" }}>
        {newLPScreenshots.map((img, i) => {
          const cardW = isMobile ? "92%" : "70%"
          const cardML = isMobile ? "-46%" : "-35%"
          return (
          <div
            key={i}
            onClick={() => setIndex(i)}
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: cardW,
              marginLeft: cardML,
              cursor: "pointer",
              transition: "transform 500ms cubic-bezier(0.4,0,0.2,1), opacity 500ms ease, filter 500ms ease",
              transformStyle: "preserve-3d",
              ...getStyle(i),
            }}
          >
            <div style={{
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
              aspectRatio: "16/9",
              width: "100%",
            }}>
              <img
                src={img.src}
                alt={img.label}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          </div>
          )
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "20px" }}>
        {newLPScreenshots.map((_, i) => (
          <div key={i} onClick={() => setIndex(i)} style={{ height: "6px", width: i === index ? "14px" : "6px", borderRadius: "9999px", backgroundColor: i === index ? "#ffffff" : "rgba(255,255,255,0.3)", transition: "all 300ms ease", cursor: "pointer", flexShrink: 0 }} />
        ))}
      </div>
    </div>
  )
}

// ─── Testimonials Carousel ────────────────────────────────────────────────────

function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % testimonials.length)
    }, 5000)
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const prev = () => {
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length)
    resetTimer()
  }

  const next = () => {
    setCurrent((c) => (c + 1) % testimonials.length)
    resetTimer()
  }

  const touchStartX = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    setDragOffset(dx)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    setIsDragging(false)
    setDragOffset(0)
    if (Math.abs(dx) > 50) {
      dx < 0 ? next() : prev()
    }
    touchStartX.current = null
  }

  const t = testimonials[current]

  return (
    <div className="relative max-w-2xl mx-auto overflow-hidden">
      {/* Card */}
      <div
        className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 flex flex-col gap-5 min-h-[220px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? "none" : "transform 300ms ease",
          opacity: isDragging ? 1 - Math.abs(dragOffset) / 300 : 1,
          cursor: "grab",
        }}
      >
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-[#7eaaee] text-base">★</span>
          ))}
        </div>
        <p className="text-[#F2F2F2] text-base leading-relaxed flex-1">"{t.quote}"</p>
        <div className="flex items-center gap-3 mt-auto">
          <img
            src={t.avatar}
            alt={t.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div>
            <p className="text-sm font-semibold text-[#F2F2F2]">{t.name}</p>
            <p className="text-xs text-[#999999]">{t.details}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <div className="flex gap-1.5 sm:gap-2">
          {testimonials.map((_, i) => (
            <div
              key={i}
              onClick={() => { setCurrent(i); resetTimer() }}
              style={{
                borderRadius: "9999px",
                cursor: "pointer",
                transition: "all 300ms",
                width: i === current ? (isMobile ? "10px" : "20px") : (isMobile ? "5px" : "8px"),
                height: isMobile ? "5px" : "8px",
                backgroundColor: i === current ? "#0B3064" : "rgba(255,255,255,0.2)",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewLPPage() {
  const router = useRouter()
  const [showBar, setShowBar] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [formSent, setFormSent] = useState(false)
  const [enviandoContato, setEnviandoContato] = useState(false)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleCTA = () => router.push("/cadastro")

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviandoContato(true)
    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: contactForm.name,
          email: contactForm.email,
          telefone: contactForm.phone,
          mensagem: contactForm.message,
        }),
      })
      if (!res.ok) throw new Error()
      setFormSent(true)
    } catch {
      alert("Erro ao enviar mensagem. Tente novamente.")
    } finally {
      setEnviandoContato(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#141414] text-[#F2F2F2]">

      {/* ── Header ── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-[#141414]/95 backdrop-blur-sm border-b border-[#0B3064]/40 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            : "bg-[#141414]/95 backdrop-blur-sm border-b border-[#0B3064]/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <img
              src="https://blietvjzchjrzbmkitha.supabase.co/storage/v1/object/public/images/icon.png"
              alt="OBREASY"
              className="w-8 h-8 rounded-md object-contain"
            />
            <span className="font-bold text-lg tracking-tight text-[#F2F2F2]">
              OBREASY
            </span>
          </a>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[#999999] hover:text-[#F2F2F2] transition-colors">
              Funcionalidades
            </a>
            <a href="#plans" className="text-sm text-[#999999] hover:text-[#F2F2F2] transition-colors">
              Preços
            </a>
            <a href="#faq" className="text-sm text-[#999999] hover:text-[#F2F2F2] transition-colors">
              FAQ
            </a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[#F2F2F2] border border-white/20 rounded-md hover:border-white/40 hover:bg-white/5 transition-all"
            >
              Entrar
            </a>
            <button
              onClick={handleCTA}
              className="hidden sm:block px-4 py-2 text-sm font-semibold rounded-md bg-[#0B3064] text-white hover:bg-[#0a2a56] transition-colors"
            >
              Comece grátis por 7 dias
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <StickySection zIndex={1} className="relative bg-[#141414] pt-10 pb-20 sm:pt-12 sm:pb-28" style={{'--background': 'white'} as React.CSSProperties}>
        <BGPattern variant="grid" mask="fade-y" fill="rgba(255,255,255,0.015)" size={32} style={{ zIndex: 0 }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-[1]">
          {/* Badge — centralizado */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.04] text-xs text-[#999999] font-medium">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              Para donos de obra, construtores e arquitetos
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight text-[#F2F2F2] mb-8 text-center">
            Controle sua obra sem planilhas{" "}
            <span className="text-[#7eaaee]">confusas.</span>
          </h1>

          {/* Parágrafos — centralizados */}
          <p className="text-base sm:text-lg text-[#999999] mb-4 max-w-2xl mx-auto text-center">
            Registre despesas pelo celular, acompanhe o orçamento em tempo real e evite gastos desnecessários.
          </p>
          <p className="text-sm font-semibold text-[#F2F2F2] mb-10 max-w-xl mx-auto text-center">
            Para donos de obra, construtores e arquitetos que querem ter visibilidade financeira sem complicação.
          </p>

          {/* Buttons — centralizados */}
          <div className="flex flex-row gap-3 mb-5 justify-center items-center">
            <button
              onClick={handleCTA}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-3 sm:px-8 sm:py-4 rounded-md bg-[#0B3064] text-white font-bold text-sm sm:text-base whitespace-nowrap hover:bg-[#0a2a56] transition-colors shadow-lg shadow-[#0B3064]/30"
            >
              Testar grátis
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-3 sm:px-8 sm:py-4 rounded-md border border-white/20 text-[#F2F2F2] font-semibold text-sm sm:text-base whitespace-nowrap hover:bg-white/[0.07] hover:border-white/30 transition-colors"
            >
              Ver demonstração
            </button>
          </div>

          {/* Trust — centralizado */}
          <div className="flex flex-wrap items-center justify-center text-center gap-x-3 gap-y-1 mb-8 text-sm text-[#999999] tracking-wide w-full max-w-3xl mx-auto">
            <span className="whitespace-nowrap">Sem cartão de crédito</span>
            <span className="text-[#999999]/40">•</span>
            <span className="whitespace-nowrap">Sem compromisso</span>
            <span className="whitespace-nowrap">Cancele quando quiser</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#999999]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0B3064]" />
              Teste grátis por 7 dias
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0B3064]" />
              100% seguro
            </div>
          </div>

          {/* Bloco informativo 20% */}
          <div className="mt-10 max-w-xl mx-auto bg-[#0B3064]/25 border border-[#7eaaee]/30 rounded-xl px-6 py-5 text-center shadow-[0_0_24px_rgba(11,48,100,0.5)]">
            <p className="text-base font-semibold text-white mb-1">Até 20% de economia na sua obra</p>
            <p className="text-sm text-[#999999] leading-relaxed">
              Estudos indicam que, com um controle financeiro adequado da obra, é possível economizar até{" "}
              <span className="text-white font-medium">20% no custo total</span>, evitando desperdícios,
              retrabalho e compras desnecessárias.
            </p>
          </div>
        </div>
      </StickySection>

      {/* ── Veja como funciona ── */}
      <StickySection id="demo" zIndex={2} className="relative bg-[#1c1c1c] py-10 md:py-20 px-4 md:px-6" style={{'--background': 'white', boxShadow: '0 -6px 24px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        <div className="absolute inset-x-0 top-0 h-10 pointer-events-none z-10" style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)'}} />
        <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none z-10" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)'}} />
        <BGPattern variant="grid" mask="fade-y" fill="rgba(255,255,255,0.012)" size={32} style={{ zIndex: 0 }} />
        <div className="max-w-[1100px] mx-auto relative z-[1]">
          <div className="mb-10 md:mb-16">
            <p className="text-xs font-bold text-[#7eaaee] uppercase tracking-widest mb-4">Como funciona</p>
            <h2 className="text-3xl md:text-5xl font-black text-[#F2F2F2] mb-5 max-w-2xl">
              Veja como funciona o controle da sua obra no Obreasy
            </h2>
            <p className="text-lg md:text-xl text-[#999999] font-light max-w-[620px]">
              Acompanhe gastos, profissionais, recebimentos e o andamento da obra em tempo real.
            </p>
          </div>

          <div className="relative w-full">
            <div className="overflow-hidden rounded-t-md rounded-b-2xl">
              <NewLPCarousel />
            </div>

            {/* Bullet points */}
            <ul className="mt-6 space-y-5">
              {[
                "Visualize todos os gastos da obra",
                "Acompanhe o custo por m² automaticamente",
                "Controle profissionais e pagamentos",
                "Tenha visão clara do andamento da obra",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#0B3064]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#7eaaee]" strokeWidth={2.5} />
                  </div>
                  <span className="text-[#F2F2F2] text-base md:text-lg font-light leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </StickySection>

      {/* ── Como Funciona ── */}
      <StickySection id="how" zIndex={3} className="relative bg-[#141414] py-14 sm:py-20" style={{'--background': 'white', boxShadow: '0 -6px 24px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        <BGPattern variant="grid" mask="fade-y" fill="rgba(255,255,255,0.015)" size={32} style={{ zIndex: 0 }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-[1]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="flex flex-col items-start">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F2F2F2] mb-6 leading-tight mt-4 sm:-mt-16">
                E não é só isso...
              </h2>
              <ul className="flex flex-col gap-5">
                {[
                  "Registre pagamentos aos profissionais diretamente pelo aplicativo",
                  "Acompanhe quanto já foi pago e quanto ainda falta pagar em cada serviço",
                  "Engenheiros, arquitetos e construtores podem controlar os recebimentos de seus clientes",
                  "Gere relatórios claros para acompanhar a evolução financeira da obra",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-left">
                    <CheckCircle2 className="w-5 h-5 text-[#7eaaee] flex-shrink-0 mt-0.5" />
                    <span className="text-[#F2F2F2] text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — obra card (replica exata do app) */}
            <div className="flex flex-col gap-14">
            <div className="p-6 bg-slate-800/50 border border-slate-700/30 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-2xl flex flex-col pointer-events-none select-none">
              {/* Header */}
              <div className="flex items-start gap-3 mb-6 pb-6 border-b border-slate-700/50">
                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h2 className="text-lg font-bold text-white leading-tight flex-1">Residência Família Oliveira</h2>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button className="p-0.5 rounded text-gray-300"><Star className="w-4 h-4 fill-current" /></button>
                      <button className="p-0.5 rounded text-gray-400"><Pencil className="w-4 h-4" /></button>
                      <button className="p-0.5 rounded text-gray-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-blue-400 font-medium mb-1">Cliente: João Oliveira</p>
                  <p className="text-xs text-gray-400">Construção</p>
                  <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <p className="text-xs">São Paulo/SP</p>
                  </div>
                </div>
              </div>

              {/* 6 métricas */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: <TrendingUp className="w-3 h-3 text-gray-300" />, label: "Orçamento", value: "R$ 320.000" },
                  { icon: <Wallet className="w-3 h-3 text-gray-300" />, label: "Total Gasto", value: "R$ 187.400" },
                  { icon: <PiggyBank className="w-3 h-3 text-gray-300" />, label: "Saldo", value: "R$ 132.600" },
                  { icon: <Home className="w-3 h-3 text-gray-300" />, label: "Custo/m²", value: "R$ 1.041" },
                  { icon: <Users className="w-3 h-3 text-gray-300" />, label: "Mão de Obra", value: "R$ 68.000" },
                  { icon: <Building2 className="w-3 h-3 text-gray-300" />, label: "Materiais/Outros", value: "R$ 119.400" },
                ].map((m) => (
                  <div key={m.label} className="bg-slate-700/20 rounded-lg p-2.5 border border-slate-600/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 bg-slate-700/50 rounded flex items-center justify-center flex-shrink-0">{m.icon}</div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-tight truncate min-w-0">{m.label}</p>
                    </div>
                    <p className="text-sm font-bold text-white leading-none">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex gap-2">
                  <button className="flex-1 bg-white/10 hover:bg-white/15 text-white text-xs px-3 h-9 rounded-md flex items-center justify-center gap-1 font-medium transition-colors border border-white/10">
                    <Plus className="w-3.5 h-3.5" /> Nova Despesa
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/15 text-white text-xs px-3 h-9 rounded-md flex items-center justify-center gap-1 font-medium transition-colors border border-white/10">
                    <Plus className="w-3.5 h-3.5" /> Recebimento
                  </button>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-white/10 hover:bg-white/15 text-white text-xs px-3 h-9 rounded-md flex items-center justify-center gap-1 font-medium transition-colors border border-white/10 whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Novo Pagamento
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/15 text-white text-xs px-3 h-9 rounded-md flex items-center justify-center gap-1 font-medium transition-colors border border-white/10">
                    <FileText className="w-3.5 h-3.5" /> Relatório
                  </button>
                </div>
              </div>

              {/* Recebimentos do cliente */}
              <div className="pt-3 border-t border-slate-700/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <HandCoins className="w-3.5 h-3.5 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recebimentos do Cliente</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800/30 rounded p-2">
                    <p className="text-[9px] text-gray-500 mb-0.5">Contratado</p>
                    <p className="text-xs font-bold text-gray-300">R$ 295.000</p>
                  </div>
                  <div className="bg-slate-800/30 rounded p-2">
                    <p className="text-[9px] text-gray-500 mb-0.5">Recebido</p>
                    <p className="text-xs font-bold text-green-400">R$ 170.000</p>
                  </div>
                  <div className="bg-slate-800/30 rounded p-2">
                    <p className="text-[9px] text-gray-500 mb-0.5">A Receber</p>
                    <p className="text-xs font-bold text-blue-400">R$ 125.000</p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleCTA}
              className="w-3/4 mx-auto block py-4 rounded-md bg-[#0B3064] text-white font-semibold text-base hover:bg-[#0a2a56] transition-colors"
              style={{ animation: "btn-scale-pulse 2s ease-in-out infinite" }}
              onMouseEnter={e => (e.currentTarget.style.animation = "none")}
              onMouseLeave={e => (e.currentTarget.style.animation = "btn-scale-pulse 2s ease-in-out infinite")}
            >
              Testar grátis por 7 dias
            </button>
            </div>
          </div>
        </div>
      </StickySection>

      {/* ── Funcionalidades ── */}
      <StickySection id="features" zIndex={4} className="relative bg-[#1c1c1c] py-14 sm:py-20" style={{'--background': 'white', boxShadow: '0 -6px 24px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        <div className="absolute inset-x-0 top-0 h-10 pointer-events-none z-10" style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)'}} />
        <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none z-10" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)'}} />
        <BGPattern variant="grid" mask="fade-y" fill="rgba(255,255,255,0.012)" size={32} style={{ zIndex: 0 }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-[1]">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F2F2F2] mb-4">
              Funcionalidades incluídas
            </h2>
            <p className="text-base sm:text-lg text-[#999999] max-w-2xl mx-auto">
              Tudo o que você precisa para gerenciar sua obra em um só lugar.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 flex flex-col gap-5 hover:bg-white/[0.05] transition-colors"
              >
                <div className="w-11 h-11 rounded-md bg-[#0B3064]/30 flex items-center justify-center text-[#7eaaee]">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-[#F2F2F2]">{feat.title}</h3>
                <p className="text-sm text-[#999999] leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </StickySection>

      {/* ── Depoimentos ── */}
      <StickySection zIndex={5} className="relative bg-[#141414] py-14 sm:py-20" style={{'--background': 'white', boxShadow: '0 -6px 24px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        <BGPattern variant="grid" mask="fade-y" fill="rgba(255,255,255,0.015)" size={32} style={{ zIndex: 0 }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-[1]">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F2F2F2] mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-base sm:text-lg text-[#999999]">
              Histórias reais de quem transformou a gestão da obra
            </p>
          </div>
          <TestimonialsCarousel />
        </div>
      </StickySection>

      {/* ── Planos ── */}
      <StickySection id="plans" zIndex={6} className="relative bg-[#1c1c1c] py-14 sm:py-20" style={{'--background': 'white', boxShadow: '0 -6px 24px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        <div className="absolute inset-x-0 top-0 h-10 pointer-events-none z-10" style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)'}} />
        <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none z-10" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)'}} />
        <BGPattern variant="grid" mask="fade-y" fill="rgba(255,255,255,0.012)" size={32} style={{ zIndex: 0 }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-[1]">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F2F2F2] mb-3">
              Escolha seu plano
            </h2>
            <p className="text-base text-[#999999] mb-4">
              Cancele quando quiser • Sem permanência mínima
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B3064]/10 border border-[#51ffa1]/20 text-[#7eaaee] text-sm font-medium">
              <Shield className="w-4 h-4" />
              7 dias de garantia para experimentar
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto items-start">
            {/* Plano Profissional */}
            <div className="rounded-2xl border-2 border-[#0B3064] bg-white/[0.03] p-7 flex flex-col relative py-12" style={{ boxShadow: "0 0 18px 2px rgba(11,48,100,0.25), 0 0 40px 4px rgba(11,48,100,0.12)" }}>
              <div className="absolute -top-3.5 left-6">
                <span className="px-3 py-1 rounded-full bg-[#0B3064] text-white text-xs font-bold">
                  Recomendado
                </span>
              </div>
              <div className="mb-6 mt-2">
                <p className="text-xs text-[#999999] mb-1">Para múltiplas obras</p>
                <p className="text-3xl font-bold text-[#F2F2F2]">
                  R$ 49,90
                  <span className="text-base font-normal text-[#999999]">/mês</span>
                </p>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {planProfessional.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#7eaaee] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#F2F2F2]">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleCTA}
                className="w-full py-3 rounded-md bg-[#0B3064] text-white font-semibold text-sm hover:bg-[#0a2a56] transition-colors mb-2"
              >
                Testar grátis por 7 dias
              </button>
              <p className="text-xs text-center text-[#999999]">
                Sem compromisso. Cancele quando quiser.
              </p>
            </div>

            {/* Plano Essencial */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 flex flex-col">
              <div className="mb-6">
                <p className="text-xs text-[#999999] mb-1">Perfeito para 1 obra</p>
                <p className="text-3xl font-bold text-[#F2F2F2]">
                  R$ 29,90
                  <span className="text-base font-normal text-[#999999]">/mês</span>
                </p>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {planEssential.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#7eaaee] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#F2F2F2]">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleCTA}
                className="w-full py-3 rounded-md border border-white/[0.08] text-[#F2F2F2] font-semibold text-sm hover:bg-white/[0.05] transition-colors mb-2"
              >
                Testar grátis por 7 dias
              </button>
              <p className="text-xs text-center text-[#999999]">
                Sem compromisso. Cancele quando quiser.
              </p>
            </div>
          </div>
        </div>
      </StickySection>

      {/* ── FAQ ── */}
      <StickySection id="faq" zIndex={7} className="relative bg-[#141414] py-14 sm:py-20" style={{'--background': 'white', boxShadow: '0 -6px 24px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        <BGPattern variant="grid" mask="fade-y" fill="rgba(255,255,255,0.015)" size={32} style={{ zIndex: 0 }} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-[1]">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F2F2F2] mb-4">
              Perguntas frequentes
            </h2>
            <p className="text-base sm:text-lg text-[#999999]">
              Tire suas dúvidas sobre o OBREASY
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {faqItems.map((item) => (
              <FAQItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </StickySection>

      {/* ── CTA Final ── */}
      <StickySection zIndex={8} className="relative bg-[#141414] py-14 sm:py-20" style={{'--background': 'white', boxShadow: '0 -6px 24px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        <BGPattern variant="grid" mask="fade-y" fill="rgba(255,255,255,0.015)" size={32} style={{ zIndex: 0 }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-[1]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#51ffa1]/20 bg-[#0B3064]/5 text-[#7eaaee] text-sm font-medium mb-6">
            Comece hoje mesmo • 7 dias de garantia
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F2F2F2] mb-4 max-w-2xl mx-auto">
            Pronto para ter controle total da sua obra?
          </h2>
          <p className="text-base sm:text-lg text-[#999999] mb-8 max-w-xl mx-auto">
            Comece agora e tenha visibilidade completa do seu orçamento em minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <button
              onClick={handleCTA}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md bg-[#0B3064] text-white font-semibold text-base hover:bg-[#0a2a56] transition-colors"
            >
              Testar grátis por 7 dias
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-[#999999]/60 mb-10">
            Sem compromisso. Cancele quando quiser.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#999999]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#7eaaee]" />
              7 dias de garantia
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7eaaee]" />
              Cancele quando quiser
            </div>
          </div>
        </div>
      </StickySection>

      {/* ── Contato ── */}
      <StickySection id="contact" zIndex={9} className="relative bg-[#1c1c1c] py-14 sm:py-20" style={{'--background': 'white', boxShadow: '0 -6px 24px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        <div className="absolute inset-x-0 top-0 h-10 pointer-events-none z-10" style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)'}} />
        <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none z-10" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)'}} />
        <BGPattern variant="grid" mask="fade-y" fill="rgba(255,255,255,0.012)" size={32} style={{ zIndex: 0 }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-[1]">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#F2F2F2] mb-4">
                Fale conosco
              </h2>
              <p className="text-base sm:text-lg text-[#999999]">
                Ficou com dúvida? Envie uma mensagem e retornamos em até 24h úteis.
              </p>
            </div>

            {formSent ? (
              <div className="rounded-2xl border border-[#51ffa1]/20 bg-[#0B3064]/5 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#7eaaee] mx-auto mb-4" />
                <p className="text-lg font-semibold text-[#F2F2F2] mb-2">Mensagem enviada!</p>
                <p className="text-[#999999]">Retornaremos em até 24h úteis.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#F2F2F2] mb-2">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#999999]" /> Nome <span className="text-[#7eaaee]">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Seu nome"
                    className="w-full px-4 py-3 rounded-md border border-white/[0.08] bg-white/[0.03] text-[#F2F2F2] placeholder-[#999999]/50 text-sm outline-none focus:border-[#0B3064] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F2F2F2] mb-2">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#999999]" /> E-mail <span className="text-[#7eaaee]">*</span>
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-md border border-white/[0.08] bg-white/[0.03] text-[#F2F2F2] placeholder-[#999999]/50 text-sm outline-none focus:border-[#0B3064] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F2F2F2] mb-2">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#999999]" /> Telefone / WhatsApp
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 rounded-md border border-white/[0.08] bg-white/[0.03] text-[#F2F2F2] placeholder-[#999999]/50 text-sm outline-none focus:border-[#0B3064] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F2F2F2] mb-2">
                    Mensagem <span className="text-[#7eaaee]">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Descreva sua dúvida ou como podemos ajudar..."
                    className="w-full px-4 py-3 rounded-md border border-white/[0.08] bg-white/[0.03] text-[#F2F2F2] placeholder-[#999999]/50 text-sm outline-none focus:border-[#0B3064] transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={enviandoContato}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#0B3064] text-white font-semibold text-sm hover:bg-[#0a2a56] transition-colors mt-2 self-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviandoContato ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {enviandoContato ? "Enviando..." : "Enviar mensagem"}
                </button>
              </form>
            )}
          </div>
        </div>
      </StickySection>

      {/* ── Footer ── */}
      <StickySection zIndex={10} className="relative bg-[#1c1c1c] border-t border-white/[0.08] py-14" style={{boxShadow: '0 -6px 24px rgba(0,0,0,0.6)'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-10 mb-10">
            {/* Brand */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="https://blietvjzchjrzbmkitha.supabase.co/storage/v1/object/public/images/icon.png" alt="OBREASY" className="w-8 h-8 rounded-md object-cover" />
                <span className="font-bold text-lg text-[#F2F2F2]">OBREASY</span>
              </div>
              <p className="text-sm text-[#999999] leading-relaxed max-w-xs">
                Controle completo da sua obra, sem planilhas confusas. Gerencie orçamento, profissionais e materiais em um só lugar.
              </p>
            </div>

            {/* Produto + Empresa */}
            <div className="flex gap-10 items-start">
            <div style={{display:'flex', flexDirection:'column', gap:'8px', alignItems:'flex-start'}}>
              <span style={{fontSize:'14px', fontWeight:600, color:'#F2F2F2'}}>Produto</span>
              {["Funcionalidades", "Preços", "FAQ"].map((item) => (
                <a key={item} href="#" style={{fontSize:'14px', color:'#999999', textDecoration:'none', display:'block', padding:0, margin:0}}>{item}</a>
              ))}
            </div>

            {/* Empresa */}
            <div style={{display:'flex', flexDirection:'column', gap:'8px', alignItems:'flex-start'}}>
              <span style={{fontSize:'14px', fontWeight:600, color:'#F2F2F2'}}>Empresa</span>
              {["Sobre", "Depoimentos", "Contato"].map((item) => (
                <a key={item} href="#" style={{fontSize:'14px', color:'#999999', textDecoration:'none', display:'block', padding:0, margin:0}}>{item}</a>
              ))}
            </div>
            </div>
          </div>

          <div className="border-t border-white/[0.08] pt-6 text-center">
            <p className="text-xs text-[#999999]">
              © 2026 OBREASY. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </StickySection>
    </div>
  )
}
