import type { Metadata } from "next"
import Link from "next/link"
import SeoPageLayout from "@/components/custom/seo-page-layout"
import { SITE_URL } from "@/lib/site-url"

const PUBLICADO_EM = "2026-08-28"

export const metadata: Metadata = {
  title: "Gestão de Obras: como coordenar várias obras, equipe e prazo",
  description:
    "Gestão de obras na prática para engenheiros, arquitetos e construtores: como acompanhar várias obras ao mesmo tempo, coordenar equipe, controlar prazo e manter o cliente informado.",
  keywords: [
    "gestão de obras",
    "gerenciamento de obras",
    "software de gestão de obras",
    "gestão de obras na construção civil",
    "como gerenciar obras",
    "gestão de várias obras",
  ],
  alternates: { canonical: "/gestao-de-obras" },
  openGraph: {
    type: "article",
    locale: "pt_BR",
    url: `${SITE_URL}/gestao-de-obras`,
    siteName: "Obreasy",
    title: "Gestão de Obras: como coordenar várias obras, equipe e prazo",
    description:
      "Como acompanhar várias obras ao mesmo tempo sem perder o controle de custo, prazo e equipe.",
  },
}

const FAQ = [
  {
    pergunta: "O que faz a gestão de obras?",
    resposta:
      "Coordena tudo que precisa acontecer para a obra terminar no prazo, no custo e na qualidade combinados: planejamento, compra de material, equipes, acompanhamento de execução, controle financeiro e comunicação com o cliente. É a função que enxerga a obra inteira, não só a frente de serviço do dia.",
  },
  {
    pergunta: "Como gerenciar várias obras ao mesmo tempo?",
    resposta:
      "Padronizando o que se acompanha em cada uma. Quando toda obra tem orçamento lançado, gasto registrado no dia e diário em ordem, comparar cinco obras vira questão de olhar os mesmos números. Sem esse padrão, cada obra vira um caso à parte e a gestão não escala.",
  },
  {
    pergunta: "Qual a diferença entre gestão e controle de obras?",
    resposta:
      "O controle acompanha o que já aconteceu — quanto saiu, o que foi executado, quem recebeu. A gestão usa esses números para decidir o que fazer a seguir. Uma coisa alimenta a outra: gestão sem controle é decisão no escuro, e controle sem gestão é relatório que ninguém usa.",
  },
  {
    pergunta: "Preciso de software para gerenciar obras?",
    resposta:
      "Para uma obra, papel e planilha aguentam. A partir da segunda ou terceira em paralelo, o custo de manter tudo atualizado à mão passa a ser maior que o de usar uma ferramenta — e o risco de decidir com número velho cresce junto.",
  },
  {
    pergunta: "Como manter o cliente informado sobre a obra?",
    resposta:
      "Com relatório periódico do que foi executado, acompanhado de foto e da posição do orçamento. Cliente informado cobra menos e confia mais; o silêncio é o que gera a ligação de cobrança e o desgaste da relação.",
  },
]

const FRENTES = [
  {
    titulo: "Planejamento e orçamento",
    texto:
      "Definir escopo, prazo e custo antes de começar. É a base contra a qual todo o resto vai ser comparado.",
  },
  {
    titulo: "Equipe e profissionais",
    texto:
      "Quem trabalha em qual obra, o que foi combinado e o que já foi pago. Em várias obras ao mesmo tempo, é o que mais se embaralha.",
  },
  {
    titulo: "Execução e prazo",
    texto:
      "O que avançou de fato, registrado no dia. Prazo não se recupera; só se percebe cedo o suficiente para renegociar.",
  },
  {
    titulo: "Financeiro",
    texto:
      "Gasto contra orçamento e recebimento contra cronograma. Obra pode ser lucrativa e ainda assim quebrar o caixa.",
  },
  {
    titulo: "Documentação",
    texto:
      "Diário, comprovantes, notas e fotos guardados por obra. É o que responde quando alguém questiona, meses depois.",
  },
  {
    titulo: "Comunicação com o cliente",
    texto:
      "Relatório com o que foi feito e onde está o orçamento. Transparência reduz cobrança e sustenta a próxima indicação.",
  },
]

