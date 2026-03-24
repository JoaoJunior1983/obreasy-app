"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Send, HelpCircle, Phone, Mail, BookOpen } from "lucide-react"
import { getUserProfile, type UserProfile } from "@/lib/storage"

interface FAQ {
  id: number
  pergunta: string
  resposta: string
}

// FAQs para perfil "Dono da Obra"
const faqsOwner: FAQ[] = [
  {
    id: 1,
    pergunta: "Como criar uma nova obra?",
    resposta: "Acesse 'Minhas Obras' e clique em 'Nova Obra'. Preencha os dados como nome, localização, área em m² e orçamento estimado. Após salvar, sua obra estará criada e você poderá começar a registrar despesas e profissionais."
  },
  {
    id: 2,
    pergunta: "Posso ter várias obras no mesmo cadastro?",
    resposta: "Sim! Você pode cadastrar quantas obras desejar. Para alternar entre elas, vá até 'Minhas Obras' e clique na obra que deseja visualizar. A obra ativa será exibida no cabeçalho do dashboard."
  },
  {
    id: 3,
    pergunta: "Como cadastrar profissionais (mão de obra)?",
    resposta: "No dashboard da obra, clique em 'Novo Profissional' no card de Profissionais. Preencha nome, função e valor previsto. Você pode optar por contrato fechado (valor total) ou empreitada (pagamentos parciais)."
  },
  {
    id: 4,
    pergunta: "Como definir contrato ou empreitada?",
    resposta: "Ao cadastrar um profissional, escolha o tipo de contrato. 'Contrato fechado' é para valor total definido. 'Empreitada' permite registrar pagamentos parciais conforme o andamento do trabalho."
  },
  {
    id: 5,
    pergunta: "Como lançar pagamentos de mão de obra?",
    resposta: "Clique em 'Novo Pagamento' no card de Profissionais do dashboard. Selecione o profissional, informe o valor, data e adicione observações se necessário. O sistema vincula automaticamente ao profissional."
  },
  {
    id: 6,
    pergunta: "Como lançar despesas de materiais?",
    resposta: "No dashboard da obra, clique em 'Nova Despesa' no card de Despesas. Selecione a categoria (Material ou Outros), preencha a descrição, valor, fornecedor e data. Você pode anexar comprovantes de pagamento."
  },
  {
    id: 7,
    pergunta: "Como funciona o custo por m²?",
    resposta: "O custo por m² é calculado automaticamente dividindo o total gasto pela área da obra. Você pode ver o custo atual e compará-lo com o estimado no card 'Custo por m²' do dashboard."
  },
  {
    id: 8,
    pergunta: "Como gerar relatório em PDF?",
    resposta: "No dashboard da obra, clique em 'Gerar Relatório (PDF)'. Escolha o período desejado e os filtros (material, mão de obra, etc.). O sistema gerará um relatório completo que você pode salvar ou imprimir."
  },
  {
    id: 9,
    pergunta: "Como funcionam os alertas de orçamento?",
    resposta: "Os alertas de orçamento são ativados automaticamente quando você cria uma obra com orçamento. Você receberá notificações quando atingir 10%, 20%, 30%... até 100% do orçamento. Configure em 'Alertas e Notificações'."
  },
  {
    id: 10,
    pergunta: "Como funcionam os alertas de prazo e pagamento?",
    resposta: "Você pode criar alertas personalizados para datas importantes (entrega de material, vistoria, etc.) e para pagamentos recorrentes. Acesse 'Alertas e Notificações' para configurar."
  },
  {
    id: 11,
    pergunta: "Como editar ou excluir lançamentos?",
    resposta: "Acesse 'Despesas' ou 'Profissionais' no menu. Clique no ícone de três pontos ao lado do item que deseja editar ou excluir. Atenção: exclusões são permanentes e não podem ser desfeitas."
  },
  {
    id: 12,
    pergunta: "Como favoritar uma obra?",
    resposta: "Na página 'Minhas Obras', clique no ícone de estrela no card da obra. Obras favoritadas aparecem no topo da lista, facilitando o acesso rápido às obras principais."
  },
  {
    id: 13,
    pergunta: "Como funciona o controle de saldo da obra?",
    resposta: "O saldo disponível é calculado automaticamente: Orçamento Estimado - Total Gasto. Você pode acompanhar em tempo real no card 'Saldo Disponível' do dashboard da obra."
  }
]

