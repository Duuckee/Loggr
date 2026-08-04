create table if not exists public.sessions (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text,
  home_park text not null,
  home_park_name text,
  home_lat double precision not null,
  home_lon double precision not null,
  operators jsonb not null default '[]'::jsonb,
  experience_mode text not null check (experience_mode in ('guided', 'normal')),
  operating_role text not null check (operating_role in ('activator', 'hunter')),
  started_at timestamptz not null,
  ended_at timestamptz,
  status text not null check (status in ('active', 'ended')),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  callsign text not null,
  band text not null,
  frequency numeric,
  mode text not null,
  rst_sent text not null,
  rst_received text not null,
  park text,
  latitude double precision,
  longitude double precision,
  is_p2p boolean not null default false,
  operator_alias text,
  notes text,
  contacted_at timestamptz not null
);

alter table public.sessions enable row level security;
alter table public.contacts enable row level security;

create policy "owners manage sessions" on public.sessions
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owners read contacts" on public.contacts
  for select using (exists (select 1 from public.sessions where sessions.id = contacts.session_id and sessions.owner_id = auth.uid()));

create policy "owners insert contacts" on public.contacts
  for insert with check (exists (select 1 from public.sessions where sessions.id = contacts.session_id and sessions.owner_id = auth.uid()));

create policy "owners update contacts" on public.contacts
  for update using (exists (select 1 from public.sessions where sessions.id = contacts.session_id and sessions.owner_id = auth.uid()));

create policy "owners delete contacts" on public.contacts
  for delete using (exists (select 1 from public.sessions where sessions.id = contacts.session_id and sessions.owner_id = auth.uid()));

-- Enable anonymous sign-ins in Supabase Auth. Each browser receives a private
-- auth identity; no youth name, email, or other identifying detail is required.
