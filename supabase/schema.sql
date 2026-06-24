-- ============================================================
-- Digital Heroes Golf Platform — Database Schema
-- Run this entire file in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
create type user_role as enum ('subscriber', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'subscriber',
  charity_id uuid, -- fk added after charities table exists
  charity_contribution_pct numeric(5,2) not null default 10.00 check (charity_contribution_pct >= 10.00 and charity_contribution_pct <= 100.00),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. SUBSCRIPTIONS
-- ============================================================
create type subscription_plan as enum ('monthly', 'yearly');
create type subscription_status as enum ('active', 'cancelled', 'lapsed', 'incomplete');

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan subscription_plan not null,
  status subscription_status not null default 'incomplete',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user on subscriptions(user_id);
create index idx_subscriptions_status on subscriptions(status);

-- ============================================================
-- 3. CHARITIES
-- ============================================================
create table charities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  category text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table charity_events (
  id uuid primary key default uuid_generate_v4(),
  charity_id uuid not null references charities(id) on delete cascade,
  title text not null,
  description text,
  event_date date,
  created_at timestamptz not null default now()
);

-- now wire the FK on profiles
alter table profiles add constraint fk_profiles_charity
  foreign key (charity_id) references charities(id) on delete set null;

-- ============================================================
-- 4. GOLF SCORES (rolling last 5 per user)
-- ============================================================
create table scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 45),
  played_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, played_on) -- enforces "one score entry per date"
);

create index idx_scores_user on scores(user_id, played_on desc);

-- ============================================================
-- 5. DRAWS
-- ============================================================
create type draw_logic_type as enum ('random', 'algorithmic');
create type draw_status as enum ('draft', 'simulated', 'published');

create table draws (
  id uuid primary key default uuid_generate_v4(),
  draw_month date not null, -- first of month, e.g. 2026-07-01
  logic_type draw_logic_type not null default 'random',
  status draw_status not null default 'draft',
  winning_numbers integer[] not null default '{}', -- the drawn numbers
  total_pool numeric(12,2) not null default 0,
  pool_5match numeric(12,2) not null default 0,
  pool_4match numeric(12,2) not null default 0,
  pool_3match numeric(12,2) not null default 0,
  jackpot_rollover numeric(12,2) not null default 0, -- carried in from previous month
  jackpot_claimed boolean not null default false,
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (draw_month)
);

-- each user's entry into a given month's draw (their numbers derived from scores)
create table draw_entries (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  entry_numbers integer[] not null, -- derived from user's 5 latest scores at draw time
  match_count integer not null default 0, -- computed after draw published
  tier text, -- '5match' | '4match' | '3match' | null
  created_at timestamptz not null default now(),
  unique (draw_id, user_id)
);

create index idx_draw_entries_draw on draw_entries(draw_id);

-- ============================================================
-- 6. WINNERS & PAYOUTS
-- ============================================================
create type payout_status as enum ('pending', 'paid', 'rejected');

create table winners (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  tier text not null, -- '5match' | '4match' | '3match'
  amount numeric(12,2) not null,
  proof_url text, -- uploaded screenshot
  status payout_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_winners_user on winners(user_id);
create index idx_winners_draw on winners(draw_id);

-- ============================================================
-- 7. DONATIONS (independent, non-gameplay-tied)
-- ============================================================
create table donations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  charity_id uuid not null references charities(id),
  amount numeric(12,2) not null,
  stripe_payment_id text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8. updated_at triggers
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

create trigger trg_subscriptions_updated before update on subscriptions
  for each row execute function set_updated_at();

-- ============================================================
-- 9. Auto-create profile row when a new auth user signs up
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 10. Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table scores enable row level security;
alter table charities enable row level security;
alter table charity_events enable row level security;
alter table draws enable row level security;
alter table draw_entries enable row level security;
alter table winners enable row level security;
alter table donations enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- PROFILES: users see/edit their own; admins see/edit all
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or is_admin());
create policy "profiles_update_own_or_admin" on profiles
  for update using (auth.uid() = id or is_admin());

-- SUBSCRIPTIONS: users see their own; admins see/manage all
create policy "subscriptions_select_own_or_admin" on subscriptions
  for select using (auth.uid() = user_id or is_admin());
create policy "subscriptions_insert_own" on subscriptions
  for insert with check (auth.uid() = user_id or is_admin());
create policy "subscriptions_update_own_or_admin" on subscriptions
  for update using (auth.uid() = user_id or is_admin());

-- SCORES: users manage their own; admins manage all
create policy "scores_select_own_or_admin" on scores
  for select using (auth.uid() = user_id or is_admin());
create policy "scores_insert_own" on scores
  for insert with check (auth.uid() = user_id);
create policy "scores_update_own_or_admin" on scores
  for update using (auth.uid() = user_id or is_admin());
create policy "scores_delete_own_or_admin" on scores
  for delete using (auth.uid() = user_id or is_admin());

-- CHARITIES: public read; admin write
create policy "charities_select_all" on charities
  for select using (true);
create policy "charities_admin_write" on charities
  for all using (is_admin()) with check (is_admin());

create policy "charity_events_select_all" on charity_events
  for select using (true);
create policy "charity_events_admin_write" on charity_events
  for all using (is_admin()) with check (is_admin());

-- DRAWS: published draws visible to all; drafts admin-only
create policy "draws_select_published_or_admin" on draws
  for select using (status = 'published' or is_admin());
create policy "draws_admin_write" on draws
  for all using (is_admin()) with check (is_admin());

-- DRAW ENTRIES: users see their own; admin sees all
create policy "draw_entries_select_own_or_admin" on draw_entries
  for select using (auth.uid() = user_id or is_admin());
create policy "draw_entries_admin_write" on draw_entries
  for all using (is_admin()) with check (is_admin());

-- WINNERS: users see their own; admin sees/manages all
create policy "winners_select_own_or_admin" on winners
  for select using (auth.uid() = user_id or is_admin());
create policy "winners_insert_own" on winners
  for insert with check (auth.uid() = user_id or is_admin());
create policy "winners_update_admin" on winners
  for update using (is_admin());

-- DONATIONS: users see their own; admin sees all
create policy "donations_select_own_or_admin" on donations
  for select using (auth.uid() = user_id or is_admin());
create policy "donations_insert_own" on donations
  for insert with check (auth.uid() = user_id or user_id is null);

-- ============================================================
-- 11. Seed: a couple of charities so the directory isn't empty
-- ============================================================
insert into charities (name, slug, description, category, is_featured) values
('Junior Golf Foundation', 'junior-golf-foundation', 'Supporting youth access to golf coaching and equipment in underserved communities.', 'Sports & Youth', true),
('Greenway Conservation Trust', 'greenway-conservation-trust', 'Protecting parkland and green spaces, including golf courses converted to public conservation use.', 'Environment', false),
('Veterans Fairway Fund', 'veterans-fairway-fund', 'Free golf therapy programs for military veterans recovering from injury.', 'Health & Wellbeing', true);

-- ============================================================
-- 12. Storage bucket for winner proof screenshots
-- Run separately if it errors (bucket may need creating via dashboard UI instead)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('winner-proofs', 'winner-proofs', true)
on conflict (id) do nothing;

create policy "winner_proofs_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'winner-proofs' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "winner_proofs_read_all" on storage.objects
  for select using (bucket_id = 'winner-proofs');

-- ============================================================
-- 13. Seed: make the first signed-up user an admin manually later via:
-- update profiles set role = 'admin' where id = '<your-user-uuid>';
-- ============================================================
