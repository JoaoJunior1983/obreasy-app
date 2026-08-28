import type { Metadata } from "next"
import Link from "next/link"
import SeoPageLayout from "@/components/custom/seo-page-layout"
import { SITE_URL } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "Diário de Obra: o que é, o que registrar e modelo pronto",
  description:
    "Guia completo do diário de obra: para que serve, o que precisa ser registrado todo dia, modelo pronto para copiar e como fazer o diário pelo celular sem papel.",
  keywords: [
    "diário de obra",
    "diario de obra",
    "diário de obra online",
    "app diário de obra",
    "modelo de diário de obra",
    "relatório diário de obra",
    "livro de ocorrências da obra",
  ],
  alternates: { canonical: "/diario-de-obra" },
  openGraph: {
    type: "article",
    locale: "pt_BR",
    url: `${SITE_URL}/diario-de-obra`,
    siteName: "Obreasy",
    title: "Diário de Obra: o que é, o que registrar e modelo pronto",
    description:
      "O que o diário de obra precisa ter, o modelo pronto para copiar e como registrar o dia da obra pelo celular.",
  },
}

// Data de publicação fixa: se viesse de new Date(), toda build reescreveria a
// data e o Google leria a página como recém-alterada sem que nada mudasse.
const PUBLICADO_EM = "2026-08-28"

const FAQ = [
  {
    pergunta: "O diário de obra é obrigatório?",
    resposta:
      "Em obra pública, sim: o registro diário das ocorrências faz parte da fiscalização do contrato e costuma ser exigido pelo órgão contratante. Em obra particular não existe obrigação legal geral, mas o diário costuma ser exigido em contrato e é o documento que sustenta a sua versão dos fatos se houver discussão sobre prazo, aditivo ou qualidade do serviço.",
  },
  {
    pergunta: "Quem deve preencher o diário de obra?",
    resposta:
      "Quem acompanha a execução no canteiro — em geral o mestre de obras, o encarregado ou o engenheiro residente. O responsável técnico pela obra assina e responde pelo conteúdo. O importante é que seja preenchido por quem esteve lá naquele dia, e no mesmo dia.",
  },
  {
    pergunta: "O que acontece se o diário for preenchido depois, tudo de uma vez?",
    resposta:
      "Perde justamente o valor que ele tem. Um diário preenchido semanas depois, com letra igual e sem variação de clima ou efetivo, é frágil como prova e costuma ser questionado. O registro vale porque é feito no dia, com o que aconteceu no dia.",
  },
  {
    pergunta: "Preciso anexar foto no diário de obra?",
    resposta:
      "A foto não é obrigatória, mas é o que transforma o diário em prova visual. Uma anotação dizendo que a laje foi concretada tem um peso; a mesma anotação com a foto da laje no dia tem outro. É o item que mais evita discussão depois.",
  },
  {
    pergunta: "Dá para fazer diário de obra pelo celular?",
    resposta:
      "Sim, e é o formato que mais faz sentido hoje, porque o registro acontece onde a obra está. No Obreasy você lança o dia com texto e foto direto do celular, o histórico fica organizado por data e o relatório sai em PDF para enviar ao cliente.",
  },
]

const ITENS_OBRIGATORIOS = [
  {
    titulo: "Data e condições do tempo",
    texto:
      "Dia, e se choveu, se o tempo impediu concretagem ou serviço externo. É o campo que justifica atraso depois — sem ele, dia parado vira discussão.",
  },
  {
    titulo: "Efetivo de mão de obra",
    texto:
      "Quantas pessoas trabalharam e em quê: pedreiros, serventes, eletricista, encanador. Mostra o ritmo real da obra e sustenta medição.",
  },
  {
    titulo: "Serviços executados",
    texto:
      "O que avançou no dia e em qual parte da obra. Seja específico: 'alvenaria do 2º pavimento, eixo 3 ao 7' vale muito mais que 'alvenaria'.",
  },
  {
    titulo: "Equipamentos e materiais",
    texto:
      "Máquina que operou, material que chegou ou faltou. Falta de material é a causa de atraso mais comum e a mais difícil de provar sem registro.",
  },
  {
    titulo: "Ocorrências e paralisações",
    texto:
      "Acidente, visita da fiscalização, embargo, problema de projeto, ordem verbal do cliente. Tudo que sai do previsto entra aqui.",
  },
  {
    titulo: "Fotos do dia",
    texto:
      "O registro visual do que foi executado. É o que resolve discussão de 'isso não foi feito' meses depois.",
  },
]