export default function GestaoDeObrasPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${SITE_URL}/gestao-de-obras#article`,
        headline: "Gestão de Obras: como coordenar várias obras, equipe e prazo",
        description:
          "Gestão de obras na prática: acompanhar várias obras, coordenar equipe, controlar prazo e informar o cliente.",
        inLanguage: "pt-BR",
        mainEntityOfPage: `${SITE_URL}/gestao-de-obras`,
        image: [`${SITE_URL}/opengraph-image`],
        datePublished: PUBLICADO_EM,
        dateModified: PUBLICADO_EM,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/gestao-de-obras#faq`,
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
          { "@type": "ListItem", position: 2, name: "Gestão de obras", item: `${SITE_URL}/gestao-de-obras` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoPageLayout
        chapeu="Guia prático"
        titulo="Gestão de obras: como coordenar várias obras sem perder o fio"
        subtitulo="Gerenciar uma obra é acompanhar. Gerenciar quatro é outra profissão — e o que quebra não costuma ser a obra difícil, e sim a que ficou sem ninguém olhando por duas semanas."
        ctaTitulo="Todas as suas obras num painel só"
        ctaTexto="O Obreasy organiza orçamento, gasto, equipe e diário por obra, e mostra a posição de cada uma sem você precisar abrir cinco planilhas. Teste sem custo."
      >
        <section>
          <h2 className="text-2xl font-bold text-white">O que a gestão de obras abrange</h2>
          <p className="mt-4">
            Gestão de obras é a coordenação de tudo que precisa acontecer para a obra terminar no
            prazo, no custo e na qualidade combinados. Envolve planejamento, compra, equipes,
            execução, dinheiro e a relação com o cliente — e o desafio raramente é uma dessas
            frentes isolada. É mantê-las todas visíveis ao mesmo tempo.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">As seis frentes que não podem ficar sem dono</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FRENTES.map((item) => (
              <div key={item.titulo} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
                <h3 className="font-semibold text-white">{item.titulo}</h3>
                <p className="mt-2 text-sm text-white/70">{item.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">O ponto em que a gestão deixa de escalar</h2>
          <p className="mt-4">
            Com uma obra, você carrega tudo na cabeça e funciona. Com duas, ainda dá. Da terceira
            em diante aparece o padrão: uma obra recebe atenção, as outras andam sozinhas, e o
            problema surge naquela que ficou sem olhar.
          </p>
          <p className="mt-4">
            O que resolve não é trabalhar mais — é <strong className="text-white">padronizar o
            que se acompanha</strong>. Quando toda obra tem orçamento lançado, gasto registrado no
            dia e diário em ordem, comparar cinco obras vira questão de olhar os mesmos números
            nos mesmos lugares. Sem esse padrão, cada obra é um caso à parte, e aí a conta não
            fecha nunca.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Gestão e o cliente</h2>
          <p className="mt-4">
            Boa parte do desgaste numa obra não vem de erro técnico: vem de silêncio. O cliente
            que não sabe o que está acontecendo preenche a lacuna com desconfiança, e a próxima
            conversa começa em tom de cobrança.
          </p>
          <p className="mt-4">
            Um relatório periódico com o que foi executado, foto e a posição do orçamento muda
            essa dinâmica inteira — e costuma ser o que faz o cliente indicar você para o próximo.
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
            <Link href="/controle-de-obras" className="text-[#7eaaee] underline-offset-4 hover:underline">
              controle de obras
            </Link>{" "}
            e{" "}
            <Link href="/app" className="text-[#7eaaee] underline-offset-4 hover:underline">
              o aplicativo Obreasy
            </Link>
            .
          </p>
        </section>
      </SeoPageLayout>
    </>
  )
}
