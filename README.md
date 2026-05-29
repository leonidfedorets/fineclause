# FineClause — AI Contract & Career Intelligence Platform

FineClause is a production-ready SaaS platform that uses AI to help individuals and businesses understand legal documents and make smarter career decisions.

**Live:** [https://fineclause.vercel.app](https://fineclause.vercel.app) · [https://fineclause.com](https://fineclause.com)

---

## What is FineClause?

FineClause has two core product pillars:

### 1. Contract Intelligence
Upload any legal document — contract, NDA, lease, employment agreement, SaaS terms — and receive an instant AI analysis:
- **Risk scoring** — each clause rated Safe / Caution / Danger
- **Plain-English explanations** — no legal jargon
- **Suggested alternatives** — AI rewrites risky clauses into fairer language
- **Document type detection** — automatically identifies the contract type
- **Downloadable PDF report** — shareable branded report

Supported formats: PDF, DOCX, TXT, Markdown, RTF (up to 20MB)

### 2. Career Intelligence
Upload a CV/resume and receive a comprehensive AI career assessment:
- **CV quality score** (0–100)
- **Salary range estimate** in EUR based on skills and market data
- **Skill gap analysis** — what's missing for your target level
- **Job matching** — matched against live recruiter job listings
- **Actionable improvements** — top 3 concrete steps to strengthen the CV

### Additional Business Tools
| Feature | Description |
|---------|-------------|
| **Invoice Parser** | AI extracts line items, totals, and tax from uploaded invoices |
| **Receipt Parser** | Categorises expenses from receipts |
| **Tax Estimator** | Estimates freelance/contractor tax obligations |
| **Carbon Footprint** | Analyses business carbon data |
| **Document Templates** | AI-assisted legal template filling |
| **Invoice Generator** | Create and send professional invoices |
| **Recruiter Dashboard** | Post jobs, browse matched candidates, HubSpot integration |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| AI | OpenAI GPT-4o-mini via OpenAI API |
| Payments | Stripe (subscriptions + customer portal) |
| Analytics | Amplitude (autocapture + session replay) |
| Hosting | Vercel (frontend) + Supabase Cloud (backend) |
| i18n | i18next (EN, DE, FR, ES, PL, CS, UK, LV) |
| PWA | vite-plugin-pwa (offline support, installable) |

---

## Prerequisites

- **Node.js** v18+ and **npm** v9+ — [install via nvm](https://github.com/nvm-sh/nvm)
- **Supabase account** — [supabase.com](https://supabase.com) (free tier works)
- **OpenAI API key** — [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Supabase CLI** — `brew install supabase/tap/supabase` (macOS) or see [docs](https://supabase.com/docs/guides/cli)

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/leonidfedorets/fineclause.git
cd fineclause
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-ref
```

Get these values from your [Supabase dashboard](https://supabase.com/dashboard) under **Project Settings → API**.

### 4. Set up the database

Link your local project to Supabase and push all migrations:

```bash
# Login to Supabase CLI
supabase login

# Link to your project (replace with your project ref)
supabase link --project-ref your-project-ref

# Push all 26 database migrations
supabase db push
```

### 5. Deploy Edge Functions

```bash
# Deploy all AI and business logic functions
supabase functions deploy analyze-contract --project-ref your-project-ref
supabase functions deploy analyze-cv --project-ref your-project-ref
supabase functions deploy analyze-tax --project-ref your-project-ref
supabase functions deploy analyze-carbon --project-ref your-project-ref
supabase functions deploy parse-invoice --project-ref your-project-ref
supabase functions deploy parse-receipt --project-ref your-project-ref
supabase functions deploy generate-invoice --project-ref your-project-ref
supabase functions deploy fill-template --project-ref your-project-ref
supabase functions deploy generate-job-description --project-ref your-project-ref
supabase functions deploy send-invoice-email --project-ref your-project-ref
supabase functions deploy match-cv-jobs --project-ref your-project-ref
supabase functions deploy check-subscription --project-ref your-project-ref
supabase functions deploy create-checkout --project-ref your-project-ref
supabase functions deploy customer-portal --project-ref your-project-ref
supabase functions deploy increment-scans --project-ref your-project-ref
supabase functions deploy share-report --project-ref your-project-ref
supabase functions deploy preview-template --project-ref your-project-ref
supabase functions deploy admin-templates --project-ref your-project-ref
supabase functions deploy admin-users --project-ref your-project-ref
supabase functions deploy create-hubspot-lead --project-ref your-project-ref
supabase functions deploy process-recurring-invoices --project-ref your-project-ref
```

### 6. Set required Supabase secrets

```bash
# OpenAI API key — required for all AI features
supabase secrets set OPENAI_API_KEY=sk-... --project-ref your-project-ref

# Stripe keys — required for subscription/payments (optional for local dev)
supabase secrets set STRIPE_SECRET_KEY=sk_... --project-ref your-project-ref
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref your-project-ref
```

### 7. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:8080**

---

## Available Scripts

```bash
# Start development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run tests (24 unit tests)
npm test

# Run tests in watch mode
npm run test:watch

# Lint the codebase
npm run lint
```

---

## Project Structure

```
fineclause/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── ui/              # shadcn/ui base components
│   ├── pages/               # Route-level page components
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # Auth context
│   ├── integrations/
│   │   └── supabase/        # Supabase client + TypeScript types
│   ├── lib/                 # Utilities (cn, PDF generator, etc.)
│   └── i18n/                # Translation files (8 languages)
├── supabase/
│   ├── functions/           # 21 Deno Edge Functions
│   └── migrations/          # 26 SQL migrations (full schema)
├── public/                  # Static assets, sitemap, robots.txt
├── index.html               # HTML entry point with SEO meta + JSON-LD
└── vite.config.ts           # Vite + PWA configuration
```

---

## Edge Functions Overview

All functions are Deno-based and deployed to Supabase Edge Functions:

| Function | Purpose | AI? |
|----------|---------|-----|
| `analyze-contract` | Full contract risk analysis | ✅ GPT-4o-mini |
| `analyze-cv` | CV scoring, salary estimate, job matching | ✅ GPT-4o-mini |
| `analyze-tax` | Freelance tax estimation | ✅ GPT-4o-mini |
| `analyze-carbon` | Carbon footprint analysis | ✅ GPT-4o-mini |
| `parse-invoice` | Extract data from invoice files | ✅ GPT-4o-mini |
| `parse-receipt` | Categorise expense receipts | ✅ GPT-4o-mini |
| `generate-invoice` | Create formatted invoices | ✅ GPT-4o-mini |
| `fill-template` | AI-assisted template completion | ✅ GPT-4o-mini |
| `generate-job-description` | Write job descriptions | ✅ GPT-4o-mini |
| `send-invoice-email` | Email invoices to clients | ✅ GPT-4o-mini |
| `match-cv-jobs` | Match CVs against job listings | — |
| `check-subscription` | Verify Stripe subscription status | — |
| `create-checkout` | Create Stripe checkout session | — |
| `customer-portal` | Open Stripe billing portal | — |
| `increment-scans` | Track scan usage quotas | — |
| `share-report` | Generate shareable report links | — |
| `preview-template` | Render template preview | — |
| `admin-templates` | Admin template management | — |
| `admin-users` | Admin user management | — |
| `create-hubspot-lead` | Push candidate leads to HubSpot | — |
| `process-recurring-invoices` | Scheduled invoice processing | — |

---

## Subscription Tiers

| Plan | Scans | Price |
|------|-------|-------|
| Free | 1 scan | €0/mo |
| Basic (`prod_U3SeCMHKuHMYC0`) | 10 scans | paid |
| Pro (`prod_U1Lnud0U3FVc6k`) | Unlimited | paid |
| Enterprise (`prod_U3TACwcpT0V5NA`) | Unlimited | paid |

---

## Deployment

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

Add environment variables in the [Vercel dashboard](https://vercel.com/dashboard):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Supabase (Backend)

All Edge Functions and database migrations are deployed via the Supabase CLI (see setup steps above). The Supabase project handles auth, database, storage, and serverless functions.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | ✅ | Supabase project reference ID |

**Supabase secrets** (set via `supabase secrets set`):

| Secret | Required | Description |
|--------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for all AI features |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook signing secret |

---

## Supported Languages

English · German · French · Spanish · Polish · Czech · Ukrainian · Latvian

---

## Contact

- **Email:** sales@empatixtech.com
- **Telegram:** [@empatixtech](https://t.me/empatixtech)
- **WhatsApp:** [+371 26 761 557](https://wa.me/37126761557)
- **Address:** Pērnavas iela 21-22, Rīga, LV-1009, Latvia
