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
fi

echo ""
echo "✓ Deploy disparado! Acompanhe em:"
echo "  https://vercel.com/joao-junior-da-silvas-projects/obreasy"
echo ""
echo "Produção: https://www.obreasy.com.br"
