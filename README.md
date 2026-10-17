# Her Style — Custom 3D Fashion Studio

A private, mobile-first 3D fashion styling app. Pick an occasion, build an
outfit on a 3D avatar, rotate and inspect it, and save looks for later — all
running entirely client-side, with no account and no backend required.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **React Three Fiber** / **Drei** / **Three.js** for the 3D viewer
- **Zustand** for outfit builder state (with full undo/redo)
- **IndexedDB** (via `idb`) for local-first persistence, behind a
  repository abstraction (`src/lib/repository`) so a future Supabase-backed
  repository can be swapped in without touching the UI
- **Tailwind CSS v4** + small Radix-based UI primitives
- **Vitest** + Testing Library for unit tests, **Playwright** for an
  end-to-end smoke test

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No environment variables or cloud services
are required — the app works fully offline/local by default.

## The avatar

This app does **not** ship a personalized 3D avatar. Until you add one:

- The 3D viewer renders a clearly-labeled **development placeholder**
  figure instead — every other feature (outfit building, saving,
  wardrobe, recommendations) works normally with it.
- To add the real avatar, follow `docs/3d-asset-pipeline.md` (export
  requirements, skeleton/bone naming, attachment points) and
  `docs/asset-authoring-checklist.md` (per-garment checklist), then place
  the exported file at `public/assets/avatar/avatar.glb`.

Garments are either `skinned` (share the avatar's exact skeleton),
`rigid` (attach to a named point like `neck` or `waist`), or
`image-only` (a reference photo/preview, not a fitted 3D asset — these
are clearly marked in the UI and never silently treated as 3D-fitted).
Incompatible assets fail with a visible diagnostic message, never a
silent or incorrect attachment.

## Routes

| Route | Purpose |
|---|---|
| `/` | Home — quick-start by occasion |
| `/studio` | The outfit builder (3D viewer + category/color controls) |
| `/wardrobe` | Browse the full clothing catalog |
| `/saved` | Saved outfits — rename, favorite, duplicate, delete |
| `/avatar` | Avatar appearance settings (hair color, etc.) |
| `/settings` | Data export/reset and privacy info |

## Data & persistence

Everything (saved outfits, favorites, avatar appearance) is stored
locally in IndexedDB via `OutfitRepository`
(`src/lib/repository/indexeddb-repository.ts`). Saved outfits store only
catalog item IDs and config values — never transient Three.js or UI
state — so they restore correctly even as the UI evolves, and degrade
gracefully if a referenced asset is later removed.

The repository is an interface (`src/lib/repository/types.ts`), so a
Supabase-backed implementation can be added later to sync across devices
without any UI changes. If that's added, never put a Supabase
service-role key in browser code, and enable Row Level Security on any
synced tables.

## Adding a garment

Add one entry to `src/data/catalog.ts` (or the asset manifest for
avatar-only options) — no other files need to change. See
`docs/asset-authoring-checklist.md` for the full per-garment workflow.

## Testing

```bash
npm run test       # Vitest unit tests (outfit logic, 3D binding/attachment
                    # rules, asset validation, persistence, recommendations)
npm run test:e2e    # Playwright smoke test (build + start, then exercise
                     # the studio against the deterministic demo catalog)
npm run lint
npx tsc --noEmit
npm run build
```

The unit tests for garment binding/attachment and the Playwright smoke
test run against synthetic fixtures (`src/data/test-fixtures.ts`) or the
built-in demo catalog, so they never depend on the real avatar/garment
assets you add yourself.

## What's not implemented (v1)

- No real-time cloth simulation
- No body-shape customization of the avatar
- No AI-based outfit recommendations (the recommendation engine is a
  deterministic, rule-based scorer over catalog metadata)
- No cloud sync (local-only; see "Data & persistence" above for how it
  could be added)
