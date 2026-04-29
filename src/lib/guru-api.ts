const GURU_API_BASE_URL = process.env.GURU_API_BASE_URL || "https://digitalmanager.guru/api/v2"

export interface CancelSubscriptionOptions {
  cancelAtCycleEnd?: boolean
  comment?: string
}

export interface CancelSubscriptionResult {
  ok: true
  status: string
  type: string
}

export class GuruApiError extends Error {
  constructor(public httpStatus: number, public code: string, message: string) {
    super(message)
    this.name = "GuruApiError"
  }
}

export async function cancelGuruSubscription(
  subscriptionId: string,
  opts: CancelSubscriptionOptions = {}
): Promise<CancelSubscriptionResult> {
  const token = process.env.GURU_API_TOKEN
  if (!token) {
    throw new GuruApiError(500, "missing_token", "GURU_API_TOKEN não configurado")
  }
  if (!subscriptionId) {
    throw new GuruApiError(400, "missing_id", "subscriptionId obrigatório")
  }

  const url = `${GURU_API_BASE_URL}/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cancel_at_cycle_end: opts.cancelAtCycleEnd ?? true,
      comment: opts.comment ?? "",
    }),
  })

  let body: any = null
  try { body = await res.json() } catch { /* ignore */ }

  if (res.status === 200) {
    return {
      ok: true,
      status: body?.status ?? "success",
      type: body?.type ?? "subscription_send_to_be_cancelled",
    }
  }

  if (res.status === 401) {
    throw new GuruApiError(401, "unauthorized", "Token Guru inválido ou expirado")
  }
  if (res.status === 403) {
    throw new GuruApiError(403, "not_cancellable", "Esta assinatura não pode ser cancelada")
  }
  if (res.status === 404) {
    throw new GuruApiError(404, "not_found", "Assinatura não encontrada no Guru")
  }

  const detail = typeof body?.message === "string" ? body.message : `HTTP ${res.status}`
  throw new GuruApiError(res.status, "guru_error", detail)
}
