import type { Metadata } from "next"
import Link from "next/link"
import SeoPageLayout from "@/components/custom/seo-page-layout"
import { SITE_URL } from "@/lib/site-url"

const PUBLICADO_EM = "2026-08-28"

export const metadata: Metadata = {
  title: "Orçamento de Obra: como fazer, o que incluir e erros que estouram o custo",
  description:
    "Como montar um orçamento de obra que se sustenta até o fim: o que precisa entrar, como calcular custo por metro quadrado, a reserva de imprevistos e os erros que fazem a obra estourar.",
  keywords: [
    "orçamento de obra",
    "orçamento de construção",
    "como fazer orçamento de obra",
    "custo por metro quadrado",
    "planilha de orçamento de obra",
    "orçamento de reforma",
  ],
  alternates: { canonical: "/orcamento-de-obra" },
  openGraph: {
    type: "article",
    locale: "pt_BR",
    url: `${SITE_URL}/orcamento-de-obra`,
    siteName: "Obreasy",
    title: "Orçamento de Obra: como fazer, o que incluir e erros que estouram o custo",
    description:
      "O que precisa entrar no orçamento, como chegar no custo por metro quadrado e por que a obra estoura mesmo com orçamento pronto.",
  },
}

const FAQ = [
  {
    pergunta: "Como calcular o custo por metro quadrado da obra?",
    resposta:
      "Divida o custo total pela área construída. O número serve para comparar obras e para estimar as próximas, mas cuidado: ele muda muito com o padrão de acabamento, com a região e com a complexidade do terreno. Custo por metro quadrado é bom para conferir se você está fora da curva, não para fechar preço.",
  },
  {
    pergunta: "Quanto reservar para imprevistos numa obra?",
    resposta:
      "A faixa que se pratica é de 10% a 20% do valor total, e quanto mais antiga a construção ou mais incerto o terreno, mais perto de 20%. Reforma costuma exigir reserva maior que obra nova, porque só ao abrir a parede você descobre o que existe atrás dela.",
  },
  {
    pergunta: "Qual a diferença entre orçamento e custo real da obra?",
    resposta:
      "O orçamento é a previsão; o custo real é o que de fato saiu do caixa. A distância entre os dois é o que define se a obra deu lucro. Por isso um orçamento só cumpre a função dele se o gasto for lançado e comparado com a previsão enquanto a obra acontece — depois de pronta, o número só serve como lição.",
  },
  {
    pergunta: "Preciso incluir mão de obra e impostos no orçamento?",
    resposta:
      "Sim, e é justamente onde a maioria erra. Material é a parte fácil de levantar. Mão de obra, encargos, aluguel de equipamento, transporte, taxas, ART ou RRT e a sua margem também precisam estar lá — senão o orçamento fica bonito e o resultado, negativo.",
  },
  {
    pergunta: "Dá para fazer orçamento de obra em planilha?",
    resposta:
      "Dá, e muita gente faz. O problema não é montar a planilha, é mantê-la: a obra muda toda semana, as notas chegam pelo WhatsApp e a versão que está no seu computador nunca é a mesma que está na obra. Acompanhar o gasto contra o previsto pelo celular resolve esse descolamento.",
  },
]

const COMPOE = [
  {
    titulo: "Material",
    texto:
      "Da fundação ao acabamento, com quantidade e preço de referência. É a parte mais fácil de levantar e a que menos costuma surpreender.",
  },
  {
    titulo: "Mão de obra e encargos",
    texto:
      "Equipe própria ou empreitada, com os encargos de verdade. Orçar mão de obra pelo valor cru do salário é o erro mais caro da lista.",
  },
  {
    titulo: "Equipamentos e transporte",
    texto:
      "Betoneira, andaime, caçamba, frete de material. Cada item é pequeno; somados costumam passar do que se imagina.",
  },
  {
    titulo: "Taxas e documentação",
    texto:
      "Alvará, ART ou RRT, ligações provisórias de água e luz, habite-se. Não são obra, mas saem do mesmo caixa.",
  },
  {
    titulo: "Reserva para imprevistos",
    texto:
      "De 10% a 20%. Não é gordura: é o item que evita ter de pedir dinheiro ao cliente no meio da obra.",
  },
  {
    titulo: "Sua margem",
    texto:
      "Se a margem não está no orçamento, ela vai ser consumida pelo primeiro imprevisto — e você trabalha de graça sem perceber.",
  },
]

