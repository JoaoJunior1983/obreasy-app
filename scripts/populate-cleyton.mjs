import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://blietvjzchjrzbmkitha.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWV0dmp6Y2hqcnpibWtpdGhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY3MzkzNSwiZXhwIjoyMDg1MjQ5OTM1fQ.7PGsrea8OKaic-8_pTFgu-kujCbtVmSPCduHPlv5x3Y'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Buscar usuário pelo e-mail
const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
if (userError) { console.error('Erro ao buscar usuários:', userError); process.exit(1) }

const user = users.find(u => u.email === 'cleyton@lasy.ai')
if (!user) { console.error('Usuário cleyton@lasy.ai não encontrado'); process.exit(1) }

const uid = user.id
console.log('Usuário encontrado:', uid)

// ── 1. Obras ─────────────────────────────────────────────────────────────
const obrasData = [
  {
    user_id: uid,
    nome: 'Residência Família Souza',
    nome_cliente: 'Roberto Souza',
    tipo: 'construcao',
    area: 180,
    localizacao: { cidade: 'São Paulo', estado: 'SP', endereco: 'Rua das Flores, 123' },
    orcamento: 420000,
    valor_contratado: 450000,
    data_inicio: '2026-01-10',
    data_termino: '2026-08-30',
  },
  {
    user_id: uid,
    nome: 'Reforma Comercial Escritório Nexus',
    nome_cliente: 'Nexus Tecnologia Ltda',
    tipo: 'reforma',
    area: 95,
    localizacao: { cidade: 'Campinas', estado: 'SP', endereco: 'Av. Brasil, 500 - sala 12' },
    orcamento: 85000,
    valor_contratado: 92000,
    data_inicio: '2026-02-01',
    data_termino: '2026-05-15',
  },
  {
    user_id: uid,
    nome: 'Casa de Campo Família Lima',
    nome_cliente: 'Marcelo Lima',
    tipo: 'construcao',
    area: 240,
    localizacao: { cidade: 'Atibaia', estado: 'SP', endereco: 'Estrada do Campo, km 4' },
    orcamento: 680000,
    valor_contratado: 720000,
    data_inicio: '2026-03-01',
    data_termino: '2027-02-28',
  },
]

const { data: obras, error: obrasError } = await supabase.from('obras').insert(obrasData).select()
if (obrasError) { console.error('Erro ao criar obras:', obrasError); process.exit(1) }
console.log('Obras criadas:', obras.map(o => o.nome))

const obra1 = obras[0], obra2 = obras[1], obra3 = obras[2]

// ── 2. Profissionais ──────────────────────────────────────────────────────
const profissionaisData = [
  { user_id: uid, obra_id: obra1.id, nome: 'Carlos Pereira', funcao: 'Mestre de Obras', telefone: '(11) 98765-4321' },
  { user_id: uid, obra_id: obra1.id, nome: 'João Elétrico', funcao: 'Eletricista', telefone: '(11) 97654-3210' },
  { user_id: uid, obra_id: obra1.id, nome: 'André Hidro', funcao: 'Encanador', telefone: '(11) 96543-2109' },
  { user_id: uid, obra_id: obra2.id, nome: 'Paulo Gesseiro', funcao: 'Gesseiro', telefone: '(19) 99876-5432' },
  { user_id: uid, obra_id: obra2.id, nome: 'Marcos Pintor', funcao: 'Pintor', telefone: '(19) 98765-4321' },
  { user_id: uid, obra_id: obra3.id, nome: 'Roberto Fundação', funcao: 'Pedreiro', telefone: '(11) 95432-1098' },
]

const { data: profissionais, error: profError } = await supabase.from('profissionais').insert(profissionaisData).select()
if (profError) { console.error('Erro ao criar profissionais:', profError); process.exit(1) }
console.log('Profissionais criados:', profissionais.length)

const [p1, p2, p3, p4, p5, p6] = profissionais

