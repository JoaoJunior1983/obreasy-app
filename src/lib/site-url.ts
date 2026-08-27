/**
 * URL pública do site, saneada.
 *
 * A variável de ambiente chegou a ficar como "https://obreasy.com.br\r\n" em
 * produção, o que gerava URL quebrada em tudo que a concatena (sitemap,
 * canonical, Open Graph e o redirect de recuperação de senha). O trim aqui
 * evita que um espaço em branco na configuração volte a derrubar essas rotas.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.obreasy.com.br")
  .trim()
  .replace(/\/+$/, "")
