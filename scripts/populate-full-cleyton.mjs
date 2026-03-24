import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://blietvjzchjrzbmkitha.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWV0dmp6Y2hqcnpibWtpdGhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY3MzkzNSwiZXhwIjoyMDg1MjQ5OTM1fQ.7PGsrea8OKaic-8_pTFgu-kujCbtVmSPCduHPlv5x3Y'

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ── Buscar usuário ────────────────────────────────────────────────────────
const { data: { users } } = await sb.auth.admin.listUsers()
const user = users.find(u => u.email === 'cleyton@lasy.ai')
if (!user) { console.error('Usuário não encontrado'); process.exit(1) }
const uid = user.id
console.log('✓ Usuário:', user.email, '|', uid)

// ── Limpar dados existentes ───────────────────────────────────────────────
console.log('\n🧹 Limpando dados existentes...')
await sb.from('notificacoes').delete().eq('user_id', uid)
await sb.from('alertas_pagamento').delete().eq('user_id', uid)
await sb.from('alertas_prazo').delete().eq('user_id', uid)
await sb.from('alertas_orcamento').delete().eq('user_id', uid)
await sb.from('recebimentos').delete().eq('user_id', uid)
await sb.from('pagamentos').delete().eq('user_id', uid)
await sb.from('despesas').delete().eq('user_id', uid)
await sb.from('profissionais').delete().eq('user_id', uid)
// clientes pode não existir ainda — ignorar erro
await sb.from('clientes').delete().eq('user_id', uid)
await sb.from('obras').delete().eq('user_id', uid)
console.log('✓ Dados limpos')

// ── 1. OBRAS ──────────────────────────────────────────────────────────────
console.log('\n📐 Criando obras...')
const { data: obras, error: eObras } = await sb.from('obras').insert([
  {
    user_id: uid,
    nome: 'Residência Família Souza',
    nome_cliente: 'Roberto Souza',
    tipo: 'construcao',
    area: 180,
    localizacao: { cidade: 'São Paulo', estado: 'SP', endereco: 'Rua das Flores, 123 - Morumbi' },
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
    localizacao: { cidade: 'Campinas', estado: 'SP', endereco: 'Av. Brasil, 500 - Sala 12' },
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
    localizacao: { cidade: 'Atibaia', estado: 'SP', endereco: 'Estrada do Campo, Km 4 - Chácara Bela Vista' },
    orcamento: 680000,
    valor_contratado: 720000,
    data_inicio: '2026-03-01',
    data_termino: '2027-02-28',
  },
]).select()
if (eObras) { console.error('Erro obras:', eObras); process.exit(1) }
const [o1, o2, o3] = obras
console.log('✓', obras.map(o => o.nome).join(' | '))

// ── 2. CLIENTES ───────────────────────────────────────────────────────────
console.log('\n👤 Criando clientes...')
const { error: eClientes } = await sb.from('clientes').insert([
  {
    user_id: uid,
    obra_id: o1.id,
    nome: 'Roberto Souza',
    contrato_valor: 450000,
    observacoes: 'Contrato assinado em 05/01/2026. Pagamentos mensais conforme medição. Obra residencial unifamiliar com 3 quartos, 2 banheiros, sala, cozinha e área de lazer.'
  },
  {
    user_id: uid,
    obra_id: o2.id,
    nome: 'Nexus Tecnologia Ltda — Carlos Mendes (responsável)',
    contrato_valor: 92000,
    observacoes: 'Reforma completa: piso, forro, pintura, elétrica e divisórias. Prazo máximo 15/05/2026. Entrada 40% + 3 medições mensais.'
  },
  {
    user_id: uid,
    obra_id: o3.id,
    nome: 'Marcelo Lima',
    contrato_valor: 720000,
    observacoes: 'Casa de campo 240m². Entrada 30%. Parcelas conforme cronograma físico-financeiro. Inclui piscina e área gourmet.'
  },
])
if (eClientes) { console.error('Erro clientes (tabela pode não existir):', eClientes.message) }
else console.log('✓ 3 clientes criados')

