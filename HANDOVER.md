# Safetech Control Center — Handover

## Live App
- **URL:** _not yet deployed — fill in once connected to Vercel/Netlify (see Deploying, below)_
- **Repo:** _add your GitHub repo URL here once pushed_

## Admin Login (first account)
There is no built-in default admin — you create this yourself:

1. In Supabase: **Authentication → Users → Add user**, enter your real email and a
   temporary password.
2. Copy that user's **UID** from the Users table.
3. From the project root, run:
   ```
   SUPABASE_URL=<your-project-url> SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
     node scripts/seed_admin.js <AUTH_UID> <your-email>
   ```
   This inserts your account into the `users` table with `role = admin`.
4. Log in at `/login` with that email and the temporary password.
5. **Change your password** on first login: Supabase Auth → Users → select your
   account → reset/update password (there's no in-app "change password" screen yet —
   do it from the Supabase dashboard for now).

⚠️ The service role key has full database access and bypasses Row Level Security.
Only use it locally or as a deployment secret — never put it in `.env` files that
get committed, and never expose it to the frontend (it's not in `VITE_*` vars for
this reason).

## Adding Controller / Viewer Users
1. Create their account in Supabase Auth (Authentication → Users → Add user), or
   enable self-signup later if you want.
2. They'll appear in the app's **Admin → Users** tab automatically once their auth
   account exists and they've logged in at least once (a row gets created in the
   `users` table, defaulting to `viewer`).
3. As an admin, open **Admin → Users**, find their email, and change the role
   dropdown to `controller` or `admin` as needed.

## Adding Projects / Suppliers
Go to **Admin → Projects** or **Admin → Suppliers**:
- **Projects:** enter a project number (required), name, and location, then Add.
  Toggle Active/Inactive to retire a finished project without deleting its history.
- **Suppliers:** enter a name and Add. (No deactivate toggle yet — delete directly
  in the Supabase table editor if one was added by mistake.)

These feed the autocomplete fields in the Dispatch, Fleet Status, and Delivery
entry forms, so add your real project list and suppliers before handing the app
to controllers.

## Importing Historical Data
**Admin → Import** accepts a CSV with these columns:
```
project_no, project_name, trailer_plate, element_type, element_count, dn_no,
volume_cum, weight_tons, delivery_date, remarks
```
- `trailer_plate` is matched against existing trailer plate numbers — add your
  trailers (via the Supabase table editor; there's no UI for this yet) before
  importing, or the trailer link will be left blank.
- Rows missing both `project_no` and `dn_no` are skipped.
- The page shows a preview of the first 5 parsed rows before you commit, plus a
  per-row error list after import if any rows fail.

## Deploying
1. Push this repo to GitHub.
2. Connect it to Vercel or Netlify (free tier) — auto-deploy on push to `main`.
3. In the hosting provider's dashboard, set these as **deployment secrets**
   (never commit them):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Trigger a deploy and confirm the live URL loads, login works, and a test
   dispatch entry shows up on the dashboard.
5. Update the **Live App** section at the top of this file with the URL.

## Redeploying After Changes
Just `git push` to `main` — Vercel/Netlify auto-builds and redeploys. No manual
steps needed unless you've changed the database schema, in which case also
re-run the relevant parts of `db/init.sql` in the Supabase SQL editor.

## Known Gaps (see README.md for full list)
- Supplier-performance alerts are coded but not wired to live data yet
  (`deliveries` has no `supplier_id` column).
- No in-app password change/reset flow — use the Supabase dashboard.
- No trailer management UI yet — add/edit trailers via the Supabase table editor.
- Playwright e2e test is scaffolded but not run against a live deployment yet —
  do that as part of your first deploy verification.
