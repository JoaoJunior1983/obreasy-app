import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site-url"

// Só entram páginas públicas e indexáveis: as telas do app ficam atrás de login
// e não têm valor de busca.
export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date()

  return [
    { url: `${SITE_URL}/`, lastModified: agora, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/diario-de-obra`, lastModified: agora, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/cadastro`, lastModified: agora, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified: agora, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/suporte`, lastModified: agora, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/termos`, lastModified: agora, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacidade`, lastModified: agora, changeFrequency: "yearly", priority: 0.3 },
  ]
}