// FAQs para perfil "Construtor / Profissional"
const faqsBuilder: FAQ[] = [
  {
    id: 1,
    pergunta: "Como cadastrar uma nova obra do meu cliente?",
    resposta: "Acesse 'Minhas Obras' e clique em 'Cadastrar obra do cliente'. Preencha os dados da obra (nome, localização, área) e inclua o nome do cliente e o valor contratado. Isso permitirá controlar os recebimentos do cliente separadamente das despesas da obra."
  },
  {
    id: 2,
    pergunta: "Como editar o nome do cliente de uma obra?",
    resposta: "Na tela 'Minhas Obras', clique no ícone de editar (lápis) no card da obra. Além dos dados da obra, você poderá editar o campo 'Nome do Cliente' que aparece exclusivamente para construtores."
  },
  {
    id: 3,
    pergunta: "Como registrar recebimentos do cliente?",
    resposta: "No card da obra (tela 'Minhas Obras'), localize a seção 'Recebimentos do Cliente' e clique no botão verde 'Registrar recebimento'. Informe o valor, data, forma de pagamento e observações (ex: parcela 1/3). O sistema calculará automaticamente o saldo a receber."
  },
  {
    id: 4,
    pergunta: "Como acessar o extrato completo de recebimentos?",
    resposta: "No dashboard da obra, acesse o menu lateral e clique em 'Extrato de Recebimentos'. Você verá todos os recebimentos registrados, com data, forma de pagamento, valor e observações. É possível editar, excluir, anexar comprovantes e gerar relatórios."
  },
  {
    id: 5,
    pergunta: "Como funciona o cálculo de 'Saldo a Receber'?",
    resposta: "O saldo a receber é calculado automaticamente: Valor Contratado - Total Recebido. Você pode acompanhar em tempo real no card da obra (seção 'Recebimentos do Cliente') e no extrato de recebimentos."
  },
  {
    id: 6,
    pergunta: "Como lançar pagamentos aos profissionais da minha equipe?",
    resposta: "Cadastre seus profissionais em 'Profissionais' e depois registre os pagamentos em 'Novo Pagamento'. Selecione o profissional, informe o valor, data e forma de pagamento. Todos os pagamentos de mão de obra são contabilizados nas despesas da obra."
  },
  {
    id: 7,
    pergunta: "Como lançar despesas de materiais e fornecedores?",
    resposta: "No dashboard da obra, clique em 'Nova Despesa'. Selecione a categoria 'Material', preencha descrição, valor, fornecedor e data. Você pode anexar nota fiscal ou comprovante de pagamento para manter tudo organizado."
  },
  {
    id: 8,
    pergunta: "Como visualizar meu lucro na obra?",
    resposta: "Seu lucro é calculado como: Total Recebido - Total Gasto. Você pode acompanhar essa margem no dashboard da obra, comparando os cards de 'Recebimentos' e 'Total Gasto'. Para uma visão detalhada, gere o relatório em PDF."
  },
  {
    id: 9,
    pergunta: "Como gerar relatórios de obras para apresentar ao cliente?",
    resposta: "No dashboard da obra ou na tela 'Minhas Obras', clique em 'Gerar Relatório (PDF)'. Escolha o período e os filtros desejados. O relatório inclui todas as despesas, pagamentos, recebimentos e análise financeira completa."
  },
  {
    id: 10,
    pergunta: "Como funcionam os alertas de orçamento e prazo?",
    resposta: "Configure alertas em 'Alertas e Notificações'. Você pode criar alertas de orçamento (ex: quando atingir 80% do valor contratado), alertas de prazo (ex: data de entrega da obra) e alertas de pagamento (ex: vencimento de parcelas)."
  },
  {
    id: 11,
    pergunta: "Posso gerenciar várias obras ao mesmo tempo?",
    resposta: "Sim! Cadastre quantas obras desejar. Na tela 'Minhas Obras', você verá todas as obras com seus respectivos clientes, valores contratados, recebimentos e despesas. Clique em uma obra para acessar seu dashboard individual."
  },
  {
    id: 12,
    pergunta: "Como editar ou excluir recebimentos e despesas?",
    resposta: "No extrato de recebimentos ou na lista de despesas, clique no ícone azul de editar para alterar informações, ou no ícone vermelho para excluir. Atenção: exclusões são permanentes e afetam os totais automaticamente."
  },
  {
    id: 13,
    pergunta: "Como anexar comprovantes de pagamento?",
    resposta: "Ao registrar um recebimento ou despesa, use o campo 'Anexar comprovante' para fazer upload de imagens ou PDFs (máx. 10MB). Os comprovantes ficam disponíveis para visualização e download no extrato."
  },
  {
    id: 14,
    pergunta: "Como favoritar minhas obras principais?",
    resposta: "Na tela 'Minhas Obras', clique no ícone de estrela no card da obra. Obras favoritadas aparecem no topo da lista, facilitando o acesso rápido às obras em andamento ou mais importantes."
  }
]

const inputCls = "w-full h-11 px-3 bg-[#2a2d35] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#0B3064]/60 transition-colors read-only:text-[#555] read-only:cursor-default"

