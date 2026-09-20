-- LingoDesk Supabase setup
-- Run this in Supabase SQL Editor before provisioning the first account.
-- The browser never receives a service-role key.

create table if not exists public.allowed_usernames (
  username text primary key,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint allowed_usernames_format check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$')
);

alter table public.allowed_usernames enable row level security;
-- There are intentionally no anon/authenticated SELECT policies.
-- Only the provisioning script/service role may manage this table.

create or replace function public.enforce_allowed_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
begin
  if new.email is null then
    raise exception 'A username account is required';
  end if;

  requested_username := lower(split_part(new.email, '@', 1));
  if lower(split_part(new.email, '@', 2)) <> 'english-sylvan.local'
     or not exists (
       select 1
       from public.allowed_usernames
       where username = requested_username
         and is_active = true
     ) then
    raise exception 'Username is not registered';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_allowed_username on auth.users;
create trigger enforce_allowed_username
  before insert on auth.users
  for each row execute function public.enforce_allowed_username();

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique references public.allowed_usernames(username),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists is_admin boolean not null default false;

alter table public.profiles enable row level security;
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  requested_display_name text;
begin
  requested_username := lower(split_part(new.email, '@', 1));
  requested_display_name := nullif(new.raw_user_meta_data ->> 'display_name', '');

  insert into public.profiles (id, username, display_name)
  values (new.id, requested_username, requested_display_name)
  on conflict (id) do update
    set username = excluded.username,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists sync_profile_from_auth on auth.users;
create trigger sync_profile_from_auth
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.sync_profile_from_auth();

-- Example allowlist entry. Replace it with real usernames before creating users.
-- insert into public.allowed_usernames (username, display_name)
-- values ('sylvan001', 'Sylvan');

-- Per-user cloud learning progress. RLS prevents users from reading or writing
-- another user's rows. The frontend still keeps a local cache for offline use.
create table if not exists public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id integer not null check (unit_id > 0),
  progress integer not null default 0 check (progress between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, unit_id)
);

alter table public.user_progress enable row level security;
drop policy if exists "Users can read their own progress" on public.user_progress;
create policy "Users can read their own progress"
  on public.user_progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress"
  on public.user_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress"
  on public.user_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_progress_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_progress_updated_at on public.user_progress;
create trigger set_progress_updated_at
  before update on public.user_progress
  for each row execute function public.set_progress_updated_at();

-- After creating the first account, promote it once from SQL Editor.
-- Replace sylvan with your chosen administrator username.
-- update public.profiles
-- set is_admin = true
-- where username = 'sylvan';

-- LingoDesk learning activity history
-- Run this once in Supabase SQL Editor after the main schema.

create table if not exists public.user_activity (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id integer check (unit_id is null or unit_id > 0),
  activity_type text not null check (
    activity_type in (
      'login',
      'unit_opened',
      'practice_started',
      'practice_completed',
      'dialogue_started',
      'dialogue_completed',
      'progress_updated'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_activity enable row level security;

drop policy if exists "Users can read their own activity" on public.user_activity;
create policy "Users can read their own activity"
  on public.user_activity for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own activity" on public.user_activity;
create policy "Users can insert their own activity"
  on public.user_activity for insert
  to authenticated
  with check (auth.uid() = user_id);

create index if not exists user_activity_user_created_idx
  on public.user_activity(user_id, created_at desc);

create index if not exists user_activity_unit_idx
  on public.user_activity(unit_id);
