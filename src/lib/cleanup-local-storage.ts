/**
 * Limpeza one-time: remove anexos em base64 (data:...) do localStorage.
 *
 * Contexto: versões antigas do app gravavam o comprovante como data URL (base64)
 * dentro de campos `anexo` / `comprovanteAnexo` em `despesas` e
 * `profissionais.contrato.anexo` no localStorage. Isso inflava o JSON local
 * para vários MB e fazia cada save/leitura bloquear a main thread.
 *
 * A partir do PR #9, comprovantes vão para Supabase Storage e o campo passa
 * a guardar só URL pública. O localStorage deixou de ser fonte de verdade.
 * Esta função roda uma única vez no primeiro load após deploy, zera os
 * base64 legados e grava um flag para não repetir.
 */
const CLEANUP_FLAG = "cleanup_anexos_v1"

function isBase64DataUrl(value: unknown): boolean {
  return typeof value === "string" && value.startsWith("data:") && value.length > 1024
}

export function cleanupLocalStorageBase64(): void {
  if (typeof window === "undefined") return
  try {
    if (localStorage.getItem(CLEANUP_FLAG) === "done") return

    // Despesas: campo "anexo" / "comprovanteAnexo"
    try {
      const raw = localStorage.getItem("despesas")
      if (raw) {
        const list = JSON.parse(raw)
        if (Array.isArray(list)) {
          let mudou = false
          for (const item of list) {
            if (item && isBase64DataUrl(item.anexo)) { item.anexo = null; mudou = true }
            if (item && isBase64DataUrl(item.comprovanteAnexo)) { item.comprovanteAnexo = null; mudou = true }
          }
          if (mudou) localStorage.setItem("despesas", JSON.stringify(list))
        }
      }
    } catch { /* silencioso */ }

    // Profissionais: campo "contrato.anexo"
    try {
      const raw = localStorage.getItem("profissionais")
      if (raw) {
        const list = JSON.parse(raw)
        if (Array.isArray(list)) {
          let mudou = false
          for (const item of list) {
            if (item && item.contrato && isBase64DataUrl(item.contrato.anexo)) {
              item.contrato.anexo = null
              mudou = true
            }
          }
          if (mudou) localStorage.setItem("profissionais", JSON.stringify(list))
        }
      }
    } catch { /* silencioso */ }

    localStorage.setItem(CLEANUP_FLAG, "done")
  } catch {
    // Qualquer falha (ex.: QuotaExceeded em ambiente muito pequeno) não deve
    // quebrar o app — segue sem marcar o flag e tentamos de novo no próximo load.
  }
}
