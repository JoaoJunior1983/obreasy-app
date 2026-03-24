import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

// Mapeamento de cores: App → identidade visual da LP
const replacements = [
  // Background principal
  ['bg-[#0a0a0f]',          'bg-[#0a0a0a]'],

  // Botões primários azuis
  ['bg-blue-600 hover:bg-blue-700', 'bg-[#0B3064] hover:bg-[#082551]'],
  ['bg-blue-600 hover:bg-blue-500', 'bg-[#0B3064] hover:bg-[#082551]'],
  ['bg-blue-600',           'bg-[#0B3064]'],
  ['hover:bg-blue-700',     'hover:bg-[#082551]'],
  ['hover:bg-blue-500',     'hover:bg-[#0e3d7a]'],

  // Textos azuis
  ['text-blue-400',         'text-[#7eaaee]'],
  ['text-blue-300',         'text-[#7eaaee]'],
  ['text-blue-500',         'text-[#7eaaee]'],
  ['text-blue-600',         'text-[#0B3064]'],

  // Fundos azuis com opacidade
  ['bg-blue-600/20',        'bg-[#0B3064]/20'],
  ['bg-blue-600/15',        'bg-[#0B3064]/15'],
  ['bg-blue-600/25',        'bg-[#0B3064]/25'],
  ['bg-blue-500/10',        'bg-[#0B3064]/10'],
  ['bg-blue-500/15',        'bg-[#0B3064]/15'],
  ['bg-blue-500/20',        'bg-[#0B3064]/20'],

  // Bordas azuis
  ['border-blue-500/20',    'border-[#0B3064]/30'],
  ['border-blue-500/30',    'border-[#0B3064]/40'],
  ['border-blue-400/50',    'border-[#0B3064]/50'],
  ['border-blue-600/25',    'border-[#0B3064]/30'],

  // Focus ring azul
  ['focus:ring-blue-500',   'focus:ring-[#0B3064]'],
  ['focus:border-blue-500', 'focus:border-[#0B3064]'],
  ['focus:ring-1 focus:ring-[#51ffa1]', 'focus:ring-1 focus:ring-[#0B3064]/50'],

  // Cards e fundos slate-800
  ['bg-slate-800/50',       'bg-[#1f2228]/80'],
  ['bg-slate-800/30',       'bg-[#1f2228]/50'],
  ['bg-slate-800/40',       'bg-[#1f2228]/60'],
  ['bg-slate-800/60',       'bg-[#1f2228]/90'],
  ["bg-slate-800 ",         "bg-[#1f2228] "],
  ["bg-slate-800\"",        "bg-[#1f2228]\""],
  ["bg-slate-800}",         "bg-[#1f2228]}"],

  // Fundos slate-900
  ['bg-slate-900/40',       'bg-[#13151a]/80'],
  ['bg-slate-900/50',       'bg-[#13151a]/80'],
  ['bg-slate-900/60',       'bg-[#13151a]/90'],
  ['bg-slate-900/30',       'bg-[#13151a]/60'],
  ["bg-slate-900 ",         "bg-[#13151a] "],
  ["bg-slate-900\"",        "bg-[#13151a]\""],
  ["bg-slate-900}",         "bg-[#13151a]}"],

  // Fundos slate-700 com opacidade (cards de métricas, ícones)
  ['bg-slate-700/20',       'bg-white/[0.04]'],
  ['bg-slate-700/30',       'bg-white/[0.05]'],
  ['bg-slate-700/50',       'bg-white/[0.08]'],
  ["bg-slate-700 ",         "bg-[#2a2d35] "],
  ["bg-slate-700\"",        "bg-[#2a2d35]\""],
  ["bg-slate-700}",         "bg-[#2a2d35]}"],

  // Bordas slate-700
  ['border-slate-700/30',   'border-white/[0.08]'],
  ['border-slate-700/40',   'border-white/[0.08]'],
  ['border-slate-700/50',   'border-white/10'],
  ['border-slate-700/20',   'border-white/[0.06]'],
  ["border-slate-700 ",     "border-white/[0.1] "],
  ["border-slate-700\"",    "border-white/[0.1]\""],
  ["border-slate-700}",     "border-white/[0.1]}"],

  // Bordas slate-600
  ['border-slate-600/20',   'border-white/[0.06]'],
  ['border-slate-600/30',   'border-white/[0.08]'],
  ["border-slate-600 ",     "border-white/[0.1] "],
  ["border-slate-600\"",    "border-white/[0.1]\""],

  // Botão cinza (Relatório, cancelar, etc)
  ['bg-slate-700 hover:bg-slate-600', 'bg-white/[0.08] hover:bg-white/[0.13]'],
  ['hover:bg-slate-600',    'hover:bg-white/[0.13]'],

  // Texto cinza do slate
  ['text-slate-400',        'text-[#999999]'],
  ['text-slate-500',        'text-[#777777]'],
  ['text-slate-300',        'text-[#cccccc]'],
]

// Diretórios a processar (não incluindo layout/header)
const DIRS = [
  'E:/PROJETOS LASY/apps-4997/joaojrsilva/project/src/app/obras',
  'E:/PROJETOS LASY/apps-4997/joaojrsilva/project/src/app/dashboard',
  'E:/PROJETOS LASY/apps-4997/joaojrsilva/project/src/components/custom',
]

// Arquivos a EXCLUIR (header, etc.)
const EXCLUDE = [
  'layout.tsx',
  'DashboardLayout.tsx',
  'Sidebar.tsx',
  'Header.tsx',
  'header.tsx',
  'navbar.tsx',
  'Navbar.tsx',
]

function getAllTsx(dir) {
  const results = []
  try {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f)
      if (statSync(full).isDirectory()) {
        results.push(...getAllTsx(full))
      } else if (extname(f) === '.tsx' && !EXCLUDE.includes(f)) {
        results.push(full)
      }
    }
  } catch {}
  return results
}

let totalFiles = 0
let totalChanges = 0

for (const dir of DIRS) {
  for (const file of getAllTsx(dir)) {
    let content = readFileSync(file, 'utf8')
    let changed = 0
    for (const [from, to] of replacements) {
      const before = content
      content = content.split(from).join(to)
      if (content !== before) changed++
    }
    if (changed > 0) {
      writeFileSync(file, content, 'utf8')
      console.log(`✓ ${file.replace('E:/PROJETOS LASY/apps-4997/joaojrsilva/project/src/', '')} (${changed} substituições)`)
      totalFiles++
      totalChanges += changed
    }
  }
}

console.log(`\n✅ ${totalFiles} arquivos atualizados, ${totalChanges} substituições de cor aplicadas`)
