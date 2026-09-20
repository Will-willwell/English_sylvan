-- Run this after the main schema.sql to enable the first administrator.
-- Replace sylvan with the username that should manage accounts.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

update public.profiles
set is_admin = true
where username = 'sylvan';

select username, is_admin
from public.profiles
where username = 'sylvan';
