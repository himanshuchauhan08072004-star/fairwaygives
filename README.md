# FairwayGives — Golf, Charity & Monthly Draw Platform

Built for Digital Heroes' full-stack trainee selection challenge, based on the provided PRD.

## Tech stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (Postgres + Row Level Security + Supabase Auth + Storage)
- **Payments:** Stripe (subscriptions, webhooks)
- **Deployment:** Vercel

## Setup instructions

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Supabase project
- Go to supabase.com → New Project
- Once provisioned, open **SQL Editor** and run the entire contents of `supabase/schema.sql`
- This creates all tables, RLS policies, triggers, the storage bucket, and seeds 3 sample charities

### 3. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Project Settings → API
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from Stripe Dashboard (test mode)
- `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY` — create two recurring Prices in Stripe Dashboard → Products
- `STRIPE_WEBHOOK_SECRET` — from `stripe listen` (local) or your deployed webhook endpoint (production)

### 4. Run locally
```bash
npm run dev
```

### 5. Make your first admin user
Sign up normally through the app, then in Supabase SQL Editor:
```sql
update profiles set role = 'admin' where id = '<your-user-uuid-from-auth.users>';
```

### 6. Deploy
- Push to GitHub
- Import the repo into a new Vercel project
- Add all environment variables in Vercel → Project Settings → Environment Variables
- Set the Stripe webhook endpoint to `https://your-domain.vercel.app/api/stripe/webhook` and copy the new signing secret into `STRIPE_WEBHOOK_SECRET`

## Architecture notes

- **Auth & access control:** Supabase Auth (JWT-based) + `middleware.ts` guards `/dashboard` and `/admin` routes, with an additional role check for `/admin`. RLS policies on every table provide defense-in-depth at the database layer — even if an API route had a bug, a non-admin still cannot read another user's data.
- **Rolling 5-score logic:** Enforced in `src/lib/scores.ts` at the application layer (insert, then prune oldest beyond 5) rather than a DB trigger, for easier debugging/demoing. The `unique(user_id, played_on)` DB constraint independently enforces "one score per date."
- **Draw engine:** `src/lib/draws.ts`. Supports `random` and `algorithmic` (frequency-weighted) generation. Simulation and publish both call the same `runDraw()` function — simulation just doesn't persist results, satisfying the PRD's "simulation / pre-analysis mode before official publish" requirement.

## Documented assumptions (PRD ambiguities)

The PRD leaves a few mechanics under-specified. Rather than guess silently, these are the decisions made and why:

1. **What numbers are drawn / matched?**
   The PRD describes "5/4/3-Number Match" draws but never states what the numbers *are*. Assumption: each user's 5 most-recent logged scores (already required to be 1–45, matching a lotto-style range) become their personal draw entry for the month. A user needs 5 scores logged to be entered. This reuses existing data rather than introducing a separate unexplained "pick your numbers" flow.

2. **"Algorithmic" draw weighting direction.**
   The PRD says weighted by "most/least frequent user scores" without picking one. Implemented: weighted toward **most** frequent scores across that month's entrants (more explainable to users: "the numbers people are actually shooting"). The "least frequent" variant is a one-line change in `generateWinningNumbers()` if the opposite behavior is preferred.

3. **Prize pool funding amount.**
   The PRD specifies the 40/35/25 split of "a fixed portion of each subscription" but not the absolute amount. Implemented as an admin-configurable "$ per active subscriber" input when creating a draw, so the business can tune it without a code change.

4. **Charity contribution timing.**
   Modeled as a profile-level percentage (`charity_contribution_pct`), applied at subscription-payment time, adjustable by the user at any time (effective from their next billing cycle in a production build — this MVP applies it going forward immediately for demo simplicity).

## What's intentionally out of scope for this submission

Given the 2-day window, these were deprioritized and are documented here rather than silently missing:
- Multi-country/localization scaffolding (schema is extensible, no UI built)
- Corporate/team accounts
- Email notifications (would use Supabase + Resend/SendGrid in a follow-up)
- Charity search/filter UI (directory exists, filtering omitted)
- Full draw history pagination beyond 12 months

## Testing checklist (per PRD section 16)

- [x] Signup & login
- [x] Subscription flow (Stripe Checkout, monthly/yearly)
- [x] Score entry — 5-score rolling logic, one-per-date enforcement
- [x] Draw system — create, simulate, publish
- [x] Charity selection & contribution percentage
- [x] Winner verification — proof upload, admin approve/reject, pending→paid
- [x] User dashboard — all PRD-required modules present
- [x] Admin dashboard — users, draws, charities, winners, reports
- [x] Responsive layout (mobile-first Tailwind)