// ── 3. PROFISSIONAIS com contrato ─────────────────────────────────────────
console.log('\n👷 Criando profissionais...')
const { data: profs, error: eProfs } = await sb.from('profissionais').insert([
  // Obra 1
  {
    user_id: uid, obra_id: o1.id,
    nome: 'Carlos Pereira', funcao: 'Mestre de Obras',
    telefone: '(11) 98765-4321', email: 'carlos.mestre@email.com', cpf: '123.456.789-00',
    observacoes: 'Responsável pelo canteiro. Experiência de 15 anos.',
    contrato: { tipo: 'mensalista', valor_combinado: 5000, valor_previsto: 35000, data_inicio: '2026-01-10', data_termino: '2026-08-30', observacoes: 'R$ 5.000/mês. Pagamento todo dia 25.' }
  },
  {
    user_id: uid, obra_id: o1.id,
    nome: 'João Elétrico', funcao: 'Eletricista',
    telefone: '(11) 97654-3210', cpf: '234.567.890-11',
    observacoes: 'Responsável por toda instalação elétrica. CREA ativo.',
    contrato: { tipo: 'empreitada', valor_combinado: 18000, valor_previsto: 18000, data_inicio: '2026-02-15', data_termino: '2026-06-30', observacoes: 'Empreitada completa elétrica. 50% no início, 50% na conclusão.' }
  },
  {
    user_id: uid, obra_id: o1.id,
    nome: 'André Hidráulica', funcao: 'Encanador',
    telefone: '(11) 96543-2109', cpf: '345.678.901-22',
    observacoes: 'Instalações hidrossanitárias.',
    contrato: { tipo: 'empreitada', valor_combinado: 12000, valor_previsto: 12000, data_inicio: '2026-03-01', data_termino: '2026-05-31', observacoes: 'Empreitada hidráulica completa.' }
  },
  {
    user_id: uid, obra_id: o1.id,
    nome: 'Paulo Azulejista', funcao: 'Azulejista',
    telefone: '(11) 95432-1098',
    observacoes: 'Assentamento de pisos e revestimentos.',
    contrato: { tipo: 'metro', valor_combinado: 45, valor_previsto: 8100, data_inicio: '2026-05-01', data_termino: '2026-07-15', observacoes: 'R$ 45/m² assentado. Estimativa 180m².' }
  },
  // Obra 2
  {
    user_id: uid, obra_id: o2.id,
    nome: 'Marcos Pintor', funcao: 'Pintor',
    telefone: '(19) 98765-4321', cpf: '456.789.012-33',
    observacoes: 'Pintura interna e externa. Acabamento premium.',
    contrato: { tipo: 'empreitada', valor_combinado: 14000, valor_previsto: 14000, data_inicio: '2026-03-15', data_termino: '2026-05-01', observacoes: 'Pintura completa 95m². Inclui teto e paredes.' }
  },
  {
    user_id: uid, obra_id: o2.id,
    nome: 'Felipe Gesseiro', funcao: 'Gesseiro',
    telefone: '(19) 97654-3210',
    observacoes: 'Forro e paredes de gesso.',
    contrato: { tipo: 'empreitada', valor_combinado: 9500, valor_previsto: 9500, data_inicio: '2026-02-10', data_termino: '2026-03-31', observacoes: 'Gesso liso em 95m².' }
  },
  // Obra 3
  {
    user_id: uid, obra_id: o3.id,
    nome: 'Roberto Fundação', funcao: 'Pedreiro',
    telefone: '(11) 99876-5432', cpf: '567.890.123-44',
    observacoes: 'Fundação, alvenaria e estrutura.',
    contrato: { tipo: 'mensalista', valor_combinado: 4500, valor_previsto: 54000, data_inicio: '2026-03-01', data_termino: '2027-02-28', observacoes: 'R$ 4.500/mês. Responsável pela equipe de alvenaria.' }
  },
  {
    user_id: uid, obra_id: o3.id,
    nome: 'Lucas Ferragem', funcao: 'Armador',
    telefone: '(11) 98765-0001',
    observacoes: 'Montagem de ferragem estrutural.',
    contrato: { tipo: 'empreitada', valor_combinado: 22000, valor_previsto: 22000, data_inicio: '2026-03-10', data_termino: '2026-06-30', observacoes: 'Empreitada armação estrutural completa.' }
  },
]).select()
if (eProfs) { console.error('Erro profissionais:', eProfs); process.exit(1) }
const [p1, p2, p3, p4, p5, p6, p7, p8] = profs
console.log('✓', profs.length, 'profissionais criados')

