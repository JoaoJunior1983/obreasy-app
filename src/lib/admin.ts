export const ADMIN_EMAILS = [
  "cleyton@lasy.ai",
  "joaojrsilva@hotmail.com",
  "giovanni@lasy.ai",
] as const

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return (ADMIN_EMAILS as readonly string[]).includes(normalized)
}
