# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obreasy is a SaaS construction project management app (Portuguese, pt-BR) built for engineers and architects in Brazil. Production URL: obreasy.com.br. Deployed on Vercel.

## Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build (TypeScript errors are ignored via next.config.ts)
npm run lint         # ESLint
npm run start        # Start production server
```

No test framework is configured.

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript 5
- **UI**: Shadcn/ui (new-york style) + Radix UI + Tailwind CSS v4 + Framer Motion
- **Database & Auth**: Supabase (PostgreSQL + Auth with implicit flow)
- **Payments**: RevenueCat (In-App Purchase via App Store/Google Play — only way to start a new subscription) + Digital Manager Guru (legacy web checkout, kept running only for subscribers who signed up before the IAP migration) + Stripe
- **Email**: Resend (transactional emails)
- **PDF**: jsPDF + jspdf-autotable
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Architecture

Path alias: `@/*` maps to `src/*`.

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes (contato, suporte, webhooks/guru)
│   ├── admin/              # Admin panel (trials, users, reports)
│   ├── dashboard/          # Main authenticated app
│   │   ├── obra/           # Project detail pages (financials, diary, professionals)
│   │   ├── despesas/       # Expense management
│   │   ├── pagamentos/     # Payment tracking
│   │   ├── profissionais/  # Worker management
│   │   ├── clientes/       # Client management
│   │   └── plano/          # Subscription plan
│   ├── cadastro/           # Registration
│   ├── newlp/              # Landing page
│   └── relatorios/         # Reports
├── components/
│   ├── ui/                 # Shadcn/ui components (do not edit manually, use `npx shadcn@latest add`)
│   ├── custom/             # App-specific components (Header, BottomNav, auth-modal, etc.)
│   └── auth/               # AuthProvider
├── hooks/                  # use-supabase, use-toast, use-mobile
├── lib/                    # Utilities
│   ├── supabase.ts         # Client-side Supabase singleton (lazy via Proxy)
│   ├── supabase-server.ts  # Server-side Supabase client
│   ├── guru-*.ts           # Legacy Guru subscription/plan management (existing web subscribers only, no new checkout)
│   ├── revenuecat-*.ts     # RevenueCat client/webhook — the only path for new subscriptions (App Store/Google Play IAP)
│   ├── alerts.ts, budget-*.ts  # Budget alert system
│   └── utils.ts            # cn() helper (clsx + tailwind-merge)
└── types/
    └── supabase.ts         # Auto-generated database types
```

## Key Patterns

- **Supabase client**: `src/lib/supabase.ts` exports a lazy-initialized singleton via Proxy. Use `import { supabase } from '@/lib/supabase'` on client, `supabase-server.ts` on server.
- **Auth state**: Stored in both Supabase session and localStorage (`isAuthenticated`, `user`, `trialExpiraEm`, `activeObraId`). AuthProvider in `src/components/auth/AuthProvider.tsx` manages state.
- **Email routing**: Contact form (`/api/contato`) sends to contato@obreasy.com.br; support form (`/api/suporte`) sends to suporte@obreasy.com.br. Both use Resend.
- **Subscription webhooks**: `/api/webhooks/revenuecat` handles all new subscriptions (IAP via App Store/Google Play), validated via `REVENUECAT_WEBHOOK_AUTH`. `/api/webhooks/guru/subscription` and `/api/webhooks/guru/transaction` are legacy — they still process events for subscribers who checked out via Guru before the IAP migration, validated via `GURU_API_TOKEN`, but the app no longer offers a Guru checkout link to new customers (`/dashboard/plano` shows a "download the app" prompt on web instead).
- **Iframe embedding**: The app is configured to be embedded in the Lasy platform (lasy.app/lasy.ai) via CSP frame-ancestors in `next.config.ts`.

## Environment Variables

Required for full functionality:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase (has hardcoded fallbacks)
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase operations
- `RESEND_API_KEY` — Email sending
- `GURU_API_TOKEN` — Legacy webhook validation, only needed for existing pre-IAP Guru subscribers
- `NEXT_PUBLIC_REVENUECAT_IOS_KEY` / `NEXT_PUBLIC_REVENUECAT_ANDROID_KEY` / `REVENUECAT_WEBHOOK_AUTH` — RevenueCat IAP (see `REVENUECAT_SETUP.md`)

## Database

Schema is defined via Supabase migrations in `/supabase/` and `/migrations/`. Types are auto-generated in `src/types/supabase.ts`. Key tables: `obras`, `clientes`, `despesas`, `profissionais`, `pagamentos`, `diario_obra`, `comprovantes_pagamentos`, `admin_trials`, `user_profiles`.

<!-- wa-link:start -->
WhatsApp deste projeto: `obreasy-lasy-ai` (João Junior — Obreasy). Consulte o histórico via MCP `whatsapp-collector` usando esse slug. Pra acompanhar ativamente, use `acompanhar_chat`. Detalhes em `.claude/whatsapp.json`.

No Zarpa o projeto é `Bu9wBHSBT7JnCtDb6MrlmX55CXHtaQwH`, na organização LasyAI (`fncbjbP973IbIXdYZbOgOCxZVouaK4ja`), já vinculado a esse mesmo slug — `projeto_do_grupo` traduz um no outro.
<!-- wa-link:end -->


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