// ── 4. DESPESAS ───────────────────────────────────────────────────────────
console.log('\n💸 Criando despesas...')
const despesas = [
  // ===== OBRA 1 — Residência Souza =====
  // Materiais - fundação/estrutura
  { user_id: uid, obra_id: o1.id, descricao: 'Cimento CP-II (200 sacos)', valor: 6400, categoria: 'materiais', data: '2026-01-12', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o1.id, descricao: 'Areia média e grossa (20m³)', valor: 3600, categoria: 'materiais', data: '2026-01-14', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: o1.id, descricao: 'Brita nº 1 (15m³)', valor: 2800, categoria: 'materiais', data: '2026-01-15', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: o1.id, descricao: 'Tijolos cerâmicos 9 furos (8000 un)', valor: 9600, categoria: 'materiais', data: '2026-01-20', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o1.id, descricao: 'Ferro CA-50 10mm (800kg)', valor: 6800, categoria: 'materiais', data: '2026-01-25', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o1.id, descricao: 'Ferro CA-60 6mm (200kg)', valor: 1800, categoria: 'materiais', data: '2026-01-25', forma_pagamento: 'boleto' },
  // Materiais - cobertura
  { user_id: uid, obra_id: o1.id, descricao: 'Telhas cerâmicas colonial (2000 un)', valor: 8000, categoria: 'materiais', data: '2026-02-10', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o1.id, descricao: 'Madeiramento telhado', valor: 7500, categoria: 'materiais', data: '2026-02-12', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o1.id, descricao: 'Impermeabilizante fundação', valor: 2200, categoria: 'materiais', data: '2026-02-05', forma_pagamento: 'pix' },
  // Materiais - elétrica
  { user_id: uid, obra_id: o1.id, descricao: 'Fiação 2.5mm (800m) + caixas', valor: 4200, categoria: 'materiais', data: '2026-02-18', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: o1.id, descricao: 'Quadro de distribuição 24 disjuntores', valor: 1800, categoria: 'materiais', data: '2026-02-18', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: o1.id, descricao: 'Tomadas, interruptores e espelhos', valor: 2400, categoria: 'materiais', data: '2026-03-02', forma_pagamento: 'cartao' },
  // Materiais - hidráulica
  { user_id: uid, obra_id: o1.id, descricao: 'Tubos PVC esgoto (80 barras)', valor: 2800, categoria: 'materiais', data: '2026-03-05', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o1.id, descricao: 'Tubos CPVC água quente', valor: 1600, categoria: 'materiais', data: '2026-03-05', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o1.id, descricao: 'Conexões e registros hidráulicos', valor: 3200, categoria: 'materiais', data: '2026-03-08', forma_pagamento: 'pix' },
  // Mão de obra
  { user_id: uid, obra_id: o1.id, descricao: 'Janeiro — mestre de obras', valor: 5000, categoria: 'mao_obra', data: '2026-01-25', forma_pagamento: 'pix', profissional_id: p1.id },
  { user_id: uid, obra_id: o1.id, descricao: 'Fevereiro — mestre de obras', valor: 5000, categoria: 'mao_obra', data: '2026-02-25', forma_pagamento: 'pix', profissional_id: p1.id },
  { user_id: uid, obra_id: o1.id, descricao: 'Março — mestre de obras', valor: 5000, categoria: 'mao_obra', data: '2026-03-10', forma_pagamento: 'pix', profissional_id: p1.id },
  { user_id: uid, obra_id: o1.id, descricao: 'Elétrica fase 1 — entrada e circuitos', valor: 9000, categoria: 'mao_obra', data: '2026-03-03', forma_pagamento: 'pix', profissional_id: p2.id },
  { user_id: uid, obra_id: o1.id, descricao: 'Hidráulica fase 1 — esgoto e água fria', valor: 6000, categoria: 'mao_obra', data: '2026-03-10', forma_pagamento: 'pix', profissional_id: p3.id },
  // Outros
  { user_id: uid, obra_id: o1.id, descricao: 'ART - Anotação Responsabilidade Técnica', valor: 1200, categoria: 'outros', data: '2026-01-08', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: o1.id, descricao: 'Alvará de construção', valor: 2800, categoria: 'outros', data: '2026-01-08', forma_pagamento: 'transferencia' },
  { user_id: uid, obra_id: o1.id, descricao: 'Aluguel andaime metálico (3 meses)', valor: 4800, categoria: 'outros', data: '2026-01-11', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o1.id, descricao: 'Locação betoneira 200L (2 meses)', valor: 1400, categoria: 'outros', data: '2026-01-11', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o1.id, descricao: 'EPI — capacetes, luvas, botas (6 kits)', valor: 900, categoria: 'outros', data: '2026-01-13', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: o1.id, descricao: 'Caçamba entulho (3 retiradas)', valor: 1800, categoria: 'outros', data: '2026-02-20', forma_pagamento: 'pix' },

  // ===== OBRA 2 — Escritório Nexus =====
  // Materiais
  { user_id: uid, obra_id: o2.id, descricao: 'Piso porcelanato 60x60 (95m²)', valor: 9500, categoria: 'materiais', data: '2026-02-08', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o2.id, descricao: 'Argamassa colante (60 sacos)', valor: 1800, categoria: 'materiais', data: '2026-02-10', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: o2.id, descricao: 'Rejunte cinza (20 sacos)', valor: 600, categoria: 'materiais', data: '2026-02-10', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: o2.id, descricao: 'Gesso liso (80 sacos)', valor: 2000, categoria: 'materiais', data: '2026-02-15', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o2.id, descricao: 'Perfis e placas forro gesso (95m²)', valor: 5700, categoria: 'materiais', data: '2026-02-15', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o2.id, descricao: 'Tinta premium branca fosca (30L)', valor: 4200, categoria: 'materiais', data: '2026-03-10', forma_pagamento: 'cartao' },
  { user_id: uid, obra_id: o2.id, descricao: 'Tinta acrílica tetos (15L)', valor: 1200, categoria: 'materiais', data: '2026-03-10', forma_pagamento: 'cartao' },
  { user_id: uid, obra_id: o2.id, descricao: 'Divisórias drywall (40m²)', valor: 8000, categoria: 'materiais', data: '2026-02-20', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o2.id, descricao: 'Rodapé MDF 10cm (120m)', valor: 2400, categoria: 'materiais', data: '2026-03-20', forma_pagamento: 'pix' },
  // Mão de obra
  { user_id: uid, obra_id: o2.id, descricao: 'Gesseiro — forro e paredes', valor: 9500, categoria: 'mao_obra', data: '2026-03-05', forma_pagamento: 'pix', profissional_id: p6.id },
  { user_id: uid, obra_id: o2.id, descricao: 'Pintura completa escritório', valor: 14000, categoria: 'mao_obra', data: '2026-03-18', forma_pagamento: 'pix', profissional_id: p5.id },
  // Outros
  { user_id: uid, obra_id: o2.id, descricao: 'Taxa projeto arquitetônico', valor: 4500, categoria: 'outros', data: '2026-01-28', forma_pagamento: 'transferencia' },
  { user_id: uid, obra_id: o2.id, descricao: 'Caçamba entulho (2 retiradas)', valor: 1200, categoria: 'outros', data: '2026-03-01', forma_pagamento: 'pix' },

  // ===== OBRA 3 — Casa de Campo Lima =====
  // Materiais - fundação
  { user_id: uid, obra_id: o3.id, descricao: 'Cimento CP-V (300 sacos)', valor: 10500, categoria: 'materiais', data: '2026-03-05', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o3.id, descricao: 'Areia lavada (30m³)', valor: 5400, categoria: 'materiais', data: '2026-03-06', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o3.id, descricao: 'Brita (20m³)', valor: 3800, categoria: 'materiais', data: '2026-03-06', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o3.id, descricao: 'Ferragem estrutural CA-50 (2000kg)', valor: 17000, categoria: 'materiais', data: '2026-03-08', forma_pagamento: 'boleto' },
  { user_id: uid, obra_id: o3.id, descricao: 'Forma metálica fundação (aluguel)', valor: 4500, categoria: 'materiais', data: '2026-03-10', forma_pagamento: 'pix' },
  // Mão de obra
  { user_id: uid, obra_id: o3.id, descricao: 'Março — equipe alvenaria', valor: 4500, categoria: 'mao_obra', data: '2026-03-18', forma_pagamento: 'pix', profissional_id: p7.id },
  { user_id: uid, obra_id: o3.id, descricao: 'Armação estrutural fase 1', valor: 11000, categoria: 'mao_obra', data: '2026-03-19', forma_pagamento: 'pix', profissional_id: p8.id },
  // Outros
  { user_id: uid, obra_id: o3.id, descricao: 'ART e projeto estrutural', valor: 3500, categoria: 'outros', data: '2026-02-28', forma_pagamento: 'transferencia' },
  { user_id: uid, obra_id: o3.id, descricao: 'Topografia e sondagem', valor: 4200, categoria: 'outros', data: '2026-02-28', forma_pagamento: 'transferencia' },
  { user_id: uid, obra_id: o3.id, descricao: 'Locação retroescavadeira (3 dias)', valor: 3600, categoria: 'outros', data: '2026-03-04', forma_pagamento: 'pix' },
  { user_id: uid, obra_id: o3.id, descricao: 'EPI equipe (12 kits)', valor: 1800, categoria: 'outros', data: '2026-03-05', forma_pagamento: 'pix' },
]

