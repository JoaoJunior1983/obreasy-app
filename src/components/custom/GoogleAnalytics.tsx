import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js).
 *
 * O fallback existe pela mesma razão do `supabase.ts` e do `site-url.ts`: o
 * deploy sai por CLI de uma cópia sem `.git`, e o `.vercelignore` (com razão)
 * exclui o `.env` do upload — então `NEXT_PUBLIC_*` não é substituída na
 * geração das páginas estáticas e chega vazia. Sem o fallback o componente
 * devolvia null e o site ficou sem medição nenhuma, silenciosamente.
 *
 * Hardcodar aqui é seguro: o Measurement ID é público por natureza, aparece no
 * HTML de qualquer visitante. A variável de ambiente continua tendo precedência
 * para quem quiser apontar outra propriedade.
 *
 * A medição otimizada da propriedade cobre as trocas de rota do App Router
 * (eventos de history), então não há listener manual de navegação aqui.
 */
const GA_ID_PADRAO = "G-ERXWYZ8144";

const GA_ID = (process.env.NEXT_PUBLIC_GA_ID || GA_ID_PADRAO).trim();

export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
