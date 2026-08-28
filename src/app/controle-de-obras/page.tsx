import type { Metadata } from "next"
import Link from "next/link"
import SeoPageLayout from "@/components/custom/seo-page-layout"
import { SITE_URL } from "@/lib/site-url"

const PUBLICADO_EM = "2026-08-28"

export const metadata: Metadata = {
  title: "Controle de Obras: como controlar gastos, prazo e equipe sem estourar",
  description:
    "O que acompanhar para a obra não fugir do controle: gasto contra orçamento, pagamento de profissionais, prazo e registro do dia. Como fazer isso pelo celular.",
  keywords: [
    "controle de obras",
    "controle de gastos de obra",
    "controle financeiro de obra",
    "aplicativo para controle de obras",
    "como controlar gastos de obra",
    "controle de pagamento de pedreiro",
  ],
  alternates: { canonical: "/controle-de-obras" },
  openGraph: {
    type: "article",
    locale: "pt_BR",
    url: `${SITE_URL}/controle-de-obras`,
    siteName: "Obreasy",
    title: "Controle de Obras: como controlar gastos, prazo e equipe sem estourar",
    description:
      "O que acompanhar para a obra não fugir do controle, e como manter isso atualizado sem depender de planilha.",
  },
}

const FAQ = [
  {
    pergunta: "Como controlar os gastos de uma obra?",
    resposta:
      "Lançando cada gasto no dia em que ele acontece e comparando com o que foi orçado para aquele item. O controle não é o registro em si: é a comparação. Saber que já foi gasto o valor previsto para toda a parte elétrica quando a obra está na metade é o que dá tempo de reagir.",
  },
  {
    pergunta: "Qual a diferença entre controle e gestão de obras?",
    resposta:
      "Controle é o acompanhamento do que já está acontecendo: quanto saiu, quem recebeu, o que foi executado. Gestão é mais amplo e inclui planejar, coordenar equipes e decidir. Na prática do dia a dia, o controle é a parte que não pode falhar — sem ele a gestão decide no escuro.",
  },
  {
    pergunta: "Como controlar o pagamento dos profissionais da obra?",
    resposta:
      "Registrando o combinado com cada profissional, o que já foi pago e o que falta, com comprovante anexado. É onde mais aparece divergência: semanas depois, ninguém lembra se aquela diária foi paga ou adiantada, e a discussão sempre custa dinheiro ou relação.",
  },
  {
    pergunta: "Vale a pena usar planilha para controlar obra?",
    resposta:
      "Para uma obra pequena e um responsável só, funciona. O limite aparece quando o gasto acontece no canteiro e a planilha está no escritório: o lançamento atrasa, a nota se perde e o número deixa de ser confiável justamente quando você precisa dele para decidir.",
  },
  {
    pergunta: "Como saber se a obra vai estourar o orçamento?",
    resposta:
      "Comparando o percentual gasto com o percentual executado. Se você gastou 70% do orçamento com metade da obra pronta, o estouro já está contratado — e quanto antes esse número aparece, mais barata é a correção.",
  },
]

const PILARES = [
  {
    titulo: "Gasto contra orçamento",
    texto:
      "Cada despesa lançada e comparada com o previsto para aquele item. É o número que responde se a obra vai fechar no azul.",
  },
  {
    titulo: "Pagamento de profissionais",
    texto:
      "Quem trabalhou, quanto foi combinado, quanto já recebeu e o comprovante junto. Evita a discussão que sempre aparece semanas depois.",
  },
  {
    titulo: "Recebimentos do cliente",
    texto:
      "As parcelas que entram. Obra que gasta em ritmo diferente do que recebe cria aperto de caixa mesmo sendo lucrativa no papel.",
  },
  {
    titulo: "Execução do dia",
    texto:
      "O que avançou, com foto. É o que sustenta medição e o que evita discussão sobre prazo.",
  },
  {
    titulo: "Custo por metro quadrado",
    texto:
      "Atualizado enquanto a obra corre, não só no fim. Serve para conferir se você está dentro da curva e para orçar a próxima.",
  },
  {
    titulo: "Alerta de limite",
    texto:
      "Um aviso quando o gasto passa do percentual que você definiu. O estouro percebido cedo ainda é corrigível.",
  },
]

