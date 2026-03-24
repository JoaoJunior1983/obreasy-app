import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://blietvjzchjrzbmkitha.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWV0dmp6Y2hqcnpibWtpdGhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY3MzkzNSwiZXhwIjoyMDg1MjQ5OTM1fQ.7PGsrea8OKaic-8_pTFgu-kujCbtVmSPCduHPlv5x3Y'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TARGET_EMAIL = 'cleytonzyan@gmail.com'

// ── helpers ──────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

async function run() {
  // 1. Buscar o usuário pelo email
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) throw listErr

  const user = users.find(u => u.email === TARGET_EMAIL)
  if (!user) {
    // Criar usuário se não existir
    console.log(`Usuário ${TARGET_EMAIL} não encontrado, criando...`)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: TARGET_EMAIL,
      password: 'Cleyton@2026',
      email_confirm: true,
    })
    if (createErr) throw createErr
    console.log('Usuário criado:', created.user.id)
    return run() // re-run com o usuário criado
  }

  const uid = user.id
  console.log(`Populando dados para: ${TARGET_EMAIL} (${uid})`)

  // 2. user_profiles
  await admin.from('user_profiles').upsert({
    id: uid,
    first_name: 'Cleyton',
    last_name: 'Zyan',
    phone: '(11) 99999-0001',
  })
  console.log('✓ user_profiles')

  // 3. Obras
  const { data: obras, error: obrasErr } = await admin.from('obras').insert([
    {
      user_id: uid,
      nome: 'Residência Família Oliveira',
      nome_cliente: 'João Oliveira',
      tipo: 'construcao',
      area: 180,
      localizacao: { estado: 'SP', cidade: 'São Paulo' },
      orcamento: 320000,
      valor_contratado: 295000,
      data_inicio: daysAgo(90),
      data_termino: daysFromNow(120),
    },
    {
      user_id: uid,
      nome: 'Reforma Comercial Loja Centro',
      nome_cliente: 'Ana Ferreira',
      tipo: 'reforma',
      area: 65,
      localizacao: { estado: 'SP', cidade: 'Guarulhos' },
      orcamento: 85000,
      valor_contratado: 78000,
      data_inicio: daysAgo(30),
      data_termino: daysFromNow(45),
    },
  ]).select()
  if (obrasErr) throw obrasErr
  console.log('✓ obras:', obras.map(o => o.nome))

  const obra1 = obras[0]
  const obra2 = obras[1]

  // 4. Profissionais — obra 1
  const { data: profs, error: profsErr } = await admin.from('profissionais').insert([
    {
      user_id: uid, obra_id: obra1.id,
      nome: 'Ricardo Pereira',
      funcao: 'Pedreiro',
      telefone: '(11) 98765-1001',
      contrato: { tipoContrato: 'empreitada', valorCombinado: 45000, dataInicio: daysAgo(90), dataTermino: daysFromNow(60) },
      valor_previsto: 45000,
    },
    {
      user_id: uid, obra_id: obra1.id,
      nome: 'Carlos Eletric',
      funcao: 'Eletricista',
      telefone: '(11) 97654-2002',
      contrato: { tipoContrato: 'empreitada', valorCombinado: 18000, dataInicio: daysAgo(30), dataTermino: daysFromNow(30) },
      valor_previsto: 18000,
    },
    {
      user_id: uid, obra_id: obra1.id,
      nome: 'Marcos Hidráulica',
      funcao: 'Encanador',
      telefone: '(11) 96543-3003',
      contrato: { tipoContrato: 'empreitada', valorCombinado: 12000, dataInicio: daysAgo(20), dataTermino: daysFromNow(20) },
      valor_previsto: 12000,
    },
    // obra 2
    {
      user_id: uid, obra_id: obra2.id,
      nome: 'Equipe Reforma Express',
      funcao: 'Pedreiro',
      telefone: '(11) 95432-4004',
      contrato: { tipoContrato: 'empreitada', valorCombinado: 22000, dataInicio: daysAgo(30), dataTermino: daysFromNow(45) },
      valor_previsto: 22000,
    },
    {
      user_id: uid, obra_id: obra2.id,
      nome: 'Paulo Pintor',
      funcao: 'Pintor',
      telefone: '(11) 94321-5005',
      contrato: { tipoContrato: 'diaria', valorCombinado: 4800, diaria: 300, qtdDiarias: 16 },
      valor_previsto: 4800,
    },
  ]).select()
  if (profsErr) throw profsErr
  console.log('✓ profissionais:', profs.map(p => p.nome))

  const [r1, r2, r3, r4, r5] = profs

  // 5. Despesas — obra 1
  const despesasObra1 = [
    { descricao: 'Cimento CP-II (200 sacos)', valor: 8400, categoria: 'material', data: daysAgo(85), forma_pagamento: 'Pix' },
    { descricao: 'Areia grossa (10m³)', valor: 2200, categoria: 'material', data: daysAgo(80), forma_pagamento: 'Pix' },
    { descricao: 'Tijolos cerâmicos (5000 un)', valor: 4500, categoria: 'material', data: daysAgo(75), forma_pagamento: 'Boleto' },
    { descricao: 'Ferro CA-50 (300kg)', valor: 3600, categoria: 'material', data: daysAgo(70), forma_pagamento: 'Boleto' },
    { descricao: 'Adiantamento pedreiro', valor: 8000, categoria: 'mao_obra', data: daysAgo(65), forma_pagamento: 'Pix', profissional_id: r1.id },
    { descricao: 'Madeira para forma (50 peças)', valor: 2800, categoria: 'material', data: daysAgo(60), forma_pagamento: 'Dinheiro' },
    { descricao: 'Pagamento parcial eletricista', valor: 6000, categoria: 'mao_obra', data: daysAgo(25), forma_pagamento: 'Pix', profissional_id: r2.id },
    { descricao: 'Fio elétrico 2,5mm (300m)', valor: 1950, categoria: 'material', data: daysAgo(22), forma_pagamento: 'Pix' },
    { descricao: 'Quadro de distribuição elétrica', valor: 1200, categoria: 'material', data: daysAgo(20), forma_pagamento: 'Cartão' },
    { descricao: 'Adiantamento encanador', valor: 4000, categoria: 'mao_obra', data: daysAgo(15), forma_pagamento: 'Pix', profissional_id: r3.id },
    { descricao: 'Tubos PVC (kit completo)', valor: 3100, categoria: 'material', data: daysAgo(13), forma_pagamento: 'Boleto' },
    { descricao: 'Andaime aluguel (30 dias)', valor: 1800, categoria: 'outros', data: daysAgo(10), forma_pagamento: 'Pix' },
    { descricao: 'Laje pré-moldada (120m²)', valor: 18000, categoria: 'material', data: daysAgo(8), forma_pagamento: 'Transferência' },
    { descricao: 'Impermeabilizante (20 latas)', valor: 1400, categoria: 'material', data: daysAgo(5), forma_pagamento: 'Pix' },
    { descricao: 'Mão de obra pedreiro — 2ª parcela', valor: 12000, categoria: 'mao_obra', data: daysAgo(3), forma_pagamento: 'Pix', profissional_id: r1.id },
  ]

  // Despesas — obra 2
  const despesasObra2 = [
    { descricao: 'Piso porcelanato 60x60 (80m²)', valor: 9600, categoria: 'material', data: daysAgo(28), forma_pagamento: 'Boleto' },
    { descricao: 'Argamassa colante (40 sacos)', valor: 880, categoria: 'material', data: daysAgo(26), forma_pagamento: 'Pix' },
    { descricao: 'Adiantamento equipe reforma', valor: 7000, categoria: 'mao_obra', data: daysAgo(25), forma_pagamento: 'Pix', profissional_id: r4.id },
    { descricao: 'Gesso liso (20 sacos)', valor: 560, categoria: 'material', data: daysAgo(20), forma_pagamento: 'Dinheiro' },
    { descricao: 'Tinta acrílica premium (30L)', valor: 1800, categoria: 'material', data: daysAgo(10), forma_pagamento: 'Cartão' },
    { descricao: 'Adiantamento pintor (8 dias)', valor: 2400, categoria: 'mao_obra', data: daysAgo(8), forma_pagamento: 'Pix', profissional_id: r5.id },
    { descricao: 'Forro de gesso (50m²)', valor: 2750, categoria: 'material', data: daysAgo(5), forma_pagamento: 'Boleto' },
    { descricao: 'Iluminação embutida (kit 20 spots)', valor: 1400, categoria: 'material', data: daysAgo(3), forma_pagamento: 'Cartão' },
  ]

  const allDespesas = [
    ...despesasObra1.map(d => ({ ...d, user_id: uid, obra_id: obra1.id })),
    ...despesasObra2.map(d => ({ ...d, user_id: uid, obra_id: obra2.id })),
  ]

  const { error: despErr } = await admin.from('despesas').insert(allDespesas)
  if (despErr) throw despErr
  console.log('✓ despesas:', allDespesas.length, 'registros')

  // 6. Pagamentos
  const { error: pagErr } = await admin.from('pagamentos').insert([
    { user_id: uid, obra_id: obra1.id, profissional_id: r1.id, valor: 8000, data: daysAgo(65), forma_pagamento: 'Pix', observacao: '1ª parcela' },
    { user_id: uid, obra_id: obra1.id, profissional_id: r1.id, valor: 12000, data: daysAgo(3), forma_pagamento: 'Pix', observacao: '2ª parcela' },
    { user_id: uid, obra_id: obra1.id, profissional_id: r2.id, valor: 6000, data: daysAgo(25), forma_pagamento: 'Pix', observacao: '1ª parcela' },
    { user_id: uid, obra_id: obra1.id, profissional_id: r3.id, valor: 4000, data: daysAgo(15), forma_pagamento: 'Pix', observacao: 'Adiantamento' },
    { user_id: uid, obra_id: obra2.id, profissional_id: r4.id, valor: 7000, data: daysAgo(25), forma_pagamento: 'Pix', observacao: 'Adiantamento' },
    { user_id: uid, obra_id: obra2.id, profissional_id: r5.id, valor: 2400, data: daysAgo(8), forma_pagamento: 'Pix', observacao: '8 diárias' },
  ])
  if (pagErr) throw pagErr
  console.log('✓ pagamentos: 6 registros')

  // 7. Recebimentos
  const { error: recErr } = await admin.from('recebimentos').insert([
    { user_id: uid, obra_id: obra1.id, valor: 90000, data: daysAgo(88), forma_pagamento: 'Transferência', observacao: 'Sinal — 30%' },
    { user_id: uid, obra_id: obra1.id, valor: 80000, data: daysAgo(45), forma_pagamento: 'Transferência', observacao: '2ª parcela' },
    { user_id: uid, obra_id: obra2.id, valor: 30000, data: daysAgo(28), forma_pagamento: 'Pix', observacao: 'Sinal — 38%' },
    { user_id: uid, obra_id: obra2.id, valor: 20000, data: daysAgo(7), forma_pagamento: 'Transferência', observacao: '2ª parcela' },
  ])
  if (recErr) throw recErr
  console.log('✓ recebimentos: 4 registros')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log(`   Email: ${TARGET_EMAIL}`)
  console.log(`   Obra 1: ${obra1.nome} — orçamento R$ ${obra1.orcamento.toLocaleString('pt-BR')}`)
  console.log(`   Obra 2: ${obra2.nome} — orçamento R$ ${obra2.orcamento.toLocaleString('pt-BR')}`)
}

run().catch(err => {
  console.error('❌ Erro:', err.message || err)
  process.exit(1)
})