// ── 3. Despesas ───────────────────────────────────────────────────────────
const despesasData = [
  // Obra 1 - materiais
  { user_id: uid, obra_id: obra1.id, descricao: 'Cimento CP-II (100 sacos)', valor: 3200, categoria: 'materiais', data: '2026-01-15', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: obra1.id, descricao: 'Areia média (10m³)', valor: 1800, categoria: 'materiais', data: '2026-01-18', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: obra1.id, descricao: 'Tijolos cerâmicos (5000 un)', valor: 6500, categoria: 'materiais', data: '2026-01-22', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: obra1.id, descricao: 'Ferro 10mm (500kg)', valor: 4200, categoria: 'materiais', data: '2026-02-05', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: obra1.id, descricao: 'Telhas metálicas', valor: 12000, categoria: 'materiais', data: '2026-02-20', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: obra1.id, descricao: 'Fiação elétrica 2.5mm (500m)', valor: 2800, categoria: 'materiais', data: '2026-03-01', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: obra1.id, descricao: 'Tubos PVC esgoto', valor: 1500, categoria: 'materiais', data: '2026-03-05', forma_pagamento: 'cartao' },
  // Obra 1 - mão de obra
  { user_id: uid, obra_id: obra1.id, descricao: 'Semana 1-2 jan', valor: 5000, categoria: 'mao_obra', data: '2026-01-24', forma_pagamento: 'pix', profissional_id: p1.id },
  { user_id: uid, obra_id: obra1.id, descricao: 'Instalação elétrica fase 1', valor: 3500, categoria: 'mao_obra', data: '2026-03-03', forma_pagamento: 'pix', profissional_id: p2.id },
  { user_id: uid, obra_id: obra1.id, descricao: 'Serviço hidráulico', valor: 2800, categoria: 'mao_obra', data: '2026-03-07', forma_pagamento: 'pix', profissional_id: p3.id },
  { user_id: uid, obra_id: obra1.id, descricao: 'Fevereiro - serviços gerais', valor: 5000, categoria: 'mao_obra', data: '2026-02-28', forma_pagamento: 'pix', profissional_id: p1.id },
  // Obra 1 - outros
  { user_id: uid, obra_id: obra1.id, descricao: 'Aluguel andaime (3 meses)', valor: 2400, categoria: 'outros', data: '2026-01-12', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: obra1.id, descricao: 'ART engenharia', valor: 800, categoria: 'outros', data: '2026-01-11', forma_pagamento: 'pix' },

  // Obra 2 - materiais
  { user_id: uid, obra_id: obra2.id, descricao: 'Gesso liso (50 sacos)', valor: 1200, categoria: 'materiais', data: '2026-02-05', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: obra2.id, descricao: 'Tinta premium (30 latas)', valor: 4800, categoria: 'materiais', data: '2026-02-15', forma_pagamento: 'cartao' },
  { user_id: uid, obra_id: obra2.id, descricao: 'Piso porcelanato (95m²)', valor: 9500, categoria: 'materiais', data: '2026-02-20', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: obra2.id, descricao: 'Forro de gesso', valor: 3200, categoria: 'materiais', data: '2026-03-01', forma_pagamento: 'pix' },
  // Obra 2 - mão de obra
  { user_id: uid, obra_id: obra2.id, descricao: 'Serviço gesseiro fase 1', valor: 4500, categoria: 'mao_obra', data: '2026-02-28', forma_pagamento: 'pix', profissional_id: p4.id },
  { user_id: uid, obra_id: obra2.id, descricao: 'Pintura total', valor: 6000, categoria: 'mao_obra', data: '2026-03-10', forma_pagamento: 'pix', profissional_id: p5.id },

  // Obra 3 - materiais
  { user_id: uid, obra_id: obra3.id, descricao: 'Cimento e brita fundação', valor: 8500, categoria: 'materiais', data: '2026-03-05', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: obra3.id, descricao: 'Ferragem estrutural', valor: 15000, categoria: 'materiais', data: '2026-03-10', forma_pagamento: 'boleto' },
  // Obra 3 - mão de obra
  { user_id: uid, obra_id: obra3.id, descricao: 'Fundação e alvenaria', valor: 8000, categoria: 'mao_obra', data: '2026-03-18', forma_pagamento: 'pix', profissional_id: p6.id },
]