export default function DiarioDeObraPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${SITE_URL}/diario-de-obra#article`,
        headline: "Diário de Obra: o que é, o que registrar e modelo pronto",
        description:
          "Guia do diário de obra: para que serve, o que registrar todo dia, modelo pronto e como fazer pelo celular.",
        inLanguage: "pt-BR",
        mainEntityOfPage: `${SITE_URL}/diario-de-obra`,
        // author, image e as datas não são obrigatórios, mas o teste de
        // resultados aprimorados os cobra como recomendados.
        image: [`${SITE_URL}/opengraph-image`],
        datePublished: PUBLICADO_EM,
        dateModified: PUBLICADO_EM,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/diario-de-obra#faq`,
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
          { "@type": "ListItem", position: 2, name: "Diário de obra", item: `${SITE_URL}/diario-de-obra` },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoPageLayout
        chapeu="Guia prático"
        titulo="Diário de obra: o que é, o que registrar e modelo pronto"
        subtitulo="O diário é o documento que conta, dia a dia, o que aconteceu na obra. É ele que responde por você quando alguém pergunta por que o prazo esticou — desde que tenha sido preenchido do jeito certo."
        ctaTitulo="Faça o diário da sua obra pelo celular"
        ctaTexto="O Obreasy registra o dia da obra com foto, guarda o histórico organizado por data e gera o relatório em PDF para enviar ao cliente. Teste sem custo."
      >
        <section>
          <h2 className="text-2xl font-bold text-white">O que é o diário de obra</h2>
          <p className="mt-4">
            O diário de obra é o registro cronológico da execução. A cada dia trabalhado ele
            guarda o que foi feito, quem estava no canteiro, qual era o tempo e o que fugiu do
            previsto. Também é chamado de livro de ocorrências ou relatório diário de obra, e o
            conteúdo é praticamente o mesmo.
          </p>
          <p className="mt-4">
            A função dele não é burocrática. Obra atrasa, material falta, chove uma semana
            inteira, o cliente muda o escopo no meio do caminho — e meses depois ninguém lembra
            em que dia cada coisa aconteceu. O diário é o que transforma memória em documento.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Para que ele serve na prática</h2>
          <p className="mt-4">
            Três situações concretas em que o diário decide o resultado:
          </p>
          <ul className="mt-4 space-y-3">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7eaaee]" />
              <span>
                <strong className="text-white">Justificar prazo.</strong> Onze dias de chuva
                registrados valem como argumento. &quot;Choveu bastante naquele mês&quot; não vale.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7eaaee]" />
              <span>
                <strong className="text-white">Sustentar aditivo.</strong> Serviço pedido
                verbalmente pelo cliente e anotado no dia vira base de cobrança. Não anotado,
                vira prejuízo seu.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7eaaee]" />
              <span>
                <strong className="text-white">Defender a qualidade.</strong> Se aparecer
                patologia depois, o diário mostra quando cada etapa foi executada, com qual
                material e por qual equipe.
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">O que precisa estar em cada registro</h2>
          <p className="mt-4">
            Não existe formato único, mas um diário que não tenha estes seis itens deixa buraco
            justamente onde a discussão costuma acontecer:
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ITENS_OBRIGATORIOS.map((item) => (
              <div
                key={item.titulo}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5"
              >
                <h3 className="font-semibold text-white">{item.titulo}</h3>
                <p className="mt-2 text-sm text-white/70">{item.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Modelo de diário de obra</h2>
          <p className="mt-4">
            Um registro bem feito cabe em poucas linhas. O que importa é ser específico —
            compare o modelo abaixo com um &quot;serviços diversos&quot; genérico e veja qual dos
            dois você gostaria de ter em mãos numa discussão de contrato.
          </p>
          <div className="mt-6 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/30 p-5">
            <pre className="whitespace-pre text-sm leading-relaxed text-white/80">
{`DIÁRIO DE OBRA — Nº 042
Obra: Residência Alvorada, Rua das Acácias, 120
Data: 14/08/2026, quinta-feira
Tempo: manhã chuvosa, tarde firme
Horas paradas por chuva: 3h (manhã)

EFETIVO
1 encarregado, 3 pedreiros, 4 serventes, 1 eletricista

SERVIÇOS EXECUTADOS
- Alvenaria de vedação do 2º pavimento, eixos 3 a 7
- Passagem de eletrodutos das paredes do 1º pavimento
- Retirada de entulho do pavimento térreo

MATERIAIS RECEBIDOS
- 2.000 blocos cerâmicos (NF 8842)
- 40 sacos de argamassa

OCORRÊNCIAS
- Serviço interrompido das 7h às 10h por chuva
- Cliente solicitou verbalmente ponto de tomada extra na
  suíte 2. Orçamento a apresentar, fora do escopo atual.

RESPONSÁVEL: Eng. Marcos Ribeiro — CREA 000000/D`}
            </pre>
          </div>
          <p className="mt-4 text-sm text-white/60">
            Repare na ocorrência do fim: é uma linha, escrita no dia, e é ela que sustenta a
            cobrança do serviço extra três meses depois.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Os erros que anulam o diário</h2>
          <p className="mt-4">
            Um diário mal feito é pior que nenhum, porque dá falsa segurança. Os quatro erros
            mais comuns:
          </p>
          <ol className="mt-4 space-y-3 list-decimal pl-5 marker:text-[#7eaaee] marker:font-semibold">
            <li>
              <strong className="text-white">Preencher tudo no fim da semana.</strong> Some a
              precisão e o documento perde força de prova.
            </li>
            <li>
              <strong className="text-white">Escrever genérico.</strong> &quot;Continuação dos
              serviços&quot; não informa nada e não sustenta medição.
            </li>
            <li>
              <strong className="text-white">Registrar só o que deu certo.</strong> O diário
              existe principalmente para o que deu errado — é o problema anotado que justifica
              prazo e custo.
            </li>
            <li>
              <strong className="text-white">Deixar o caderno na obra.</strong> Papel molha,
              some e some justamente quando é necessário. Digital resolve isso sozinho.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Diário de obra no papel ou digital</h2>
          <p className="mt-4">
            O caderno preso ao canteiro ainda é comum, e funciona enquanto nada acontece. O
            problema aparece na hora de usar: encontrar o dia certo, provar que a anotação é
            daquela data, juntar a foto que ficou no celular de outra pessoa e montar um
            relatório para o cliente.
          </p>
          <p className="mt-4">
            No formato digital, o registro é feito no celular, na hora, com a foto junto. A data
            fica gravada, o histórico não se perde e o relatório sai pronto. É o mesmo documento
            de sempre — sem o risco de depender de um caderno.
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
            <Link href="/" className="text-[#7eaaee] underline-offset-4 hover:underline">
              controle de obras no Obreasy
            </Link>
            .
          </p>
        </section>
      </SeoPageLayout>
    </>
  )
}
