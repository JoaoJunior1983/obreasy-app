"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, ArrowRight, Shield, X, ChevronDown, Send, Mail, Phone, User, Monitor } from "lucide-react"
import { HoverButton } from "@/components/ui/hover-button"
import { BeamsBackground } from "@/components/ui/beams-background"
import { AnimatedTooltip } from "@/components/ui/animated-tooltip"
import { FooterSection } from "@/components/ui/footer"

const testimonials = [
  {
    quote: "Em três meses de obra, economizei mais de R$ 12 mil só porque o OBREASY me alertou sobre gastos fora do previsto. Consegui negociar melhor com fornecedores tendo os números na palma da mão.",
    name: "Carlos Silva",
    details: "Construtor • São Paulo"
  },
  {
    quote: "Uso em todos os meus projetos agora. Meus clientes adoram receber relatórios transparentes e atualizados. Aumentou muito a confiança e reduziu retrabalho de comunicação.",
    name: "Marina Costa",
    details: "Arquiteta • Rio de Janeiro"
  },
  {
    quote: "Antes eu passava horas no fim de semana organizando notas fiscais e atualizando planilhas. Hoje em dia, registro tudo pelo celular em segundos. Sobra mais tempo para focar no que importa: a obra.",
    name: "Roberto Almeida",
    details: "Dono de construtora • Belo Horizonte"
  },
  {
    quote: "Estava construindo minha primeira casa e tinha medo de estourar o orçamento. Com o OBREASY, acompanhei cada centavo e terminei a obra dentro do planejado. Não precisei de nenhum empréstimo extra!",
    name: "Ana Paula Ferreira",
    details: "Dona de obra • Campinas"
  }
]

const appScreenshots = [
  { label: "Dashboard geral", src: "/screenshots/dashboard.png" },
  { label: "Minhas Obras", src: "/screenshots/obras.png" },
  { label: "Gestão de Profissionais", src: "/screenshots/profissionais.png" },
]

