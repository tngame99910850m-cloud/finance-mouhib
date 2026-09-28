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
npx prisma migrate dev --name init   # creates prisma/migrations + applies them
npm run dev                          # http://localhost:3000
```

(`npx prisma db push` also works for quick local iteration without keeping
migration history, but `migrate dev` is what you want to commit before
deploying — see below.)

### Production build

```bash
npm run build   # runs `prisma generate` automatically, then `next build`
npm run start
```

## Deploying to Vercel

Vercel's filesystem is ephemeral/serverless, so **SQLite will not work
there** — this project is already set up for a hosted Postgres instead.

The `/db-setup` page (see above) uses `prisma db push`, which is great for
local iteration but doesn't create migration files — Vercel needs actual
migrations (step 2 below) to run `prisma migrate deploy` on each build.

1. **Provision Postgres.** Any provider works (Vercel Postgres/Neon,
   Supabase, Railway, etc.). Grab the pooled connection string it gives you.
2. **Generate migrations locally against that database** (only needs to be
   done once, before your first deploy):
   ```bash
   DATABASE_URL="<your connection string>" npx prisma migrate dev --name init
   ```
   Commit the resulting `prisma/migrations/` folder — Vercel doesn't have
   the interactive DB access needed to create migrations itself, only to
   apply them.
3. **In the Vercel project settings, add environment variables:**
   - `DATABASE_URL` — your Postgres connection string
   - `AUTH_SECRET` — a strong random value (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your production URL, e.g. `https://your-app.vercel.app`
   - `AUTH_TRUST_HOST` — `true`
4. **Nothing else to configure for the build.** This repo already has a
   `vercel-build` script in `package.json`
   (`prisma generate && prisma migrate deploy && next build`), which Vercel
   runs automatically instead of the regular `build` script. Plain
   `npm run build` (used for local/other-host builds) deliberately only runs
   `prisma generate`, not `migrate deploy`, so it never touches a real
   database's schema by accident.
5. Push to your Git remote and import the repo in Vercel, or run `vercel
   --prod` from this directory.

If your Postgres provider gives you both a pooled and a direct/unpooled URL
(common with Neon/PgBouncer), you may need a second `DIRECT_URL` env var and
a matching `directUrl` line in `datasource db` in `prisma/schema.prisma` —
Prisma's migration engine needs a direct (non-pooled) connection, while the
app itself can use the pooled one.

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