const { error: eDespesas } = await sb.from('despesas').insert(despesas)
if (eDespesas) { console.error('Erro despesas:', eDespesas); process.exit(1) }
console.log('✓', despesas.length, 'despesas criadas')

// ── 5. PAGAMENTOS ─────────────────────────────────────────────────────────
console.log('\n💳 Criando pagamentos...')
const pagamentos = [
  // Obra 1
  { user_id: uid, obra_id: o1.id, profissional_id: p1.id, valor: 5000, data: '2026-01-25', forma_pagamento: 'pix', observacao: 'Janeiro — mestre obras' },
  { user_id: uid, obra_id: o1.id, profissional_id: p1.id, valor: 5000, data: '2026-02-25', forma_pagamento: 'pix', observacao: 'Fevereiro — mestre obras' },
  { user_id: uid, obra_id: o1.id, profissional_id: p1.id, valor: 5000, data: '2026-03-10', forma_pagamento: 'pix', observacao: 'Março — mestre obras (adiantamento)' },
  { user_id: uid, obra_id: o1.id, profissional_id: p2.id, valor: 9000, data: '2026-03-03', forma_pagamento: 'pix', observacao: 'Elétrica fase 1 — 50%' },
  { user_id: uid, obra_id: o1.id, profissional_id: p3.id, valor: 6000, data: '2026-03-10', forma_pagamento: 'pix', observacao: 'Hidráulica fase 1 — 50%' },
  // Obra 2
  { user_id: uid, obra_id: o2.id, profissional_id: p6.id, valor: 9500, data: '2026-03-05', forma_pagamento: 'pix', observacao: 'Gesseiro — pagamento integral' },
  { user_id: uid, obra_id: o2.id, profissional_id: p5.id, valor: 7000, data: '2026-03-18', forma_pagamento: 'pix', observacao: 'Pintura — 50% entrada' },
  // Obra 3
  { user_id: uid, obra_id: o3.id, profissional_id: p7.id, valor: 4500, data: '2026-03-18', forma_pagamento: 'pix', observacao: 'Março — equipe alvenaria' },
  { user_id: uid, obra_id: o3.id, profissional_id: p8.id, valor: 11000, data: '2026-03-19', forma_pagamento: 'pix', observacao: 'Armação estrutural fase 1' },
]
const { error: ePag } = await sb.from('pagamentos').insert(pagamentos)
if (ePag) { console.error('Erro pagamentos:', ePag); process.exit(1) }
console.log('✓', pagamentos.length, 'pagamentos criados')