function AppScreenshotsCarousel() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % appScreenshots.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div>
      <div style={{ overflow: 'hidden', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            width: `${appScreenshots.length * 100}%`,
            transform: `translateX(-${index * (100 / appScreenshots.length)}%)`,
            transition: 'transform 500ms ease-in-out',
          }}
        >
          {appScreenshots.map((img, i) => (
            <div key={i} style={{ width: `${100 / appScreenshots.length}%`, flexShrink: 0 }}>
              <div className="rounded-xl border border-white/10 bg-[#1f2228] aspect-[16/9] w-full flex flex-col items-center justify-center gap-3 mx-1">
                {/* Substitua pelo print real: <img src={img.src} alt={img.label} className="w-full h-full object-cover rounded-xl" /> */}
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-[#ddd]/50" />
                </div>
                <span className="text-xs text-[#ddd]/40 font-light text-center px-3">{img.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
        {appScreenshots.map((_, i) => (
          <div
            key={i}
            onClick={() => setIndex(i)}
            style={{
              height: '6px',
              width: i === index ? '14px' : '6px',
              borderRadius: '9999px',
              backgroundColor: i === index ? '#ffffff' : 'rgba(255,255,255,0.3)',
              transition: 'all 300ms ease',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [testimonialIndex, setTestimonialIndex] = useState(0)

  // Formulário de contato
  const [contatoForm, setContatoForm] = useState({ nome: "", email: "", telefone: "", mensagem: "" })
  const [enviandoContato, setEnviandoContato] = useState(false)
  const [contatoEnviado, setContatoEnviado] = useState(false)

  const handleContatoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviandoContato(true)
    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contatoForm),
      })
      if (!res.ok) throw new Error()
      setContatoForm({ nome: "", email: "", telefone: "", mensagem: "" })
      setContatoEnviado(true)
      setTimeout(() => setContatoEnviado(false), 5000)
    } catch {
      alert("Erro ao enviar mensagem. Tente novamente.")
    } finally {
      setEnviandoContato(false)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex(prev => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleCTA = () => {
    document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Toast Economia */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-[#0d2b0d]/95 backdrop-blur border-b border-[#51ffa1]/20 px-4 py-2">
        <div className="max-w-[900px] mx-auto flex items-center justify-center gap-x-2 flex-wrap text-center">
          <span className="text-[#51ffa1] font-semibold text-xs md:text-sm whitespace-nowrap">Até 20% de economia na sua obra</span>
          <span className="text-[#ddd]/40 text-xs hidden md:inline">—</span>
          <span className="text-[#ddd]/50 text-xs font-light">Estudos indicam que um controle efetivo de custos pode gerar uma economia de até 20% no valor total da obra.</span>
        </div>
      </div>

      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 bg-[#0B3064]/95 backdrop-blur-lg border-b border-white/5 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/65b95674-2df1-4ea5-a87c-c130e4cddfb8.png"
              alt="OBREASY"
              width={36}
              height={36}
              className="w-9 h-9"
            />
            <span className="font-bold text-xl text-white tracking-tight">
              OBREASY
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm font-medium text-[#ddd] hover:text-white transition-colors">
              Funcionalidades
            </a>
            <a href="#precos" className="text-sm font-medium text-[#ddd] hover:text-white transition-colors">
              Preços
            </a>
            <a href="#faq" className="text-sm font-medium text-[#ddd] hover:text-white transition-colors">
              FAQ
            </a>
          </nav>
          <HoverButton
            onClick={() => router.push("/login")}
            className="text-sm font-bold text-white px-6 py-2.5 bg-white/10 hover:bg-white/20"
            style={{
              "--circle-start": "#51ffa1",
              "--circle-end": "#0B3064",
            } as React.CSSProperties}
          >
            Entrar
          </HoverButton>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <BeamsBackground intensity="medium">
          <div className="max-w-[1000px] mx-auto text-center relative z-10 pt-40 md:pt-36 pb-12 md:pb-16 px-4 md:px-6">
          <h1 className="text-[48px] md:text-[80px] leading-[1.1] font-black text-white mb-6 md:mb-8 tracking-tight">
            Controle sua obra sem{" "}
            <span className="text-[#0B3064]" style={{ textShadow: '0 0 20px rgba(11, 48, 100, 0.6), 0 0 40px rgba(11, 48, 100, 0.3)' }}>
              planilhas confusas
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#ddd] mb-6 md:mb-8 leading-[1.5] font-normal max-w-[700px] mx-auto">
            Registre despesas pelo celular, acompanhe o orçamento em tempo real e evite gastos desnecessários.
          </p>

          <p className="hidden md:block text-base md:text-lg text-[#ddd]/70 mb-8 md:mb-10 max-w-[600px] mx-auto font-light">
            Para donos de obra, construtores e arquitetos que querem ter visibilidade financeira sem complicação.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center mb-6 md:mb-12">
            <button
              onClick={handleCTA}
              className="group bg-[#0B3064] text-white px-10 md:px-12 py-4 md:py-5 rounded-lg hover:bg-[#082551] transition-all duration-200 font-bold text-base md:text-lg inline-flex items-center justify-center gap-3"
            >
              Testar grátis por 7 dias
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              className="border border-white/20 bg-[#ffffff14] backdrop-blur text-white px-10 md:px-12 py-4 md:py-5 rounded-lg hover:bg-[#ffffff20] transition-all duration-200 font-medium text-base md:text-lg"
            >
              Ver demonstração
            </button>
          </div>
          <p className="text-sm text-center text-[#ddd]/60 mt-3 font-light">Sem compromisso. Cancele quando quiser.</p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { icon: CheckCircle2, text: "Teste grátis por 7 dias" },
              { icon: Shield, text: "100% seguro" }
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[#ddd]">
                <badge.icon className="w-5 h-5 text-[#51ffa1]" strokeWidth={2} />
                <span className="text-sm md:text-base font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
        </BeamsBackground>
      </section>


      {/* Veja como funciona */}
      <section className="py-10 md:py-20 px-4 md:px-6 bg-[#0a0a0a]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-8 md:mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Veja como funciona o controle da sua obra no Obreasy
            </h2>
            <p className="text-lg md:text-xl text-[#ddd]/70 font-light max-w-[620px] mx-auto">
              Acompanhe gastos, profissionais, recebimentos e o andamento da obra em tempo real.
            </p>
          </div>

          <div className="relative w-full">
            {/* Imagens */}
            <div className="w-full">
              {/* Mobile: carrossel */}
              <div className="block md:hidden overflow-hidden rounded-xl">
                <AppScreenshotsCarousel />
              </div>
              {/* Desktop: lado a lado */}
              <div className="hidden md:grid grid-cols-3 gap-4">
                {[
                  { label: "Dashboard geral", src: "/screenshots/dashboard.png" },
                  { label: "Minhas Obras", src: "/screenshots/obras.png" },
                  { label: "Gestão de Profissionais", src: "/screenshots/profissionais.png" },
                ].map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-[#1f2228] aspect-[16/9] w-full flex flex-col items-center justify-center gap-3">
                    {/* Quando tiver o print real, substitua por: <img src={img.src} alt={img.label} className="w-full h-full object-cover" /> */}
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-[#ddd]/50" />
                    </div>
                    <span className="text-xs text-[#ddd]/40 font-light text-center px-3">{img.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bullet points */}
            <ul className="mt-6 space-y-4">
              {[
                "Visualize todos os gastos da obra",
                "Acompanhe o custo por m² automaticamente",
                "Controle profissionais e pagamentos",
                "Tenha visão clara do andamento da obra",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#51ffa1]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#51ffa1]" strokeWidth={2.5} />
                  </div>
                  <span className="text-[#ddd] text-base md:text-lg font-light leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Prova Social */}
      <section className="pt-4 md:pt-12 pb-6 md:pb-16 px-4 md:px-6 bg-gradient-to-b from-[#0a0a0a] via-[#13151a] to-[#13151a] relative">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-6 md:mb-12">
            <AnimatedTooltip
              className="hidden md:flex mb-6"
              items={[
                {
                  id: 1,
                  name: "Carlos Silva",
                  designation: "Dono de obra residencial",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
                },
                {
                  id: 2,
                  name: "Marina Costa",
                  designation: "Arquiteta",
                  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
                },
                {
                  id: 3,
                  name: "Roberto Almeida",
                  designation: "Construtor",
                  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
                },
                {
                  id: 4,
                  name: "Ana Paula",
                  designation: "Engenheira civil",
                  image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop"
                },
                {
                  id: 5,
                  name: "Paulo Santos",
                  designation: "Dono de construtora",
                  image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop"
                },
              ]}
            />
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-lg md:text-xl text-[#ddd] max-w-[600px] mx-auto font-light">
              Histórias reais de quem transformou a gestão da obra
            </p>
          </div>

          {/* Mobile: carrossel */}
          <div className="md:hidden">
            <div style={{ overflow: 'hidden', width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  width: `${testimonials.length * 100}%`,
                  transform: `translateX(-${testimonialIndex * (100 / testimonials.length)}%)`,
                  transition: 'transform 700ms ease-in-out'
                }}
              >
                {testimonials.map((testimonial, i) => (
                  <div key={i} style={{ width: `${100 / testimonials.length}%`, flexShrink: 0 }}>
                    <div className="bg-[#1f2228] rounded-lg p-8 border border-white/5 relative overflow-hidden">
                      <p className="text-[#ddd] mb-8 leading-[1.7] text-base font-light relative z-10">
                        "{testimonial.quote}"
                      </p>
                      <div className="border-t border-white/10 pt-5 relative z-10">
                        <p className="font-bold text-white text-base">{testimonial.name}</p>
                        <p className="text-sm text-[#ddd]/60 mt-1 font-light">{testimonial.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
              {testimonials.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  style={{
                    height: '6px',
                    width: i === testimonialIndex ? '14px' : '6px',
                    borderRadius: '9999px',
                    backgroundColor: i === testimonialIndex ? '#ffffff' : 'rgba(255,255,255,0.3)',
                    transition: 'all 300ms ease',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                />
              ))}
            </div>
          </div>

          {/* Desktop: grid 2 colunas */}
          <div className="hidden md:grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-[#1f2228] rounded-lg p-8 border border-white/5 hover:border-white/10 transition-all duration-200 relative overflow-hidden group"
              >
                <p className="text-[#ddd] mb-8 leading-[1.7] text-base md:text-lg font-light relative z-10">
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-white/10 pt-5 relative z-10">
                  <p className="font-bold text-white text-base">{testimonial.name}</p>
                  <p className="text-sm text-[#ddd]/60 mt-1 font-light">{testimonial.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-6 md:py-16 px-4 md:px-6 bg-[#13151a] relative overflow-hidden">
        <div className="max-w-[1100px] mx-auto relative z-10">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
              O OBREASY é para você?
            </h2>
            <p className="text-lg md:text-xl text-[#ddd]/80 font-light max-w-[620px] mx-auto leading-[1.6]">
              Uma obra envolve dinheiro, decisões e responsabilidade.<br className="hidden md:block" /> Controle não é improviso.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-6">
            {/* É para você */}
            <div className="bg-[#1f2228] rounded-lg p-8 md:p-10 border border-[#51ffa1]/30 hover:border-[#51ffa1]/50 transition-all duration-200 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-14 md:w-16 h-14 md:h-16 bg-[#51ffa1] rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-8 md:w-9 h-8 md:h-9 text-[#0a0a0a]" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white">É para você se:</h3>
              </div>
              <ul className="space-y-4 relative z-10">
                {[
                  "É dono da obra e quer saber exatamente quanto já investiu, quanto ainda falta e onde está gastando mais",
                  "Você está construindo ou reformando e quer saber, em tempo real, quanto gastou e quanto ainda pode gastar",
                  "É construtor ou arquiteto e precisa de visão consolidada de múltiplas obras sem depender de planilhas",
                  "Já perdeu o controle do orçamento uma vez e não quer que isso aconteça de novo",
                  "Precisa apresentar relatórios financeiros para clientes, sócios ou instituições financeiras"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#51ffa1] flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-[#ddd] leading-[1.7] text-base font-light">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Não é para você */}
            <div className="bg-[#1f2228] rounded-lg p-8 md:p-10 border border-white/10 hover:border-white/20 transition-all duration-200 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-14 md:w-16 h-14 md:h-16 bg-white/10 rounded-lg flex items-center justify-center">
                  <X className="w-8 md:w-9 h-8 md:h-9 text-[#ddd]" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white">Não é ideal se:</h3>
              </div>
              <ul className="space-y-4 relative z-10">
                {[
                  "Sua obra já foi concluída. O OBREASY é para gestão ativa, não para registros históricos.",
                  "Você não tem obra em andamento e não planeja iniciar uma em breve",
                  "Prefere delegar completamente a gestão financeira para terceiros, sem acompanhar os números"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-[#ddd]/50 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-[#ddd]/70 leading-[1.7] text-base font-light">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* O que muda utilizando o OBREASY */}
      <section id="como-funciona" className="py-6 md:py-16 px-4 md:px-6 bg-[#0a0a0a] relative overflow-hidden">
        <div className="max-w-[1080px] mx-auto relative z-10">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
              O que muda na sua obra
            </h2>
            <p className="text-lg md:text-xl text-[#ddd] font-light max-w-[600px] mx-auto">
              Comparativo real entre gerir uma obra sem e com o OBREASY
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                antes: "Você só descobre o saldo real quando junta todos os recibos no fim de semana e os números nunca batem",
                depois: "Saldo atualizado em tempo real a cada despesa lançada. Você sabe exatamente quanto gastou e quanto resta, a qualquer hora"
              },
              {
                antes: "Pagamentos misturados: você não sabe quais fornecedores foram pagos, quais estão pendentes e o que vence essa semana",
                depois: "Painel de pagos e pendentes por fornecedor e categoria. Nenhum vencimento passa despercebido"
              },
              {
                antes: "Registrar uma despesa exige abrir planilha, localizar a aba certa, digitar, salvar e torcer para não ter esquecido nada",
                depois: "Registro imediato pelo celular: valor, categoria, fornecedor e foto do comprovante em menos de 30 segundos"
              },
              {
                antes: "Você não tem ideia do custo real por m² da obra até ela terminar. Aí já é tarde para corrigir.",
                depois: "Custo por m² calculado automaticamente e atualizado a cada lançamento, para comparar com o mercado e ajustar a tempo"
              },
              {
                antes: "O orçamento estoura silenciosamente. Você só percebe quando o dinheiro acabou",
                depois: "Alertas automáticos quando qualquer categoria ultrapassar o limite previsto. Você age antes de perder o controle."
              },
              {
                antes: "Gerar um relatório para o cliente ou para o banco exige horas montando planilhas e formatando dados",
                depois: "Relatório financeiro completo em PDF gerado em um clique, com gráficos, categorias e comprovantes anexados"
              }
            ].map((item, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-3 md:gap-4 bg-[#1f2228] rounded-lg p-4 md:p-6 border border-white/5">
                <div className="flex items-start gap-3 p-3 md:p-4 bg-[#13151a] rounded-lg">
                  <X className="w-5 h-5 text-[#ddd]/50 flex-shrink-0 mt-1" strokeWidth={2} />
                  <div>
                    <p className="text-xs font-bold text-[#ddd]/60 mb-1 uppercase tracking-wide">Sem o OBREASY</p>
                    <p className="text-[#ddd]/80 font-light text-sm md:text-base leading-[1.6]">{item.antes}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 md:p-4 bg-[#0B3064]/20 border border-[#51ffa1]/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#51ffa1] flex-shrink-0 mt-1" strokeWidth={2} />
                  <div>
                    <p className="text-xs font-bold text-[#51ffa1] mb-1 uppercase tracking-wide">Com o OBREASY</p>
                    <p className="text-white font-medium text-sm md:text-base leading-[1.6]">{item.depois}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-6 md:py-16 px-4 md:px-6 bg-gradient-to-b from-[#13151a] via-[#0a0a0a] to-[#0a0a0a]">
        <div className="max-w-[1080px] mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 md:mb-10 text-center">
            Funcionalidades incluídas
          </h2>

          <div className="grid md:grid-cols-2 gap-6 md:gap-6">
            {[
              {
                title: "Controle financeiro",
                items: ["Registro de despesas por categoria", "Comparação orçado x realizado", "Histórico completo de pagamentos"]
              },
              {
                title: "Gestão de profissionais",
                items: ["Cadastro de pedreiros, eletricistas, etc.", "Controle de pagamentos e contratos"]
              },
              {
                title: "Relatórios",
                items: ["PDF exportável com resumo financeiro", "Gráficos de distribuição de gastos"]
              },
              {
                title: "Diário de Fotos da Obra",
                items: ["Registre o progresso com fotos por etapa", "Histórico visual do avanço da obra", "Documentação completa para clientes e financiadores"]
              },
              {
                title: "Acesso multiplataforma",
                items: ["App mobile (Android e iOS)", "Versão web (computador/tablet)"]
              }
            ].map((feature, i) => (
              <div key={i} className="bg-[#1f2228] rounded-lg p-6 md:p-8 border border-white/5 hover:border-white/10 transition-all duration-200">
                <h3 className="font-bold text-white mb-4 text-lg md:text-xl">{feature.title}</h3>
                <ul className="space-y-3">
                  {feature.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-[#ddd]">
                      <CheckCircle2 className="w-5 h-5 text-[#0B3064] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-base leading-[1.7] font-light">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Suporte com especialistas — destaque full-width */}
          <div className="mt-6 bg-gradient-to-r from-[#0B3064] to-[#0d3d7a] rounded-lg p-6 md:p-8 border border-[#0B3064]/80 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg md:text-xl mb-1">Suporte com Engenheiro e Arquiteto</h3>
              <p className="text-white/70 font-light text-sm md:text-base leading-relaxed">
                Tem dúvidas durante a obra? No Obreasy você conta com suporte especializado de engenheiros e arquitetos para te orientar nas decisões técnicas e financeiras da sua construção.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-6 md:py-16 px-4 md:px-6 bg-[#0a0a0a] relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4">Escolha seu plano</h2>
            <p className="text-lg md:text-xl text-[#ddd] font-light mb-3">Cancele quando quiser • Sem permanência mínima</p>
            <p className="text-base md:text-lg text-[#51ffa1] font-medium">7 dias de garantia para experimentar</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 md:gap-6 max-w-[1080px] mx-auto">
            {/* Plano Profissional */}
            <div className="bg-[#0B3064] rounded-lg p-8 md:p-10 relative border border-[#0B3064]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="bg-white text-[#0B3064] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                  Recomendado
                </div>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Plano Profissional</h3>
              <p className="text-white/80 mb-8 text-sm md:text-base font-light">Para múltiplas obras</p>

              <div className="mb-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-black text-white">R$ 49,90</span>
                  <span className="text-xl text-white/70 font-light">/mês</span>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-base font-bold text-white mb-4">O que está incluído:</p>
                <ul className="space-y-3">
                  {[
                    "Obras ilimitadas",
                    "Controle financeiro completo",
                    "Gestão de profissionais",
                    "Relatórios em PDF",
                    "Alertas de orçamento",
                    "Acesso mobile e web",
                    "Visão consolidada de todas as obras",
                    "Controle de recebimentos de clientes"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-white/90 font-light text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleCTA}
                className="w-full bg-white text-[#0B3064] py-4 md:py-5 rounded-lg hover:bg-gray-100 transition-all duration-200 font-bold text-base md:text-lg"
              >
                Testar grátis por 7 dias
              </button>
              <p className="text-sm text-center text-white/80 mt-5 font-light">
                Sem compromisso. Cancele quando quiser.
              </p>
            </div>

            {/* Plano Essencial */}
            <div className="bg-[#1f2228] rounded-lg p-8 md:p-10 border border-white/10 hover:border-white/20 transition-all duration-200">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Plano Essencial</h3>
              <p className="text-[#ddd]/70 mb-8 text-sm md:text-base font-light">Perfeito para 1 obra</p>

              <div className="mb-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-black text-white">R$ 29,90</span>
                  <span className="text-xl text-[#ddd]/70 font-light">/mês</span>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-base font-bold text-white mb-4">O que está incluído:</p>
                <ul className="space-y-3">
                  {[
                    "Para 1 obra",
                    "Controle financeiro completo",
                    "Gestão de profissionais",
                    "Relatórios em PDF",
                    "Alertas de orçamento",
                    "Acesso mobile e web"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#51ffa1] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-[#ddd] font-light text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleCTA}
                className="w-full bg-[#0B3064] text-white py-4 md:py-5 rounded-lg hover:bg-[#082551] transition-all duration-200 font-bold text-base md:text-lg"
              >
                Testar grátis por 7 dias
              </button>
              <p className="text-sm text-center text-[#ddd]/60 mt-5 font-light">
                Sem compromisso. Cancele quando quiser.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-6 md:py-16 px-4 md:px-6 bg-gradient-to-b from-[#0a0a0a] via-[#13151a] to-[#13151a] relative">
        <div className="max-w-[900px] mx-auto relative z-10">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
              Perguntas frequentes
            </h2>
            <p className="text-lg md:text-xl text-[#ddd] font-light">
              Tudo que você precisa saber antes de começar
            </p>
          </div>

          <div className="space-y-3 md:space-y-3">
            {[
              {
                q: "Como faço para começar a usar?",
                a: "Crie sua conta gratuitamente, cadastre sua primeira obra e já pode começar a registrar despesas e acompanhar o orçamento. Depois de 7 dias, você escolhe o plano que melhor se encaixa."
              },
              {
                q: "Posso cancelar a qualquer momento?",
                a: "Sim. Cancele quando quiser sem multa, taxa ou burocracia. Você pode exportar todos os seus dados antes de cancelar."
              },
              {
                q: "Meus dados estão seguros?",
                a: "Sim. Usamos criptografia SSL, armazenamento em nuvem seguro e backup automático."
              },
              {
                q: "Funciona para reforma pequena ou apenas obras grandes?",
                a: "Funciona para qualquer tipo e tamanho de obra ou reforma. Quanto mais simples o projeto, mais rápido você organiza. Vários usuários usam só para reformas de banheiro ou cozinha."
              },
              {
                q: "Qual a diferença entre o Plano Essencial e o Plano Profissional?",
                a: "Essencial: 1 obra ativa por vez. Ideal para quem está construindo ou reformando a própria casa. Profissional: obras ilimitadas + visão consolidada. Para construtores e arquitetos gerenciando vários projetos ao mesmo tempo."
              },
              {
                q: "Preciso instalar algum software?",
                a: (
                  <div>
                    <p className="mb-4">Não é obrigatório. O OBREASY funciona direto no navegador do celular ou computador, sem instalar nada. Se preferir, adicione à tela inicial como app:</p>
                    <p className="font-bold text-white mb-2">Android (Chrome):</p>
                    <ol className="list-decimal list-inside space-y-1 mb-4 ml-1">
                      <li>Abra o site no Chrome</li>
                      <li>Um banner "Adicionar à tela inicial" pode aparecer automaticamente</li>
                      <li>Se não, toque no menu ⋮ e selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</li>
                    </ol>
                    <p className="font-bold text-white mb-2">iOS (Safari):</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Abra o site no Safari</li>
                      <li>Toque no botão Compartilhar (ícone de seta na parte inferior)</li>
                      <li>Role e selecione "Adicionar à Tela de Início"</li>
                    </ol>
                  </div>
                )
              },
              {
                q: "Posso exportar meus dados?",
                a: "Sim. Você pode gerar relatórios em PDF com todos os dados da sua obra a qualquer momento, mesmo após cancelar a assinatura."
              },
              {
                q: "Aceita quais formas de pagamento?",
                a: "Cartão de crédito (parcelado ou à vista) e PIX."
              },
              {
                q: "É complicado de usar?",
                a: "Não. Se você consegue digitar valores e anexar fotos, consegue usar o OBREASY. A maioria dos usuários registra a primeira despesa em menos de 2 minutos."
              },
              {
                q: "E se eu tiver dúvidas ou problemas?",
                a: "Suporte por email. Respondemos em até 24h úteis."
              }
            ].map((faq, index) => (
              <div key={index} className={`bg-[#1f2228] border border-white/5 rounded-lg overflow-hidden hover:border-white/10 transition-all duration-200 ${index >= 6 ? 'hidden md:block' : ''}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left px-6 md:px-8 py-5 md:py-6 flex items-center justify-between hover:bg-[#13151a] transition-colors"
                >
                  <span className="font-normal text-white pr-4 md:pr-6 text-base md:text-lg">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 md:w-6 h-5 md:h-6 text-[#0B3064] transition-transform flex-shrink-0 ${openFaq === index ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 md:px-8 pb-5 md:pb-6 border-t border-white/5">
                    <div className="text-[#ddd] leading-[1.7] text-base md:text-lg pt-4 md:pt-5 font-light">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-6 md:py-16 px-4 md:px-6 bg-[#13151a] relative overflow-hidden">
        <div className="max-w-[900px] mx-auto text-center relative z-10">
          {/* Badge com urgência */}
          <div className="inline-flex items-center gap-2 bg-[#ffffff14] border border-white/10 rounded-full px-5 py-2.5 mb-8">
            <div className="w-2.5 h-2.5 bg-[#51ffa1] rounded-full animate-pulse"></div>
            <span className="text-[#51ffa1] text-sm md:text-base font-bold">Comece hoje mesmo • 7 dias de garantia</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 md:mb-8 leading-[1.1]">
            Pronto para ter controle{" "}
            <span className="text-[#0B3064]" style={{ textShadow: '0 0 20px rgba(11, 48, 100, 0.6), 0 0 40px rgba(11, 48, 100, 0.3)' }}>
              total da sua obra?
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-[#ddd] mb-12 md:mb-14 font-light max-w-[700px] mx-auto leading-[1.5]">
            Comece agora e tenha visibilidade completa do seu orçamento em minutos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={handleCTA}
              className="group bg-[#0B3064] text-white px-12 md:px-14 py-5 md:py-6 rounded-lg hover:bg-[#082551] transition-all duration-200 font-bold text-lg md:text-xl inline-flex items-center gap-3"
            >
              Testar grátis por 7 dias
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={2.5} />
            </button>
            <p className="text-sm text-center text-[#ddd]/60 mt-3 font-light">Sem compromisso. Cancele quando quiser.</p>
          </div>

          {/* Trust elements */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-10 text-[#ddd]/70">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#51ffa1]" strokeWidth={2} />
              <span className="text-sm md:text-base font-medium">7 dias de garantia</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#51ffa1]" strokeWidth={2} />
              <span className="text-sm md:text-base font-medium">Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-10 md:py-16 px-4 md:px-6 bg-[#0a0a0a]">
        <div className="max-w-[640px] mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Fale conosco</h2>
            <p className="text-lg text-[#ddd]/70 font-light">
              Ficou com dúvida? Envie uma mensagem e retornamos em até 24h úteis.
            </p>
          </div>

          <form onSubmit={handleContatoSubmit} className="bg-[#1f2228] rounded-2xl p-6 md:p-8 border border-white/10 space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-[#ddd]/70 mb-1.5">
                Nome *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ddd]/30" />
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={contatoForm.nome}
                  onChange={e => setContatoForm({ ...contatoForm, nome: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#13151a] border border-white/10 rounded-xl text-white placeholder-[#ddd]/30 focus:outline-none focus:border-[#0B3064]/60 focus:ring-1 focus:ring-[#0B3064]/40 text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#ddd]/70 mb-1.5">
                E-mail *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ddd]/30" />
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={contatoForm.email}
                  onChange={e => setContatoForm({ ...contatoForm, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#13151a] border border-white/10 rounded-xl text-white placeholder-[#ddd]/30 focus:outline-none focus:border-[#0B3064]/60 focus:ring-1 focus:ring-[#0B3064]/40 text-sm"
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-[#ddd]/70 mb-1.5">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ddd]/30" />
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={contatoForm.telefone}
                  onChange={e => setContatoForm({ ...contatoForm, telefone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#13151a] border border-white/10 rounded-xl text-white placeholder-[#ddd]/30 focus:outline-none focus:border-[#0B3064]/60 focus:ring-1 focus:ring-[#0B3064]/40 text-sm"
                />
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-[#ddd]/70 mb-1.5">
                Mensagem *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Descreva sua dúvida ou como podemos ajudar..."
                value={contatoForm.mensagem}
                onChange={e => setContatoForm({ ...contatoForm, mensagem: e.target.value })}
                className="w-full px-4 py-3 bg-[#13151a] border border-white/10 rounded-xl text-white placeholder-[#ddd]/30 focus:outline-none focus:border-[#0B3064]/60 focus:ring-1 focus:ring-[#0B3064]/40 text-sm resize-none"
              />
            </div>

            {contatoEnviado && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <span className="text-sm text-emerald-400 font-medium">Mensagem enviada com sucesso! Retornamos em até 24h úteis.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={enviandoContato}
              className="w-full bg-[#0B3064] text-white py-3.5 rounded-xl hover:bg-[#082551] transition-all duration-200 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviandoContato ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {enviandoContato ? "Enviando..." : "Enviar mensagem"}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <FooterSection />
    </div>
  )
}
