# Mouhib Finance — Personal Finance Dashboard (Qatar / QAR)

A modern, full-stack personal finance dashboard built for managing salary and
personal finances in Qatar, with **QAR (Qatari Riyal)** as the primary
currency (optional display conversion to USD, EUR, TND).

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — custom light/dark theme
- **Prisma ORM + SQLite** — local file database (`prisma/dev.db`)
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

## Getting started

```bash
npm install
npx prisma db push      # creates prisma/dev.db from prisma/schema.prisma
npm run dev              # http://localhost:3000
```

Environment variables (`.env`, already present for local dev):

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="..."      # change for production
AUTH_SECRET="..."          # same value, NextAuth v5 reads this name
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true       # required for non-standard/dev hosts
```

For production, generate a strong random secret (`openssl rand -base64 32`)
and set `AUTH_TRUST_HOST` appropriately for your deployment host.

### Production build

```bash
npm run build
npm run start
```

## Database

SQLite via Prisma (`prisma/schema.prisma`). Entities: `User`, `Income`,
`Expense`, `Budget`, `SavingsGoal`, `Investment`, `InvestmentContribution`,
`Vacation`, `RecurringExpense`, `Settings`, `FinancialRule`,
`CalendarEvent`. Swapping to Postgres/MySQL later only requires changing the
`datasource` provider and `DATABASE_URL`.

## Notes

- All investment projections are clearly labeled as estimates — the app
  never claims a guaranteed return or gives personalized financial advice.
- No demo/fake data is created automatically; the setup wizard can be
  skipped and the app simply starts at zero.
- Data export (Settings → Reports) is available in CSV and JSON.