// ── 6. RECEBIMENTOS ───────────────────────────────────────────────────────
console.log('\n💰 Criando recebimentos...')
const recebimentos = [
  // Obra 1 — contrato R$450k — recebido R$315k (70%)
  { user_id: uid, obra_id: o1.id, valor: 135000, data: '2026-01-10', forma_pagamento: 'transferencia', observacao: 'Entrada 30% — assinatura contrato' },
  { user_id: uid, obra_id: o1.id, valor: 90000,  data: '2026-02-10', forma_pagamento: 'transferencia', observacao: 'Medição fevereiro — 20%' },
  { user_id: uid, obra_id: o1.id, valor: 90000,  data: '2026-03-12', forma_pagamento: 'transferencia', observacao: 'Medição março — 20%' },
  // Obra 2 — contrato R$92k — recebido R$64.4k (70%)
  { user_id: uid, obra_id: o2.id, valor: 36800,  data: '2026-02-01', forma_pagamento: 'pix', observacao: 'Entrada 40% — início da obra' },
  { user_id: uid, obra_id: o2.id, valor: 27600,  data: '2026-03-01', forma_pagamento: 'pix', observacao: 'Medição março — 30%' },
  // Obra 3 — contrato R$720k — recebido R$216k (30%)
  { user_id: uid, obra_id: o3.id, valor: 216000, data: '2026-03-01', forma_pagamento: 'transferencia', observacao: 'Entrada 30% — início da obra' },
]
const { error: eRec } = await sb.from('recebimentos').insert(recebimentos)
if (eRec) { console.error('Erro recebimentos:', eRec); process.exit(1) }
console.log('✓', recebimentos.length, 'recebimentos criados')

