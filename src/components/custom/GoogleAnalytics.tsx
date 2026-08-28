import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js).
 *
 * Só renderiza quando NEXT_PUBLIC_GA_ID está definida, então ambiente local e
 * preview sem a variável não mandam dado pra propriedade de produção. A
 * medição otimizada da propriedade cobre as trocas de rota do App Router
 * (eventos de history), então não há listener manual de navegação aqui.
 */
const GA_ID = (process.env.NEXT_PUBLIC_GA_ID || "").trim();

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