export default function ControleDeObrasPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${SITE_URL}/controle-de-obras#article`,
        headline: "Controle de Obras: como controlar gastos, prazo e equipe sem estourar",
        description:
          "O que acompanhar para a obra não fugir do controle e como manter isso atualizado.",
        inLanguage: "pt-BR",
        mainEntityOfPage: `${SITE_URL}/controle-de-obras`,
        image: [`${SITE_URL}/opengraph-image`],
        datePublished: PUBLICADO_EM,
        dateModified: PUBLICADO_EM,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/controle-de-obras#faq`,
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.pergunta,
          acceptedAnswer: { "@type": "Answer", text: f.resposta },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Controle de obras", item: `${SITE_URL}/controle-de-obras` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoPageLayout
        chapeu="Guia prático"
        titulo="Controle de obras: o que acompanhar para não estourar"
        subtitulo="Obra não estoura de uma vez. Estoura em pequenas decisões que ninguém somou — e o controle existe justamente para que alguém esteja somando enquanto ainda dá para corrigir."
        ctaTitulo="Tenha o controle da obra no celular"
        ctaTexto="O Obreasy junta gasto, orçamento, pagamento de profissionais e diário num lugar só, e avisa quando a obra passa do limite que você definiu. Teste sem custo."
      >
        <section>
          <h2 className="text-2xl font-bold text-white">O que significa controlar uma obra</h2>
          <p className="mt-4">
            Controlar é saber, a qualquer momento, quanto já saiu, quanto falta, o que foi
            executado e quem recebeu o quê. Parece básico, e é — mas é justamente o básico que
            deixa de ser feito quando a obra aperta.
          </p>
          <p className="mt-4">
            O sintoma clássico é chegar no fim do mês sem saber se a obra está dando lucro. Quando
            essa pergunta não tem resposta rápida, o controle já falhou, mesmo que tudo esteja
            anotado em algum lugar.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Os seis pontos que precisam estar sob controle</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PILARES.map((item) => (
              <div key={item.titulo} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
                <h3 className="font-semibold text-white">{item.titulo}</h3>
                <p className="mt-2 text-sm text-white/70">{item.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">A conta que antecipa o estouro</h2>
          <p className="mt-4">
            Existe uma comparação simples que avisa antes de o problema virar irreversível:{" "}
            <strong className="text-white">percentual gasto contra percentual executado</strong>.
          </p>
          <p className="mt-4">
            Se metade da obra está pronta e 70% do orçamento já foi embora, o estouro está
            contratado — a diferença é só quanto. Percebendo isso na metade, ainda há espaço para
            renegociar material, rever escopo ou conversar com o cliente. Percebendo no fim, resta
            absorver o prejuízo.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Controle de gastos na prática</h2>
          <p className="mt-4">
            A regra que faz diferença é uma só: <strong className="text-white">o gasto entra no
            dia em que acontece</strong>. Nota de material, diária de pedreiro, frete, aluguel de
            equipamento. Deixar para lançar depois é como preencher o diário no fim da semana —
            o registro perde precisão exatamente onde ela importa.
          </p>
          <p className="mt-4">
            Por isso o lançamento pelo celular muda o resultado. Não é conveniência: é o que
            garante que o número contra o qual você decide seja verdadeiro.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Perguntas frequentes</h2>
          <div className="mt-6 space-y-5">
            {FAQ.map((item) => (
              <div key={item.pergunta} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
                <h3 className="font-semibold text-white">{item.pergunta}</h3>
                <p className="mt-2 text-sm text-white/70">{item.resposta}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-sm text-white/60">
            Veja também:{" "}
            <Link href="/orcamento-de-obra" className="text-[#7eaaee] underline-offset-4 hover:underline">
              orçamento de obra
            </Link>{" "}
            e{" "}
            <Link href="/gestao-de-obras" className="text-[#7eaaee] underline-offset-4 hover:underline">
              gestão de obras
            </Link>
            .
          </p>
        </section>
      </SeoPageLayout>
    </>
  )
}
