-- Single-device session lease
-- One active browser session per account. A new claim revokes the previous browser lease.

create table if not exists public.user_device_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_id text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.user_device_sessions enable row level security;
-- No browser policies: the server-side session API owns this table.

create index if not exists user_device_sessions_last_seen_idx
  on public.user_device_sessions(last_seen_at desc);
