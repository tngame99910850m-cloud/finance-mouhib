# Mouhib Finance — Personal Finance Dashboard (Qatar / QAR)

A modern personal finance dashboard for managing salary and personal
finances in Qatar, with **QAR (Qatari Riyal)** as the primary currency
(optional display conversion to USD, EUR, TND).

**No database, no account, no backend.** Everything runs entirely in your
browser — data is stored in `localStorage`, so it's private to your device
and requires zero setup to deploy.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — custom light/dark theme
- **Recharts** — cash flow, income history, budget and yearly charts
- **localStorage** — the entire data layer (`src/lib/local-store.ts`); no
  server, no API routes, no database

## Features

- First-run setup wizard (or skip it and start at zero — no fake data)
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
- Monthly & yearly reports with charts, plus CSV/JSON export (downloaded
  directly from the browser)
- Dark/light mode, fully responsive (desktop + mobile with a slide-out nav)
- "Reset data" in the sidebar clears everything stored in the browser

## Getting started

```bash
npm install
npm run dev   # http://localhost:3000
```

That's it — no environment variables, no database connection string, no
account to create. Open the app and it walks you through the setup wizard.

### Production build

```bash
npm run build
npm run start
```

## Deploying to Vercel

There is nothing to configure. Push this repo to Git, import it in Vercel
(or run `vercel --prod`), and it deploys — no environment variables, no
database provisioning, no build-time secrets.

## Data storage

All data lives in the browser's `localStorage` under a single key
(`src/lib/local-store.ts`), covering income, expenses, budgets, savings
goals, investments, vacations, recurring expenses, settings, financial
rules, and calendar events. This means:

- Data is private to the browser/device it was entered on — it is never
  sent to a server.
- Clearing browser data, using a different browser, or a different device
  starts fresh (no sync between devices).
- Export to CSV/JSON (Reports page) is the way to back up or move data.

If you later want multi-device sync or a real backend, the data model in
`local-store.ts` (types + shape) mirrors a conventional per-user schema and
can be swapped for an API-backed store without changing the UI much.

## Notes

- All investment projections are clearly labeled as estimates — the app
  never claims a guaranteed return or gives personalized financial advice.
- No demo/fake data is created automatically; the setup wizard can be
  skipped and the app simply starts at zero.
