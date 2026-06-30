# Safetech Fleet & Delivery Control Center — Build Workflow for GitHub Copilot

Paste this entire document into GitHub Copilot (Copilot Chat / Copilot Workspace) as your build brief. It is written as a sequence of phases so Copilot can generate, deploy, debug, test, and hand over a working app with admin access — at zero hosting cost.

---

## 0. Project Identity

- **App name:** Safetech Control Center (working title — rename freely)
- **Owner:** Safetech Precast Building Manufacturing LLC
- **Purpose:** Single web app to track daily trailer dispatch, live fleet status, and delivery output, replacing manual Excel/PDF logs, with automated efficiency analytics and bottleneck alerts.
- **Hosting budget:** $0 (free tier only)
- **Users:** 1 Admin (you) + Document Controllers (data entry) + read-only viewers (management)

---

## 1. Tech Stack (free-tier first)

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Fast, modern, free to host |
| Animation | Framer Motion | Smooth, interactive, "alive" dashboard feel without heavy cost |
| Charts | Recharts | Lightweight, good for KPI/trend visuals |
| Backend / DB | Supabase (Postgres + Auth + Realtime) | Free tier covers this scale (hundreds of rows/day); built-in auth and row-level security |
| Hosting (frontend) | Vercel or Netlify free tier | Auto-deploy from GitHub on every push |
| Hosting (backend) | Supabase free tier (no separate server needed) | No backend server to maintain |
| Auth | Supabase Auth (email/password) | Built-in admin vs. controller vs. viewer roles |

Tell Copilot explicitly: *"Use only free-tier services. Do not introduce paid dependencies."*

---

## 2. Phase-by-Phase Prompt Sequence for Copilot

Run these as separate Copilot Workspace tasks/prompts, in order. Each phase should end with a working, committed, tested increment — don't let Copilot jump ahead.

### Phase 1 — Scaffold & Schema
Prompt Copilot with:
> Scaffold a React + Vite + TypeScript + Tailwind project named `safetech-control-center`. Set up Supabase client integration. Create the following Postgres tables in Supabase with proper types and foreign keys:
> - `suppliers` (id, name)
> - `trailers` (id, plate_no, trailer_type [A-Frame/Flatbed/Truck Head], supplier_id, status, created_at)
> - `dispatch_log` (id, trailer_id, project_no, do_no, shift, diesel_status bool, driver_status bool, dn_status bool, leaving_status bool, remarks, log_date)
> - `fleet_status` (id, trailer_id, status_text, site_location, driver_name, driver_phone, status_timestamp) — status_text values: IN FACTORY EMPTY, NOT OFFLOAD, UNDER LOADING AT SY, SHIFTING AT SITE, INTERNAL SHIFTING, EMPTY/BACK TO FACTORY
> - `deliveries` (id, project_no, project_name, location, trailer_id, element_type, element_count, dn_no, volume_cum, weight_tons, remarks, delivery_date)
> - `projects` (id, project_no, project_name, location, active bool)
> - `users` (id, email, role enum [admin, controller, viewer])
> Enable Row Level Security: admin = full access, controller = insert/update on dispatch_log/fleet_status/deliveries, viewer = read-only.

### Phase 2 — Auth & Roles
> Implement Supabase Auth with email/password login. Create a protected route system: unauthenticated users see only the login screen. After login, route by role — admin sees Admin Panel (user management, project management), controller sees Data Entry + Dashboard, viewer sees Dashboard only. Seed one admin account using my email on first deploy.

### Phase 3 — Data Entry Screens (replace the PDFs/Excel)
> Build three data-entry forms matching these real operational documents: (1) Trailer Dispatch Log entry — quick checklist-style form per trailer (diesel/driver/DN/leaving toggle switches, not checkboxes, with autosave), (2) Fleet Status update — quick status-change dropdown per trailer with timestamp auto-capture, (3) Delivery Log entry — project, trailer, element type, count, DN number, volume, weight. All forms must be fast to fill on mobile (field/yard use), with autocomplete on trailer plate numbers and project numbers pulled from existing tables.

### Phase 4 — Analytics Engine
> Build a calculations module that derives, from the raw tables:
> - Trailer cycle time = time between consecutive status changes for the same trailer (load → dispatch → offload → return)
> - Trailer utilization % = (time in active/loaded states) / (total tracked time)
> - Idle/bottleneck detection = flag any trailer in "NOT OFFLOAD" status for longer than a configurable threshold (default 24 hrs)
> - Site congestion score = count of trailers stuck at each project/site, ranked
> - Daily throughput = trips, volume (m³), weight (tons), elements delivered, grouped by project and by Precast vs HCS
> - Supplier performance = average cycle time and idle time per supplier
> Expose these as reusable functions/hooks the dashboard can call.

### Phase 5 — Dashboard UI (modern, animated, interactive)
> Build the main dashboard using Framer Motion for animated KPI cards (count-up numbers, smooth transitions on data refresh) and Recharts for: a live fleet status donut/breakdown chart, a bottleneck leaderboard (sites/suppliers with most idle trailers), a daily delivery trend line chart (volume & trips over time), and a trailer status board (kanban-style columns: Empty / Loading / Dispatched / Not Offloaded / Returning). Use a dark, high-contrast "command center" theme with red/black accents matching Safetech branding, glassmorphism cards, and subtle hover/load animations. Make it fully responsive for phone use in the yard.

### Phase 6 — Alerts & Suggested Actions
> Add a notifications/alerts panel that auto-generates plain-language suggestions when thresholds are breached, e.g. "12 trailers idle >24h at ACERS VILLA — site is bottlenecked, consider rerouting next 3 dispatches" or "Supplier X averaging 40% slower cycle time than fleet average." Surface these at the top of the dashboard, not buried in a log.

### Phase 7 — Testing
> Write unit tests (Vitest) for the analytics engine functions in Phase 4 using sample data matching the structure of the uploaded reports. Write at least one end-to-end test (Playwright) covering: login → enter a dispatch log row → see it reflected on the dashboard. Run all tests and fix any failures before proceeding.

### Phase 8 — Deploy
> Connect this GitHub repo to Vercel (or Netlify) for automatic deployment on push to `main`. Set Supabase environment variables as deployment secrets (never commit keys). Verify the live deployed URL loads correctly, auth works, and data round-trips to Supabase. Provide me the live URL.

### Phase 9 — Debug Pass
> Run through every screen as each role (admin, controller, viewer) on the live deployed URL. Fix any console errors, broken auth redirects, mobile layout breaks, or failed Supabase queries. Re-deploy after fixes and confirm clean console on all three role views.

### Phase 10 — Handover
> Generate a short HANDOVER.md containing: the live app URL, the admin login credentials (placeholder, to be changed on first login), how to add new controller/viewer users from the Admin Panel, how to add new projects/suppliers, and how to redeploy after future changes (just `git push`). Confirm admin access is fully working before calling this complete.

---

## 3. Guardrails to give Copilot up front

- No paid APIs or services anywhere in the stack.
- Every form must work on a basic Android phone browser (yard staff won't use laptops).
- Don't let any phase get marked "done" until it builds, deploys, and is manually verified — no skipped testing.
- Keep the admin able to edit/correct any record (data entry mistakes from the field will happen).
- Keep raw historical Excel/PDF data importable later via a CSV upload screen (build this as a stretch task after Phase 6 if time allows).

---

## 4. What "done" looks like

A live URL, free to run indefinitely, where you log in as admin, see today's fleet status and delivery KPIs animate in, drill into bottlenecked sites, and your document controllers can update trailer/delivery status from their phones in under 30 seconds per entry.
