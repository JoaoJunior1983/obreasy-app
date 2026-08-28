import type { Metadata } from "next"
import Link from "next/link"
import SeoPageLayout from "@/components/custom/seo-page-layout"
import { SITE_URL } from "@/lib/site-url"

const PUBLICADO_EM = "2026-08-28"

export const metadata: Metadata = {
  title: "Aplicativo Obreasy: controle de obras no celular e no computador",
  description:
    "Conheça o Obreasy: orçamento, gastos, pagamento de profissionais, diário de obra com fotos e relatório em PDF. Funciona no celular e no computador, com teste grátis.",
  keywords: [
    "aplicativo para controle de obras",
    "app de gestão de obras",
    "aplicativo obreasy",
    "software de controle de obras",
    "aplicativo para reforma",
  ],
  alternates: { canonical: "/app" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${SITE_URL}/app`,
    siteName: "Obreasy",
    title: "Aplicativo Obreasy: controle de obras no celular e no computador",
    description:
      "Orçamento, gastos, profissionais, diário de obra e relatório em PDF num aplicativo só.",
  },
}

const RECURSOS = [
  {
    titulo: "Orçamento e gastos",
    texto:
      "Você lança o orçamento previsto e cada despesa que acontece. O app mostra a diferença entre os dois em tempo real, por obra e por categoria.",
  },
  {
    titulo: "Alerta de estouro",
    texto:
      "Defina o limite que te deixa confortável e receba aviso quando a obra passar dele. O estouro percebido cedo ainda dá para corrigir.",
  },
  {
    titulo: "Profissionais e pagamentos",
    texto:
      "Cadastro de quem trabalha em cada obra, o que foi combinado, o que já foi pago e o comprovante anexado à baixa.",
  },
  {
    titulo: "Diário de obra com foto",
    texto:
      "Registro do dia direto do canteiro, com imagem. O histórico fica organizado por data e vira relatório quando você precisar.",
  },
  {
    titulo: "Relatórios em PDF",
    texto:
      "Um documento pronto para enviar ao cliente, com o que foi executado e a posição do orçamento. Sem montar nada à mão.",
  },
  {
    titulo: "Custo por metro quadrado",
    texto:
      "Calculado enquanto a obra corre. Serve para conferir se você está dentro da curva e para orçar a próxima com número real.",
  },
]

export default function AppPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/app#webpage`,
        name: "Aplicativo Obreasy: controle de obras no celular e no computador",
        description:
          "Orçamento, gastos, profissionais, diário de obra e relatório em PDF num aplicativo só.",
        inLanguage: "pt-BR",
        datePublished: PUBLICADO_EM,
        dateModified: PUBLICADO_EM,
        about: { "@id": `${SITE_URL}/#app` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "O aplicativo", item: `${SITE_URL}/app` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoPageLayout
        chapeu="O aplicativo"
        titulo="Obreasy: a obra inteira na palma da mão"
        subtitulo="Um aplicativo para quem toca obra e precisa saber, a qualquer momento, quanto já gastou, quem falta pagar e o que foi feito ontem. Funciona no celular, no canteiro, e também no computador."
        ctaTitulo="Comece a usar hoje"
        ctaTexto="Você cria a conta, cadastra a primeira obra e já lança o primeiro gasto em poucos minutos. Sem instalação complicada e sem compromisso."
      >
        <section>
          <h2 className="text-2xl font-bold text-white">Para quem é</h2>
          <p className="mt-4">
            Engenheiros, arquitetos, construtores e mestres de obra que tocam obra de verdade e
            não têm equipe administrativa atrás. Também serve para quem está construindo ou
            reformando a própria casa e quer entender para onde o dinheiro está indo.
          </p>
          <p className="mt-4">
            O que essas pessoas têm em comum é o problema: a informação da obra existe, mas está
            espalhada — nota no bolso, combinado no WhatsApp, planilha no computador, foto na
            galeria. O Obreasy junta isso num lugar só.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">O que o aplicativo faz</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {RECURSOS.map((item) => (
              <div key={item.titulo} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
                <h3 className="font-semibold text-white">{item.titulo}</h3>
                <p className="mt-2 text-sm text-white/70">{item.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">No celular e no computador</h2>
          <p className="mt-4">
            O lançamento acontece onde a obra está, então o celular é o lugar natural para
            registrar gasto e diário. Já a hora de olhar os números com calma, comparar obras e
            gerar relatório costuma ser no escritório — e as duas telas mostram os mesmos dados,
            sem exportar nada.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">Como começar</h2>
          <ol className="mt-4 space-y-3 list-decimal pl-5 marker:text-[#7eaaee] marker:font-semibold">
            <li>Crie sua conta e cadastre a primeira obra com o orçamento previsto.</li>
            <li>Lance os gastos conforme eles acontecem, com foto da nota quando tiver.</li>
            <li>Registre o dia no diário e cadastre quem está trabalhando.</li>
            <li>Acompanhe a diferença entre previsto e realizado, e gere o relatório para o cliente.</li>
          </ol>
          <p className="mt-6">
            Os planos e o que cada um inclui ficam em{" "}
            <Link href="/dashboard/plano" className="text-[#7eaaee] underline-offset-4 hover:underline">
              planos do Obreasy
            </Link>
            , dentro do app.
          </p>
        </section>

        <section>
          <p className="text-sm text-white/60">
            Conteúdos relacionados:{" "}
            <Link href="/diario-de-obra" className="text-[#7eaaee] underline-offset-4 hover:underline">diário de obra</Link>,{" "}
            <Link href="/orcamento-de-obra" className="text-[#7eaaee] underline-offset-4 hover:underline">orçamento de obra</Link>,{" "}
            <Link href="/controle-de-obras" className="text-[#7eaaee] underline-offset-4 hover:underline">controle de obras</Link>{" "}
            e{" "}
            <Link href="/gestao-de-obras" className="text-[#7eaaee] underline-offset-4 hover:underline">gestão de obras</Link>.
          </p>
        </section>
      </SeoPageLayout>
    </>
  )
}
