/**
 * Seed da conta de teste E2E (QA) — projeto Obreasy (blietvjzchjrzbmkitha).
 *
 * Cria/garante:
 *  - usuário auth confirmado (login direto, sem e-mail de confirmação)
 *  - user_profiles (trial)
 *  - 1 obra de teste
 *  - 2 profissionais com valor_previsto
 *  - estado limpo: zera pagamentos/despesas antigos do usuário
 *
 * Uso:
 *   node --env-file=.env.local tests/e2e/seed.mjs
 *
 * Saída: tests/e2e/.seed.json (consumido pelos specs Playwright).
 */
import { createClient } from "@supabase/supabase-js"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !SERVICE_KEY) {
  console.error("[seed] Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Rode com: node --env-file=.env.local tests/e2e/seed.mjs")
  process.exit(1)
}

// Guard de segurança: nunca rodar contra outro projeto sem querer.
if (!URL.includes("blietvjzchjrzbmkitha")) {
  console.error(`[seed] ABORTADO: URL do Supabase inesperada (${URL}). Esperado o projeto blietvjzchjrzbmkitha (Obreasy).`)
  process.exit(1)
}

export const TEST_EMAIL = "e2e.pagamentos@obreasy.com.br"
export const TEST_PASSWORD = "E2eObreasy2026!"

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(email) {
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((u) => u.email === email)
    if (found) return found
    if (data.users.length < 200) return null
  }
  return null
}

async function main() {
  // 1. Usuário auth (idempotente)
  let user = await findUserByEmail(TEST_EMAIL)
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { firstName: "QA", lastName: "Pagamentos", phone: "(17) 99999-9999" },
    })
    if (error) throw error
    user = data.user
    console.log("[seed] usuário criado:", user.id)
  } else {
    // garante senha conhecida + e-mail confirmado
    await admin.auth.admin.updateUserById(user.id, { password: TEST_PASSWORD, email_confirm: true })
    console.log("[seed] usuário já existia, senha resetada:", user.id)
  }

  // 2. user_profiles (upsert — pode já existir via trigger)
  const { error: profErr } = await admin.from("user_profiles").upsert(
    {
      id: user.id,
      first_name: "QA",
      last_name: "Pagamentos",
      phone: "(17) 99999-9999",
      plano: "trial",
      status: "trial",
      plano_expira_em: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      profile_type: "builder",
      marketing_optin: false,
    },
    { onConflict: "id" },
  )
  if (profErr) throw profErr

  // 3. Estado limpo — apaga dados antigos do usuário de teste
  await admin.from("pagamentos").delete().eq("user_id", user.id)
  await admin.from("despesas").delete().eq("user_id", user.id)
  await admin.from("profissionais").delete().eq("user_id", user.id)
  await admin.from("obras").delete().eq("user_id", user.id)

  // 4. Obra de teste
  const { data: obra, error: obraErr } = await admin
    .from("obras")
    .insert({
      user_id: user.id,
      nome: "QA E2E Pagamentos",
      tipo: "construcao",
      area: 200,
      localizacao: { estado: "SP", cidade: "Votuporanga" },
      orcamento: null,
      nome_cliente: "Cliente QA",
    })
    .select()
    .single()
  if (obraErr) throw obraErr

  // 5. Profissionais
  const { data: profs, error: profsErr } = await admin
    .from("profissionais")
    .insert([
      { user_id: user.id, obra_id: obra.id, nome: "Paulo", funcao: "Pedreiro", valor_previsto: 160000 },
      { user_id: user.id, obra_id: obra.id, nome: "Jose", funcao: "Pintor", valor_previsto: 45000 },
    ])
    .select()
  if (profsErr) throw profsErr

  const seed = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    userId: user.id,
    obraId: obra.id,
    profissionais: profs
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((p) => ({ id: p.id, nome: p.nome, funcao: p.funcao, valorPrevisto: p.valor_previsto })),
  }

  const dir = path.dirname(fileURLToPath(import.meta.url))
  fs.writeFileSync(path.join(dir, ".seed.json"), JSON.stringify(seed, null, 2))
  console.log("[seed] OK\n" + JSON.stringify(seed, null, 2))
}

main().catch((e) => {
  console.error("[seed] FALHOU:", e)
  process.exit(1)
})
