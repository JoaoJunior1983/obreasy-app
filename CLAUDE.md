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
- **Payments**: Digital Manager Guru (subscription webhooks) + Stripe
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
│   ├── guru-*.ts           # Guru subscription/plan management
│   ├── alerts.ts, budget-*.ts  # Budget alert system
│   └── utils.ts            # cn() helper (clsx + tailwind-merge)
└── types/
    └── supabase.ts         # Auto-generated database types
```

## Key Patterns

- **Supabase client**: `src/lib/supabase.ts` exports a lazy-initialized singleton via Proxy. Use `import { supabase } from '@/lib/supabase'` on client, `supabase-server.ts` on server.
- **Auth state**: Stored in both Supabase session and localStorage (`isAuthenticated`, `user`, `trialExpiraEm`, `activeObraId`). AuthProvider in `src/components/auth/AuthProvider.tsx` manages state.
- **Email routing**: Contact form (`/api/contato`) sends to contato@obreasy.com.br; support form (`/api/suporte`) sends to suporte@obreasy.com.br. Both use Resend.
- **Subscription webhooks**: `/api/webhooks/guru/subscription` and `/api/webhooks/guru/transaction` handle Guru webhook events, validated via `GURU_API_TOKEN`.
- **Iframe embedding**: The app is configured to be embedded in the Lasy platform (lasy.app/lasy.ai) via CSP frame-ancestors in `next.config.ts`.

## Environment Variables

Required for full functionality:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase (has hardcoded fallbacks)
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase operations
- `RESEND_API_KEY` — Email sending
- `GURU_API_TOKEN` — Webhook validation for subscription management

## Database

Schema is defined via Supabase migrations in `/supabase/` and `/migrations/`. Types are auto-generated in `src/types/supabase.ts`. Key tables: `obras`, `clientes`, `despesas`, `profissionais`, `pagamentos`, `diario_obra`, `comprovantes_pagamentos`, `admin_trials`, `user_profiles`.