export default function SuportePage() {
  const [userProfile, setUserProfile] = useState<UserProfile>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [showAllFaqs, setShowAllFaqs] = useState(false)
  const [mensagem, setMensagem] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userPhone, setUserPhone] = useState("")

  useEffect(() => {
    const profile = getUserProfile()
    setUserProfile(profile)

    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setUserEmail(user.email || "")
      setUserPhone(user.telefone || user.phone || "")
    }
  }, [])

  const faqs = userProfile === "builder" ? faqsBuilder : faqsOwner

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent("Solicitação de suporte - Obreasy")
    const body = encodeURIComponent(
      `De: ${userEmail}${userPhone ? `\nTelefone: ${userPhone}` : ""}\n\n${mensagem}`
    )
    window.location.href = `mailto:suporte@obreasy.com.br?subject=${subject}&body=${body}`
    setMensagem("")
  }


  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-10">
      <div className="max-w-lg mx-auto px-4 pt-6 sm:px-6">

        {/* Título */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#0B3064]/20 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-4 h-4 text-[#7eaaee]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white leading-tight">Central de Ajuda</h1>
            <p className="text-xs text-[#666] mt-0.5">Encontre respostas ou fale com a gente.</p>
          </div>
        </div>

        <div className="space-y-3">

          {/* FAQ — collapsed teaser */}
          {!showAllFaqs && (
            <button
              onClick={() => setShowAllFaqs(true)}
              className="w-full bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl px-4 py-4 sm:px-5 flex items-center gap-3 text-left hover:border-white/[0.12] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0B3064]/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-[#7eaaee]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Perguntas Frequentes</p>
                <p className="text-xs text-[#666] mt-0.5">
                  {faqs.length} perguntas sobre{" "}
                  {userProfile === "builder" ? "obras, recebimentos e pagamentos" : "obras, profissionais e relatórios"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-[#555] flex-shrink-0" />
            </button>
          )}

          {/* FAQ — lista expandida */}
          {showAllFaqs && (
            <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl overflow-hidden">
              {/* header da lista */}
              <div className="flex items-center justify-between px-4 py-3.5 sm:px-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-[#7eaaee]" />
                  <span className="text-sm font-medium text-white">Perguntas Frequentes</span>
                </div>
                <button
                  onClick={() => { setShowAllFaqs(false); setExpandedFaq(null) }}
                  className="text-[#555] hover:text-white transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              {/* itens */}
              <div className="divide-y divide-white/[0.04]">
                {faqs.map((faq) => (
                  <div key={faq.id}>
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-start justify-between gap-3 px-4 py-3.5 sm:px-5 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-sm font-medium text-white leading-snug">{faq.pergunta}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#555] flex-shrink-0 mt-0.5 transition-transform duration-200 ${expandedFaq === faq.id ? "rotate-180" : ""}`}
                      />
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-4 pb-4 sm:px-5 text-sm text-[#999] leading-relaxed -mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {faq.resposta}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fale Conosco */}
          <div className="bg-[#1f2228]/80 border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-4 py-4 sm:px-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-[#7eaaee]" />
                <span className="text-sm font-medium text-white">Fale Conosco</span>
              </div>
              <p className="text-xs text-[#666] mt-1">
                Não encontrou o que procurava? Envie sua dúvida.
              </p>
            </div>

            <form onSubmit={handleEnviar} className="px-4 py-4 sm:px-5 space-y-3">
              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#888]">
                  <Mail className="w-3.5 h-3.5" />
                  Seu e-mail
                </label>
                <input
                  type="email"
                  value={userEmail}
                  readOnly
                  className={inputCls}
                />
              </div>

              {/* Telefone (se existir) */}
              {userPhone && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[#888]">
                    <Phone className="w-3.5 h-3.5" />
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    readOnly
                    className={inputCls}
                  />
                </div>
              )}

              {/* Mensagem */}
              <div className="space-y-1.5">
                <label htmlFor="mensagem" className="text-xs font-medium text-[#888]">
                  Mensagem
                </label>
                <textarea
                  id="mensagem"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  required
                  rows={4}
                  placeholder="Descreva sua dúvida ou problema..."
                  className="w-full px-3 py-2.5 bg-[#2a2d35] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#0B3064]/60 transition-colors resize-none"
                />
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={!mensagem.trim()}
                className="w-full h-11 flex items-center justify-center gap-2 bg-[#0B3064] hover:bg-[#082551] active:bg-blue-800 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-sm font-medium text-white transition-colors"
              >
                <Send className="w-4 h-4" />
                Abrir e-mail
              </button>
            </form>
          </div>

          {/* Rodapé */}
          <p className="text-center text-xs text-[#444] pb-2">
            Atendimento seg–sex, 9h–18h · Resposta em até 24h úteis
          </p>

        </div>
      </div>
    </div>
  )
}
