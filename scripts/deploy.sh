#!/bin/bash
# ============================================================
# deploy.sh — Envia o código para a Vercel buildar remotamente
# Uso: ./scripts/deploy.sh           → deploy para produção
#      ./scripts/deploy.sh --preview → deploy de preview
# ============================================================

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "=== OBREASY Deploy ==="
echo ""

if [[ "$1" == "--preview" ]]; then
  echo "→ Fazendo deploy de preview (build remoto na Vercel)..."
  vercel --yes
else
  echo "→ Fazendo deploy para produção (build remoto na Vercel)..."
  vercel deploy --prod --yes

  # Status "Production" no deploy novo não garante que www.obreasy.com.br migre sozinho.
  # Se o domínio ficar preso em um deploy antigo, reassign manualmente:
  # cd ~/Desktop/projetos/Programação/obreasy-app
  # vercel alias set $(vercel ls --prod --yes 2>/dev/null | awk 'NR==5 {print $2}') www.obreasy.com.br
fi

echo ""
echo "✓ Deploy disparado! Acompanhe em:"
echo "  https://vercel.com/joao-junior-da-silvas-projects/obreasy"
echo ""
echo "Produção: https://www.obreasy.com.br"
