# Safetech Control Center — Phase 1–7

Frontend (Vite + React + TypeScript + Tailwind) with Supabase Auth, role-based
routing (admin / controller / viewer), data-entry forms, an animated KPI
dashboard with charts and alerts, admin user/project/supplier management,
CSV import for historical data, and a starter analytics test suite.

## Local run
1. `npm install`
2. Create a `.env` file from `.env.example` and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. `npm run dev`

## Apply DB schema
1. Open the Supabase SQL editor and run `db/init.sql`
2. In Supabase Auth (Authentication → Users), manually create your own admin
   account with your real email and a password
3. Copy that user's UID, then run:
   ```
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed_admin.js <AUTH_UID> <your-email>
   ```
   There is no default/fallback email — you must pass your own.
4. Log in at `/login`. You'll see Dashboard, Entry, and (as admin) Admin and
   Import in the nav bar.

## Adding more users
Create the account in Supabase Auth, then as an admin go to **Admin → Users**
once their row exists in `users` (defaults to `viewer`) and change their role.

## What's implemented
- **Auth**: email/password login with redirect, session persistence, sign-out, role-gated routes
- **Entry** (`/entry`, controller/admin): tabbed Dispatch Log, Fleet Status, and Delivery forms
  with autocomplete on trailer plates and project numbers; dispatch autosave upserts a single
  draft row rather than creating duplicates
- **Dashboard** (`/dashboard`, all roles): animated count-up KPI cards (trips, avg cycle time,
  idle >24h, volume), a live fleet-status donut chart, a bottleneck leaderboard, a daily
  delivery trend line chart, and a 5-column trailer status kanban board
- **Alerts panel**: auto-generated plain-language warnings when a site has idle trailers,
  shown at the top of the dashboard
- **Admin** (`/admin`, admin only): three tabs — Users (role management), Projects
  (add/activate/deactivate), Suppliers (add/list)
- **Import** (`/import`, admin only): CSV upload to backfill the `deliveries` table from old
  Excel/PDF logs, with a preview and per-row error reporting
- **Analytics engine** (`src/lib/analytics.ts`), unit-tested: cycle time, utilization %,
  idle/bottleneck detection, site congestion, daily throughput, supplier performance, current
  fleet status, alert generation
- **Unit tests**: 9 passing (Vitest)
- **E2E test scaffold**: `tests/e2e/login-dispatch-dashboard.spec.ts` covers login → dispatch
  entry → dashboard. Not run in this environment — requires `npx playwright install` and a real
  Supabase project. Set `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` to a seeded controller account,
  then run `npm run test:e2e`.

## Known gaps / good next steps
- `supplierPerformance()` exists but isn't wired to live data — the `deliveries` table has no
  `supplier_id` or computed cycle time yet, so the alerts panel only covers site congestion.
  Adding `supplier_id` to `deliveries` (or joining via `trailer_id → trailers.supplier_id`)
  would unlock supplier-comparison alerts described in the original brief.
- No deploy step was run — this was built and verified locally (`tsc --noEmit`, `vitest`,
  `vite build` all pass). Connecting the repo to Vercel/Netlify and wiring Supabase secrets is
  still a manual step.
- Production bundle is ~950kB (270kB gzipped) — recharts + framer-motion pull weight. Fine at
  this scale, but worth code-splitting (`React.lazy`) per route if it ever feels slow on yard
  phones.
