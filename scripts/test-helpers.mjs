// Validação manual das funções puras introduzidas pelos fixes/melhorias.
// Usa jiti (já instalado pelo Next) para importar TS direto.
import assert from "node:assert/strict"
import { createJiti } from "jiti"
import { fileURLToPath } from "node:url"
import path from "node:path"

class FakeStorage {
  constructor() { this.s = new Map() }
  getItem(k) { return this.s.has(k) ? this.s.get(k) : null }
  setItem(k, v) { this.s.set(k, String(v)) }
  removeItem(k) { this.s.delete(k) }
  clear() { this.s.clear() }
}

globalThis.window = globalThis
globalThis.localStorage = new FakeStorage()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")

const jiti = createJiti(__filename, { interopDefault: true })
const cat = await jiti.import(path.join(projectRoot, "src/lib/despesa-categorias.ts"))
const fn = await jiti.import(path.join(projectRoot, "src/lib/profissional-funcoes.ts"))

let passed = 0
let failed = 0
function check(name, body) {
  try { body(); console.log(`  ok   ${name}`); passed++ }
  catch (e) { console.error(`  FAIL ${name}: ${e.message}`); failed++ }
}

console.log("\n— despesa-categorias —")

check("getCategoriaLabel resolve label conhecida", () => {
  assert.equal(cat.getCategoriaLabel("licencas"), "Licenças e Documentação")
})
check("getCategoriaLabel material", () => {
  assert.equal(cat.getCategoriaLabel("material"), "Material de Construção")
})
check("getCategoriaLabel formata desconhecida", () => {
  assert.equal(cat.getCategoriaLabel("taxa_municipal"), "Taxa Municipal")
})
check("getCategoriaLabel mao_obra", () => {
  assert.equal(cat.getCategoriaLabel("mao_obra"), "Mão de Obra")
})
check("getCategoriaLabel vazio", () => {
  assert.equal(cat.getCategoriaLabel(""), "—")
})
check("slugifyCategoria normaliza", () => {
  assert.equal(cat.slugifyCategoria("Taxa Bombeiros"), "taxa_bombeiros")
  assert.equal(cat.slugifyCategoria("Açúcar é Doce!"), "acucar_e_doce")
})

localStorage.clear()
let novaDecoracao
check("addCustomCategoria nova", () => {
  novaDecoracao = cat.addCustomCategoria("Decoração")
  assert.equal(novaDecoracao.label, "Decoração")
  assert.equal(novaDecoracao.value, "decoracao")
})
check("addCustomCategoria duplicada retorna existente", () => {
  const c1 = cat.addCustomCategoria("Decoração")
  const c2 = cat.addCustomCategoria("decoração")
  assert.equal(c1.value, c2.value)
})
check("addCustomCategoria string vazia retorna null", () => {
  assert.equal(cat.addCustomCategoria("   "), null)
})
check("getAllCategorias inclui customizadas", () => {
  const all = cat.getAllCategorias()
  assert.ok(all.find((c) => c.value === "decoracao"))
  assert.ok(all.find((c) => c.value === "material"))
})
check("addCustomCategoria desambigua slug colidido", () => {
  cat.addCustomCategoria("Material 2")
  const all = cat.getAllCategorias()
  const novos = all.filter((c) => c.value === "material" || c.value.startsWith("material_"))
  assert.ok(novos.length >= 2, `esperava 2+ items, achei ${novos.length}`)
})
check("getCategoriaLabel resolve customizada", () => {
  assert.equal(cat.getCategoriaLabel("decoracao"), "Decoração")
})

console.log("\n— profissional-funcoes —")

check("formatarTelefoneBR vazio", () => {
  assert.equal(fn.formatarTelefoneBR(""), "")
})
check("formatarTelefoneBR 2 digitos", () => {
  assert.equal(fn.formatarTelefoneBR("11"), "(11")
})
check("formatarTelefoneBR 7 digitos", () => {
  assert.equal(fn.formatarTelefoneBR("1199999"), "(11) 99999")
})
check("formatarTelefoneBR completo 11 dig", () => {
  assert.equal(fn.formatarTelefoneBR("11987654321"), "(11) 98765-4321")
})
check("formatarTelefoneBR limita 11 digitos", () => {
  assert.equal(fn.formatarTelefoneBR("119876543210000"), "(11) 98765-4321")
})
check("formatarTelefoneBR ignora chars", () => {
  assert.equal(fn.formatarTelefoneBR("(11) 98765-4321"), "(11) 98765-4321")
})

localStorage.clear()
check("addCustomFuncao nova", () => {
  assert.equal(fn.addCustomFuncao("Vidraceiro"), "Vidraceiro")
})
check("addCustomFuncao duplicada", () => {
  fn.addCustomFuncao("Vidraceiro")
  assert.equal(fn.addCustomFuncao("vidraceiro"), "Vidraceiro")
})
check("addCustomFuncao vazia null", () => {
  assert.equal(fn.addCustomFuncao("   "), null)
})
check("getAllFuncoes contem padrão e custom", () => {
  const all = fn.getAllFuncoes()
  assert.ok(all.includes("Pedreiro"))
  assert.ok(all.includes("Vidraceiro"))
})

console.log(`\n${passed} ok, ${failed} fail`)
process.exit(failed === 0 ? 0 : 1)
