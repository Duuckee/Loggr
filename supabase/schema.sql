-- Loggr account, group, QSO and leaderboard schema.
-- Run this whole file in Supabase SQL Editor. It upgrades the earlier anonymous-only schema.

do $$ begin
  create type public.loggr_account_type as enum ('public_user', 'scout_user');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.loggr_system_role as enum ('user', 'local_admin', 'leaderboard_admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.loggr_group_role as enum ('scout', 'local_admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9][a-z0-9_.-]{1,22}[a-z0-9]$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  callsign text,
  account_type public.loggr_account_type not null default 'public_user',
  system_role public.loggr_system_role not null default 'user',
  show_on_leaderboard boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{8}$'),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.group_memberships (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  membership_role public.loggr_group_role not null default 'scout',
  joined_at timestamptz not null default now()
);

create index if not exists group_memberships_group_id_idx on public.group_memberships(group_id);

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

create index if not exists sessions_owner_id_idx on public.sessions(owner_id);
create index if not exists contacts_session_id_idx on public.contacts(session_id);
create index if not exists contacts_contacted_at_idx on public.contacts(contacted_at);

-- Create a safe public profile when Supabase Auth creates a username account.
create or replace function public.handle_new_loggr_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  requested_name text;
begin
  requested_username := lower(trim(new.raw_user_meta_data ->> 'username'));
  if requested_username is null or requested_username = '' then
    return new;
  end if;
  requested_name := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), requested_username), 40);
  insert into public.profiles (id, username, display_name)
  values (new.id, requested_username, requested_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_loggr on auth.users;
create trigger on_auth_user_created_loggr
  after insert on auth.users
  for each row execute procedure public.handle_new_loggr_user();

-- Keep profile timestamps accurate without trusting the browser.
create or replace function public.touch_loggr_profile()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute procedure public.touch_loggr_profile();

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.sessions enable row level security;
alter table public.contacts enable row level security;

drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users update own public profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "users update own public profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "members read their group" on public.groups;
create policy "members read their group" on public.groups
  for select to authenticated using (exists (
    select 1 from public.group_memberships membership
    where membership.group_id = groups.id and membership.profile_id = (select auth.uid())
  ));

drop policy if exists "users read own membership" on public.group_memberships;
create policy "users read own membership" on public.group_memberships
  for select to authenticated using (profile_id = (select auth.uid()));

drop policy if exists "owners manage sessions" on public.sessions;
create policy "owners manage sessions" on public.sessions
  for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

drop policy if exists "owners read contacts" on public.contacts;
drop policy if exists "owners insert contacts" on public.contacts;
drop policy if exists "owners update contacts" on public.contacts;
drop policy if exists "owners delete contacts" on public.contacts;
create policy "owners read contacts" on public.contacts
  for select to authenticated using (exists (select 1 from public.sessions where sessions.id = contacts.session_id and sessions.owner_id = (select auth.uid())));
create policy "owners insert contacts" on public.contacts
  for insert to authenticated with check (exists (select 1 from public.sessions where sessions.id = contacts.session_id and sessions.owner_id = (select auth.uid())));
create policy "owners update contacts" on public.contacts
  for update to authenticated using (exists (select 1 from public.sessions where sessions.id = contacts.session_id and sessions.owner_id = (select auth.uid())));
create policy "owners delete contacts" on public.contacts
  for delete to authenticated using (exists (select 1 from public.sessions where sessions.id = contacts.session_id and sessions.owner_id = (select auth.uid())));

-- The public leaderboard exposes only opted-in handles, group names and totals.
create or replace function public.get_leaderboard(period_filter text default 'all')
returns table (
  rank bigint,
  profile_id uuid,
  username text,
  display_name text,
  account_type public.loggr_account_type,
  group_name text,
  session_count bigint,
  qso_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select
      profile.id as profile_id,
      profile.username,
      profile.display_name,
      profile.account_type,
      user_group.name as group_name,
      count(distinct log_session.id) filter (where contact.id is not null) as session_count,
      count(contact.id) as qso_count
    from public.profiles profile
    left join public.group_memberships membership on membership.profile_id = profile.id
    left join public.groups user_group on user_group.id = membership.group_id
    left join public.sessions log_session on log_session.owner_id = profile.id
    left join public.contacts contact on contact.session_id = log_session.id and (
      period_filter = 'all'
      or (period_filter = 'month' and contact.contacted_at >= date_trunc('month', now()))
      or (period_filter = 'week' and contact.contacted_at >= date_trunc('week', now()))
    )
    where profile.show_on_leaderboard = true
    group by profile.id, profile.username, profile.display_name, profile.account_type, user_group.name
  ), ranked as (
    select row_number() over (order by totals.qso_count desc, totals.username asc) as rank, totals.*
    from totals
    where totals.qso_count > 0
  )
  select ranked.rank, ranked.profile_id, ranked.username, ranked.display_name, ranked.account_type, ranked.group_name, ranked.session_count, ranked.qso_count
  from ranked
  order by ranked.rank
  limit 100;
$$;

create or replace function public.get_my_group()
returns table (group_id uuid, group_name text, join_code text, membership_role public.loggr_group_role)
language sql
stable
security definer
set search_path = ''
as $$
  select user_group.id, user_group.name,
    case when membership.membership_role = 'local_admin' then user_group.join_code else null end,
    membership.membership_role
  from public.group_memberships membership
  join public.groups user_group on user_group.id = membership.group_id
  where membership.profile_id = auth.uid();
$$;

create or replace function public.create_loggr_group(group_name text)
returns table (group_id uuid, created_join_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_group_id uuid;
  new_code text;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if char_length(trim(group_name)) not between 3 and 60 then raise exception 'Use a group name between 3 and 60 characters.'; end if;
  if exists (select 1 from public.group_memberships where profile_id = auth.uid()) then raise exception 'Leave your current group before creating another.'; end if;

  loop
    new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.groups where join_code = new_code);
  end loop;
  insert into public.groups (name, join_code, owner_id) values (trim(group_name), new_code, auth.uid()) returning id into new_group_id;
  insert into public.group_memberships (profile_id, group_id, membership_role) values (auth.uid(), new_group_id, 'local_admin');
  update public.profiles set system_role = case when system_role = 'leaderboard_admin' then system_role else 'local_admin' end where id = auth.uid();
  return query select new_group_id, new_code;
end;
$$;

create or replace function public.join_loggr_group(supplied_code text)
returns table (group_id uuid, group_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_group public.groups%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if exists (select 1 from public.group_memberships where profile_id = auth.uid()) then raise exception 'This account already belongs to a group.'; end if;
  select * into matched_group from public.groups where join_code = upper(trim(supplied_code));
  if matched_group.id is null then raise exception 'Group code not found.'; end if;
  insert into public.group_memberships (profile_id, group_id, membership_role) values (auth.uid(), matched_group.id, 'scout');
  update public.profiles set account_type = 'scout_user' where id = auth.uid();
  return query select matched_group.id, matched_group.name;
end;
$$;

create or replace function public.leave_loggr_group()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.group_memberships where profile_id = auth.uid() and membership_role = 'local_admin') then
    raise exception 'A local admin cannot leave their group while they own it.';
  end if;
  delete from public.group_memberships where profile_id = auth.uid();
  update public.profiles set account_type = 'public_user' where id = auth.uid();
end;
$$;

create or replace function public.get_group_members()
returns table (profile_id uuid, username text, display_name text, system_role public.loggr_system_role, qso_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with admin_group as (
    select membership.group_id
    from public.group_memberships membership
    where membership.profile_id = auth.uid()
      and (membership.membership_role = 'local_admin' or exists (select 1 from public.profiles caller where caller.id = auth.uid() and caller.system_role = 'leaderboard_admin'))
    limit 1
  )
  select profile.id, profile.username, profile.display_name, profile.system_role, count(contact.id)
  from admin_group
  join public.group_memberships membership on membership.group_id = admin_group.group_id
  join public.profiles profile on profile.id = membership.profile_id
  left join public.sessions log_session on log_session.owner_id = profile.id
  left join public.contacts contact on contact.session_id = log_session.id
  group by profile.id, profile.username, profile.display_name, profile.system_role
  order by count(contact.id) desc, profile.username;
$$;

create or replace function public.remove_group_member(member_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_group_id uuid;
begin
  select membership.group_id into admin_group_id
  from public.group_memberships membership
  where membership.profile_id = auth.uid() and membership.membership_role = 'local_admin';
  if admin_group_id is null then raise exception 'Only a local admin can remove linked users.'; end if;
  if member_profile_id = auth.uid() then raise exception 'The group owner cannot remove themselves.'; end if;
  delete from public.group_memberships
    where profile_id = member_profile_id and group_id = admin_group_id and membership_role <> 'local_admin';
  if found then update public.profiles set account_type = 'public_user' where id = member_profile_id; end if;
end;
$$;

-- Explicit Data API grants: tables stay private; approved functions expose safe summaries/actions.
revoke all on table public.profiles, public.groups, public.group_memberships, public.sessions, public.contacts from anon, authenticated;
grant select on table public.profiles, public.groups, public.group_memberships to authenticated;
grant update (display_name, callsign, show_on_leaderboard) on public.profiles to authenticated;
grant select, insert, update, delete on table public.sessions, public.contacts to authenticated;

revoke execute on function public.get_leaderboard(text) from public;
revoke execute on function public.get_my_group() from public;
revoke execute on function public.create_loggr_group(text) from public;
revoke execute on function public.join_loggr_group(text) from public;
revoke execute on function public.leave_loggr_group() from public;
revoke execute on function public.get_group_members() from public;
revoke execute on function public.remove_group_member(uuid) from public;
grant execute on function public.get_leaderboard(text) to anon, authenticated;
grant execute on function public.get_my_group(), public.create_loggr_group(text), public.join_loggr_group(text), public.leave_loggr_group(), public.get_group_members(), public.remove_group_member(uuid) to authenticated;

-- First-time setup in Supabase Dashboard:
-- 1. Authentication > Providers > Email: keep Email enabled and turn OFF "Confirm email".
-- 2. Never expose the service_role key; the browser uses only the publishable/anon key.
-- 3. After creating your own account, grant the protected global role once in SQL Editor:
--    update public.profiles set system_role = 'leaderboard_admin' where username = 'your_username';
