# Mouhib Finance — Personal Finance Dashboard (Qatar / QAR)

A modern, full-stack personal finance dashboard built for managing salary and
personal finances in Qatar, with **QAR (Qatari Riyal)** as the primary
currency (optional display conversion to USD, EUR, TND).

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — custom light/dark theme
- **Prisma ORM + PostgreSQL** — works with Neon, Vercel Postgres, Supabase, etc.
- **NextAuth v5 (Credentials)** — email/password auth, bcrypt password hashing
- **Recharts** — cash flow, income history, budget and yearly charts
- **Zod** — API input validation

## Features

- Setup wizard that seeds your first financial plan (no fake/demo data)
- Dashboard: monthly overview cards, cash flow breakdown, financial insights
- Income tracking (basic salary, allowances, bonuses, overtime, other income)
- Expenses with Qatar-relevant categories (Kahramaa, Ooredoo/Vodafone,
  Talabat, Snoonu, Karwa, Metro, etc.) plus custom categories
- Budgets per category with progress bars and over-budget warnings
- Customizable 50/30/20 (or any split) savings framework
- Savings goals with progress, ETA, and a dedicated Emergency Fund calculator
  (3 / 6 / 12 month targets)
- Vacation planner with automatic required-monthly-saving calculation
- Investment planner: per-investment compound projections, a standalone
  compound growth calculator, an allocation planner, and risk-profile
  education (clearly labeled as estimates, not guarantees, and not advice)
- Personal Finance Health Overview (savings rate, expense ratio, investment
  rate, emergency fund coverage — computed only from your own data)
- Recurring expenses that can be applied to the current month automatically
- Financial calendar (salary date, bills, subscriptions, reminders)
- Monthly & yearly reports with charts, plus CSV/JSON export
- Dark/light mode, fully responsive (desktop + mobile with a slide-out nav)

## Getting started (local dev)

**Option A — in-app database setup:** run `npm install && npm run dev`,
then open `http://localhost:3000/db-setup` and paste your Postgres
connection string (Supabase: Project Settings → Database → Connection
string). It tests the connection, saves it to `.env`, and creates the
tables for you — no terminal commands needed beyond the first two.

**Option B — manual:**

1. Get a Postgres connection string (any provider — Supabase, Neon, Vercel
   Postgres, a local `docker run postgres`, etc.).
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and a generated
   `AUTH_SECRET` (`openssl rand -base64 32`).
3. Install deps and create the schema:

```bash
npm install
npx prisma db push   # creates the tables from prisma/schema.prisma
npm run dev           # http://localhost:3000
```

### Production build

```bash
npm run build   # runs `prisma generate` automatically, then `next build`
npm run start
```

## Deploying to Vercel

Vercel's filesystem is ephemeral/serverless, so **SQLite will not work
there** — this project is already set up for a hosted Postgres instead.

1. **Provision Postgres.** Any provider works (Supabase, Vercel
   Postgres/Neon, Railway, etc.). Grab its connection string.
2. **In the Vercel project settings, add environment variables:**
   - `DATABASE_URL` — your Postgres connection string
   - `AUTH_SECRET` — a strong random value (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your production URL, e.g. `https://your-app.vercel.app`
   - `AUTH_TRUST_HOST` — `true`
3. **Nothing else to configure.** This repo has a `vercel-build` script in
   `package.json` (`prisma generate && prisma db push --accept-data-loss &&
   next build`), which Vercel runs automatically instead of the regular
   `build` script — it syncs the schema to whatever `DATABASE_URL` is set,
   on every deploy, no migration files or local steps needed. Plain
   `npm run build` (used for local/other-host builds) deliberately only runs
   `prisma generate`, so it never touches a real database's schema by
   accident.

   Trade-off: this skips Prisma's migration history in favor of zero-setup
   deploys. If you outgrow that (team project, need rollback history), switch
   `vercel-build` to `prisma migrate deploy` and generate a migration once
   with `prisma migrate dev --name init` against your database.
4. Push to your Git remote and import the repo in Vercel, or run `vercel
   --prod` from this directory.

## Database

PostgreSQL via Prisma (`prisma/schema.prisma`). Entities: `User`, `Income`,
`Expense`, `Budget`, `SavingsGoal`, `Investment`, `InvestmentContribution`,
`Vacation`, `RecurringExpense`, `Settings`, `FinancialRule`,
`CalendarEvent`.

## Notes

- All investment projections are clearly labeled as estimates — the app
  never claims a guaranteed return or gives personalized financial advice.
- No demo/fake data is created automatically; the setup wizard can be
  skipped and the app simply starts at zero.
- Data export (Settings → Reports) is available in CSV and JSON.
