import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.obreasy.com.br"

// Antes deste arquivo o /robots.txt caía na página 404 do app (que serve noindex),
// então nenhum buscador tinha instrução de rastreamento.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Áreas autenticadas e utilitárias não têm valor de busca e só gastam
        // orçamento de rastreamento.
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/obras",
          "/obras/",
          "/despesas",
          "/relatorios/",
          "/reset-password",
          "/trial/",
          "/equipe",
          "/em-breve",
          "/test-supabase",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