const { error: despError } = await supabase.from('despesas').insert(despesasData)
if (despError) { console.error('Erro ao criar despesas:', despError); process.exit(1) }
console.log('Despesas criadas:', despesasData.length)

// ── 4. Pagamentos (para profissionais) ───────────────────────────────────
const pagamentosData = [
  { user_id: uid, obra_id: obra1.id, profissional_id: p1.id, valor: 5000, data: '2026-01-24', forma_pagamento: 'pix', observacao: 'Semana 1-2 jan' },
  { user_id: uid, obra_id: obra1.id, profissional_id: p1.id, valor: 5000, data: '2026-02-28', forma_pagamento: 'pix', observacao: 'Fev - serviços gerais' },
  { user_id: uid, obra_id: obra1.id, profissional_id: p2.id, valor: 3500, data: '2026-03-03', forma_pagamento: 'pix', observacao: 'Elétrica fase 1' },
  { user_id: uid, obra_id: obra1.id, profissional_id: p3.id, valor: 2800, data: '2026-03-07', forma_pagamento: 'pix', observacao: 'Hidráulica' },
  { user_id: uid, obra_id: obra2.id, profissional_id: p4.id, valor: 4500, data: '2026-02-28', forma_pagamento: 'pix', observacao: 'Gesseiro fase 1' },
  { user_id: uid, obra_id: obra2.id, profissional_id: p5.id, valor: 6000, data: '2026-03-10', forma_pagamento: 'pix', observacao: 'Pintura total' },
  { user_id: uid, obra_id: obra3.id, profissional_id: p6.id, valor: 8000, data: '2026-03-18', forma_pagamento: 'pix', observacao: 'Fundação e alvenaria' },
]

const { error: pagError } = await supabase.from('pagamentos').insert(pagamentosData)
if (pagError) { console.error('Erro ao criar pagamentos:', pagError); process.exit(1) }
console.log('Pagamentos criados:', pagamentosData.length)

// ── 5. Recebimentos do cliente ────────────────────────────────────────────
const recebimentosData = [
  // Obra 1 (contratado 450k)
  { user_id: uid, obra_id: obra1.id, valor: 135000, data: '2026-01-10', forma_pagamento: 'transferencia', observacao: 'Entrada 30%' },
  { user_id: uid, obra_id: obra1.id, valor: 90000, data: '2026-02-15', forma_pagamento: 'transferencia', observacao: 'Medição fevereiro' },
  { user_id: uid, obra_id: obra1.id, valor: 90000, data: '2026-03-15', forma_pagamento: 'transferencia', observacao: 'Medição março' },
  // Obra 2 (contratado 92k)
  { user_id: uid, obra_id: obra2.id, valor: 36800, data: '2026-02-01', forma_pagamento: 'pix', observacao: 'Entrada 40%' },
  { user_id: uid, obra_id: obra2.id, valor: 27600, data: '2026-03-01', forma_pagamento: 'pix', observacao: 'Medição março' },
  // Obra 3 (contratado 720k)
  { user_id: uid, obra_id: obra3.id, valor: 216000, data: '2026-03-01', forma_pagamento: 'transferencia', observacao: 'Entrada 30%' },
]

const { error: recError } = await supabase.from('recebimentos').insert(recebimentosData)
if (recError) { console.error('Erro ao criar recebimentos:', recError); process.exit(1) }
console.log('Recebimentos criados:', recebimentosData.length)

console.log('\n✓ Usuário cleyton@lasy.ai populado com sucesso!')
console.log('  - 3 obras')
console.log('  - 6 profissionais')
console.log('  - ' + despesasData.length + ' despesas')
console.log('  - ' + pagamentosData.length + ' pagamentos')
console.log('  - ' + recebimentosData.length + ' recebimentos')