// ── 7. ALERTAS DE ORÇAMENTO ───────────────────────────────────────────────
console.log('\n🔔 Criando alertas de orçamento...')
const { error: eAO } = await sb.from('alertas_orcamento').insert([
  { user_id: uid, obra_id: o1.id, ativo: true, percentuais: [25,50,75,90,100], disparados: [25] },
  { user_id: uid, obra_id: o2.id, ativo: true, percentuais: [25,50,75,90,100], disparados: [25,50] },
  { user_id: uid, obra_id: o3.id, ativo: true, percentuais: [25,50,75,90,100], disparados: [] },
])
if (eAO) console.error('Aviso alertas_orcamento:', eAO.message)
else console.log('✓ Alertas de orçamento criados')

// ── 8. ALERTAS DE PRAZO ───────────────────────────────────────────────────
console.log('\n📅 Criando alertas de prazo...')
const { error: eAP } = await sb.from('alertas_prazo').insert([
  { user_id: uid, obra_id: o1.id, titulo: 'Conclusão da estrutura', data: '2026-04-15', aviso_antecipado: 7, disparado: false },
  { user_id: uid, obra_id: o1.id, titulo: 'Entrega da cobertura', data: '2026-06-01', aviso_antecipado: 7, disparado: false },
  { user_id: uid, obra_id: o1.id, titulo: 'Prazo final da obra', data: '2026-08-30', aviso_antecipado: 7, disparado: false },
  { user_id: uid, obra_id: o2.id, titulo: 'Entrega do piso', data: '2026-03-25', aviso_antecipado: 3, disparado: false },
  { user_id: uid, obra_id: o2.id, titulo: 'Prazo final — escritório', data: '2026-05-15', aviso_antecipado: 7, disparado: false },
  { user_id: uid, obra_id: o3.id, titulo: 'Conclusão fundações', data: '2026-05-30', aviso_antecipado: 7, disparado: false },
  { user_id: uid, obra_id: o3.id, titulo: 'Conclusão estrutura', data: '2026-09-30', aviso_antecipado: 7, disparado: false },
])
if (eAP) console.error('Aviso alertas_prazo:', eAP.message)
else console.log('✓ Alertas de prazo criados')

