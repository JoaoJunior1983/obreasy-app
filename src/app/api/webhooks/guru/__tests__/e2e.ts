/**
 * E2E test for Digital Manager Guru webhooks.
 *
 * Run with: npx tsx src/app/api/webhooks/guru/__tests__/e2e.ts
 *
 * Requires:
 * - The Next.js dev server running on localhost:3000
 * - GURU_API_TOKEN set in .env.local
 * - A test user already registered in Supabase Auth + user_profiles
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000"
const API_TOKEN = process.env.GURU_API_TOKEN || "euFx0Oj31isoTY9t9JjsSF1RTzG70SFDs7TWfmTr"
const TEST_EMAIL = process.env.TEST_EMAIL || "test@obreasy.com.br"

interface TestResult {
  name: string
  passed: boolean
  detail: string
}

const results: TestResult[] = []

function assert(name: string, condition: boolean, detail: string) {
  results.push({ name, passed: condition, detail })
  const icon = condition ? "PASS" : "FAIL"
  console.log(`  [${icon}] ${name}: ${detail}`)
}

async function postWebhook(path: string, body: Record<string, unknown>): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return { status: res.status, data }
}

function makeSubscriptionPayload(overrides: Record<string, unknown> = {}) {
  return {
    api_token: API_TOKEN,
    webhook_type: "subscription",
    id: `test-sub-${Date.now()}`,
    internal_id: "int-1",
    last_status: "active",
    name: "Plano Essencial",
    charged_times: 1,
    charged_every_days: 30,
    trial_days: 0,
    cancel_reason: null,
    cancel_at_cycle_end: 0,
    payment_method: "credit_card",
    subscription_code: "SUB-001",
    provider: "guru",
    dates: {
      started_at: new Date().toISOString(),
      cycle_start_date: new Date().toISOString(),
      cycle_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      next_cycle_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      canceled_at: null,
      last_status_at: new Date().toISOString(),
    },
    subscriber: {
      id: "sub-1",
      name: "Test User",
      email: TEST_EMAIL,
      doc: null,
      phone_number: null,
      phone_local_code: null,
    },
    product: {
      id: "prod-1",
      name: "Obreasy Essencial",
      marketplace_id: "mp-1",
      marketplace_name: "Obreasy",
      offer: {
        id: "a11066a1-241e-46de-836b-8cac701bcb53",
        name: "Essencial Mensal",
        value: 2990,
      },
    },
    current_invoice: {
      id: "inv-1",
      code: "INV-001",
      cycle: 1,
      value: 2990,
      status: "paid",
      charge_at: new Date().toISOString(),
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_id: "test-sub-1",
    },
    last_transaction: {
      id: "tx-1",
      status: "approved",
      contact: { id: "c-1", email: TEST_EMAIL, name: "Test User" },
      payment: { method: "credit_card", total: 2990, currency: "BRL" },
    },
    ...overrides,
  }
}

function makeTransactionPayload(overrides: Record<string, unknown> = {}) {
  return {
    api_token: API_TOKEN,
    webhook_type: "transaction",
    id: `test-tx-${Date.now()}`,
    status: "approved",
    contact: {
      id: "c-1",
      email: TEST_EMAIL,
      name: "Test User",
    },
    payment: {
      method: "pix",
      total: 30480,
      currency: "BRL",
    },
    product: {
      id: "prod-1",
      name: "Obreasy Essencial Anual",
      type: "subscription",
      offer: { id: "a1106880-7aa9-46c6-a844-8b5fdb23a138", name: "Essencial Anual" },
    },
    ...overrides,
  }
}

async function testInvalidToken() {
  console.log("\n--- Test: Invalid API Token ---")
  const { status, data } = await postWebhook("/api/webhooks/guru/subscription", {
    api_token: "wrong-token",
    webhook_type: "subscription",
  })
  assert("Invalid token returns 401", status === 401, `status=${status}`)
  assert("Error message present", data.error === "Invalid api_token", JSON.stringify(data))
}

async function testInvalidWebhookType() {
  console.log("\n--- Test: Invalid Webhook Type ---")
  const { status, data } = await postWebhook("/api/webhooks/guru/subscription", {
    api_token: API_TOKEN,
    webhook_type: "unknown",
  })
  assert("Invalid webhook_type returns 400", status === 400, `status=${status}`)
}

async function testSubscriptionActive() {
  console.log("\n--- Test: Subscription Active ---")
  const payload = makeSubscriptionPayload()
  const { status, data } = await postWebhook("/api/webhooks/guru/subscription", payload)
  assert("Returns 200", status === 200, `status=${status}`)
  assert(
    "Status is processed or user_not_found",
    data.status === "processed" || data.status === "user_not_found",
    `status=${data.status}`
  )
}

async function testSubscriptionPastdue() {
  console.log("\n--- Test: Subscription Pastdue ---")
  const payload = makeSubscriptionPayload({
    id: `test-sub-pastdue-${Date.now()}`,
    last_status: "pastdue",
  })
  const { status, data } = await postWebhook("/api/webhooks/guru/subscription", payload)
  assert("Returns 200", status === 200, `status=${status}`)
  assert(
    "Processed or user_not_found",
    data.status === "processed" || data.status === "user_not_found",
    `status=${data.status}`
  )
  if (data.status === "processed") {
    assert("Status maps to overdue", data.subscriptionStatus === "overdue", `subscriptionStatus=${data.subscriptionStatus}`)
  }
}

async function testIdempotency() {
  console.log("\n--- Test: Idempotency ---")
  const subId = `test-sub-idemp-${Date.now()}`
  const payload = makeSubscriptionPayload({ id: subId })

  const { data: first } = await postWebhook("/api/webhooks/guru/subscription", payload)
  const { data: second } = await postWebhook("/api/webhooks/guru/subscription", payload)

  assert(
    "Second call returns already_processed",
    second.status === "already_processed",
    `first=${first.status}, second=${second.status}`
  )
}

async function testTransactionPix() {
  console.log("\n--- Test: Pix Transaction ---")
  const payload = makeTransactionPayload()
  const { status, data } = await postWebhook("/api/webhooks/guru/transaction", payload)
  assert("Returns 200", status === 200, `status=${status}`)
  assert(
    "Processed or user_not_found",
    data.status === "processed" || data.status === "user_not_found" || data.status === "no_email",
    `status=${data.status}`
  )
}

async function testTransactionWithSubscriptionType() {
  console.log("\n--- Test: Transaction endpoint receiving subscription webhook ---")
  const payload = makeSubscriptionPayload({
    id: `test-sub-via-tx-${Date.now()}`,
  })
  const { status, data } = await postWebhook("/api/webhooks/guru/transaction", payload)
  assert("Returns 200", status === 200, `status=${status}`)
  assert(
    "Handled as subscription",
    data.status === "processed" || data.status === "user_not_found" || data.status === "no_email",
    `status=${data.status}`
  )
}

async function testGracePeriodLogic() {
  console.log("\n--- Test: Grace Period Logic (unit) ---")

  const { getGracePeriodStatus, getGraceDaysRemaining } = await import("../../../../../lib/guru-plans")

  const now = Date.now()
  const h = 60 * 60 * 1000

  assert(
    "Future date = ok",
    getGracePeriodStatus(new Date(now + 24 * h).toISOString(), null) === "ok",
    "ok"
  )
  assert(
    "12h ago = overdue_day1",
    getGracePeriodStatus(new Date(now - 12 * h).toISOString(), null) === "overdue_day1",
    "overdue_day1"
  )
  assert(
    "36h ago = overdue_day2",
    getGracePeriodStatus(new Date(now - 36 * h).toISOString(), null) === "overdue_day2",
    "overdue_day2"
  )
  assert(
    "60h ago = overdue_day3",
    getGracePeriodStatus(new Date(now - 60 * h).toISOString(), null) === "overdue_day3",
    "overdue_day3"
  )
  assert(
    "96h ago = blocked",
    getGracePeriodStatus(new Date(now - 96 * h).toISOString(), null) === "blocked",
    "blocked"
  )
  assert(
    "Grace days remaining 36h ago = 2",
    getGraceDaysRemaining(new Date(now - 36 * h).toISOString(), null) === 2,
    `remaining=${getGraceDaysRemaining(new Date(now - 36 * h).toISOString(), null)}`
  )
  assert(
    "Grace days remaining 96h ago = 0",
    getGraceDaysRemaining(new Date(now - 96 * h).toISOString(), null) === 0,
    `remaining=${getGraceDaysRemaining(new Date(now - 96 * h).toISOString(), null)}`
  )
}

async function main() {
  console.log("========================================")
  console.log("  Guru Webhook E2E Tests")
  console.log(`  Server: ${BASE_URL}`)
  console.log(`  Token: ${API_TOKEN.slice(0, 10)}...`)
  console.log(`  Email: ${TEST_EMAIL}`)
  console.log("========================================")

  await testGracePeriodLogic()
  await testInvalidToken()
  await testInvalidWebhookType()
  await testSubscriptionActive()
  await testSubscriptionPastdue()
  await testIdempotency()
  await testTransactionPix()
  await testTransactionWithSubscriptionType()

  console.log("\n========================================")
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  console.log(`  Results: ${passed} passed, ${failed} failed (${results.length} total)`)
  console.log("========================================")

  if (failed > 0) {
    console.log("\nFailed tests:")
    results.filter((r) => !r.passed).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error("Fatal:", e)
  process.exit(1)
})