export default function OrcamentoDeObraPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${SITE_URL}/orcamento-de-obra#article`,
        headline: "Orçamento de Obra: como fazer, o que incluir e erros que estouram o custo",
        description:
          "Como montar um orçamento de obra que se sustenta: o que incluir, custo por metro quadrado, reserva de imprevistos e os erros mais comuns.",
        inLanguage: "pt-BR",
        mainEntityOfPage: `${SITE_URL}/orcamento-de-obra`,
        image: [`${SITE_URL}/opengraph-image`],
        datePublished: PUBLICADO_EM,
        dateModified: PUBLICADO_EM,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/orcamento-de-obra#faq`,
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
          { "@type": "ListItem", position: 2, name: "Orçamento de obra", item: `${SITE_URL}/orcamento-de-obra` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoPageLayout
        chapeu="Guia prático"
        titulo="Orçamento de obra: como fazer, o que incluir e o que faz estourar"
        subtitulo="Quase toda obra tem orçamento. O que separa a que fecha no azul da que estoura não é ter a planilha — é o que entrou nela e o que se faz com ela depois que a obra começa."
        ctaTitulo="Acompanhe o gasto contra o previsto"
        ctaTexto="O Obreasy compara o que você orçou com o que já saiu do caixa, avisa quando a obra passa do limite que você definiu e mostra o custo por metro quadrado atualizado. Teste sem custo."
      >
        <section>
          <h2 className="text-2xl font-bold text-white">O que é o orçamento de obra</h2>
          <p className="mt-4">
            O orçamento é a previsão de quanto a obra vai custar, item por item, antes de ela
            começar. Serve para três coisas: decidir se a obra é viável, fechar preço com o
            cliente e, principalmente, ter contra o que comparar o gasto enquanto a obra acontece.
          </p>
          <p className="mt-4">
            Essa terceira função é a que costuma ser esquecida. Um orçamento que fica salvo numa
            pasta e nunca mais é aberto não impediu nenhuma obra de estourar.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">O que precisa entrar</h2>
          <p className="mt-4">
            Seis grupos. Faltando qualquer um, o número final está errado — e o erro só aparece
            quando o dinheiro já foi gasto:
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {COMPOE.map((item) => (
              <div key={item.titulo} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
                <h3 className="font-semibold text-white">{item.titulo}</h3>
                <p className="mt-2 text-sm text-white/70">{item.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Custo por metro quadrado</h2>
          <p className="mt-4">
            É a conta mais pedida e a mais mal usada. Você chega nela dividindo o custo total pela
            área construída, e ela é ótima para uma coisa: perceber que você está fora da curva.
            Se a sua obra deu um valor por metro muito abaixo do que se pratica na região, quase
            sempre falta item no orçamento.
          </p>
          <p className="mt-4">
            O que ela não faz é fechar preço. Duas casas do mesmo tamanho podem ter custos bem
            diferentes conforme o acabamento, o terreno e a complexidade da estrutura. Use o valor
            por metro como termômetro, nunca como orçamento.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Os erros que estouram a obra</h2>
          <ol className="mt-4 space-y-3 list-decimal pl-5 marker:text-[#7eaaee] marker:font-semibold">
            <li>
              <strong className="text-white">Orçar só material.</strong> Mão de obra e encargos
              costumam pesar tanto quanto, e é a conta que o cliente não vê vindo.
            </li>
            <li>
              <strong className="text-white">Não reservar para imprevisto.</strong> Sem os 10% a
              20%, a primeira surpresa vira conversa constrangedora com o cliente.
            </li>
            <li>
              <strong className="text-white">Aceitar mudança de escopo sem reorçar.</strong> O
              &quot;já que você está aí, aproveita e faz&quot; é o que come a margem em silêncio.
            </li>
            <li>
              <strong className="text-white">Não comparar o gasto com o previsto.</strong> Quando
              se descobre o estouro no fim da obra, não há mais o que fazer. Comparando toda
              semana, dá tempo de corrigir.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Planilha ou aplicativo</h2>
          <p className="mt-4">
            A planilha funciona bem para montar o orçamento. O problema aparece depois: a obra
            muda toda semana, a nota do material chega por foto no WhatsApp, o pagamento do
            pedreiro é combinado no canteiro, e a planilha que está no computador do escritório
            envelhece em dias.
          </p>
          <p className="mt-4">
            Acompanhar pelo celular resolve esse descolamento: o gasto entra na hora em que
            acontece e a comparação com o previsto fica sempre atual — que é justamente quando
            ela ainda serve para alguma coisa.
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
            <Link href="/diario-de-obra" className="text-[#7eaaee] underline-offset-4 hover:underline">
              diário de obra
            </Link>
            .
          </p>
        </section>
      </SeoPageLayout>
    </>
  )
}