// ── 9. ALERTAS DE PAGAMENTO ───────────────────────────────────────────────
console.log('\n💡 Criando alertas de pagamento...')
const { error: eAPag } = await sb.from('alertas_pagamento').insert([
  { user_id: uid, obra_id: o1.id, titulo: 'Mensalidade Carlos Pereira', categoria: 'profissional', valor: 5000, profissional_id: p1.id, data_inicial: '2026-01-25', recorrencia: 'mensal', lembrete_antecipado: 3, proxima_data: '2026-04-25' },
  { user_id: uid, obra_id: o1.id, titulo: 'Aluguel andaime metálico', categoria: 'outros', valor: 1600, data_inicial: '2026-04-11', recorrencia: 'mensal', lembrete_antecipado: 3, proxima_data: '2026-04-11' },
  { user_id: uid, obra_id: o3.id, titulo: 'Mensalidade Roberto Fundação', categoria: 'profissional', valor: 4500, profissional_id: p7.id, data_inicial: '2026-03-18', recorrencia: 'mensal', lembrete_antecipado: 3, proxima_data: '2026-04-18' },
  { user_id: uid, obra_id: o2.id, titulo: 'Saldo pintura Marcos', categoria: 'profissional', valor: 7000, profissional_id: p5.id, data_inicial: '2026-05-01', recorrencia: 'unico', lembrete_antecipado: 3, proxima_data: '2026-05-01' },
])
if (eAPag) console.error('Aviso alertas_pagamento:', eAPag.message)
else console.log('✓ Alertas de pagamento criados')

// ── 10. NOTIFICAÇÕES ──────────────────────────────────────────────────────
console.log('\n🔔 Criando notificações...')
const { error: eNot } = await sb.from('notificacoes').insert([
  { user_id: uid, obra_id: o1.id, tipo: 'orcamento', titulo: '⚠️ Orçamento 25% comprometido', mensagem: 'A obra "Residência Família Souza" atingiu 25% do orçamento estimado (R$ 420.000).', lida: true },
  { user_id: uid, obra_id: o2.id, tipo: 'orcamento', titulo: '⚠️ Orçamento 50% comprometido', mensagem: 'A obra "Reforma Comercial Escritório Nexus" atingiu 50% do orçamento estimado (R$ 85.000).', lida: false },
  { user_id: uid, obra_id: o1.id, tipo: 'pagamento', titulo: '💳 Lembrete: Carlos Pereira — Abril', mensagem: 'Pagamento mensal de R$ 5.000 para Carlos Pereira vence em 3 dias (25/04).', lida: false },
  { user_id: uid, obra_id: o2.id, tipo: 'prazo', titulo: '📅 Entrega do piso em 3 dias', mensagem: 'O prazo para entrega do piso na obra "Escritório Nexus" é 25/03/2026.', lida: false },
  { user_id: uid, tipo: 'sistema', titulo: '🎉 Bem-vindo ao Obreasy!', mensagem: 'Sua conta está configurada. Explore os recursos de gestão de obras, despesas e relatórios.', lida: true },
])
if (eNot) console.error('Aviso notificações:', eNot.message)
else console.log('✓ Notificações criadas')

// ── RESUMO ────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(55))
console.log('✅ cleyton@lasy.ai populado com sucesso!')
console.log('='.repeat(55))
console.log(`  Obras:                3`)
console.log(`  Clientes:             3  (1 por obra, com contrato)`)
console.log(`  Profissionais:        8  (com contratos JSONB)`)
console.log(`  Despesas:            ${despesas.length}`)
console.log(`  Pagamentos:          ${pagamentos.length}`)
console.log(`  Recebimentos:        ${recebimentos.length}`)
console.log(`  Alertas orçamento:    3`)
console.log(`  Alertas prazo:        7`)
console.log(`  Alertas pagamento:    4`)
console.log(`  Notificações:         5`)
console.log('='.repeat(55))
console.log('\nResumo financeiro:')
console.log(`  Obra 1 — Souza:     Orç R$420k | Contrato R$450k | Recebido R$315k`)
console.log(`  Obra 2 — Nexus:     Orç R$85k  | Contrato R$92k  | Recebido R$64k`)
console.log(`  Obra 3 — Lima:      Orç R$680k | Contrato R$720k | Recebido R$216k`)
