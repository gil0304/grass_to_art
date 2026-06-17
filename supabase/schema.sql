-- grass to art — database schema
-- Run in the Supabase SQL editor (or `supabase db` migrations).
-- RLS is enabled with WITH CHECK on writes so users only ever touch their own rows.

-- ---------------------------------------------------------------------------
-- Contribution snapshots
-- Persisted right after OAuth (server-side) so the editor survives reloads and
-- the loss of provider_token. One row per (user, login, window).
-- ---------------------------------------------------------------------------
create table if not exists public.contribution_snapshots (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  github_login text not null,
  from_date    timestamptz not null,
  to_date      timestamptz not null,
  total        integer not null,
  data         jsonb not null,
  fetched_at   timestamptz not null default now(),
  unique (user_id, github_login, from_date, to_date)
);

create index if not exists contribution_snapshots_user_idx
  on public.contribution_snapshots (user_id, fetched_at desc);

alter table public.contribution_snapshots enable row level security;

create policy "snapshots: owner select" on public.contribution_snapshots
  for select using (user_id = auth.uid());
create policy "snapshots: owner insert" on public.contribution_snapshots
  for insert with check (user_id = auth.uid());
create policy "snapshots: owner update" on public.contribution_snapshots
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "snapshots: owner delete" on public.contribution_snapshots
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Saved posters (optional "my works" feature). `config` stores the full editor
-- state including `seed`, so a saved poster re-renders identically.
-- Uses from_date/to_date (not a single `year`) to also represent rolling windows.
-- ---------------------------------------------------------------------------
create table if not exists public.posters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  github_login text not null,
  from_date    timestamptz not null,
  to_date      timestamptz not null,
  style        text not null check (style in ('city', 'organic', 'stars', 'geometric')),
  config       jsonb not null,
  snapshot_id  uuid references public.contribution_snapshots (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists posters_user_idx on public.posters (user_id, created_at desc);

alter table public.posters enable row level security;

create policy "posters: owner select" on public.posters
  for select using (user_id = auth.uid());
create policy "posters: owner insert" on public.posters
  for insert with check (user_id = auth.uid());
create policy "posters: owner update" on public.posters
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "posters: owner delete" on public.posters
  for delete using (user_id = auth.uid());
