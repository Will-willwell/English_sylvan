# LingoDesk - Business Speaking Lab

This repository contains the current LingoDesk learning website rebuilt from the GitHub project: 20 business-English units, shadowing practice, browser speech recognition, role-play dialogues, and audio-source notes. Authentication is intentionally username-only: accounts are created by the administrator, and unregistered users cannot sign in or self-register.

## Stack

- React + TypeScript + Vite
- Supabase Auth + PostgreSQL for sessions and the username allowlist
- Cloudflare Workers Static Assets (or Cloudflare Pages)
- GitHub as the source repository and deployment trigger

## Local development

```powershell
npm.cmd install
Copy-Item .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env
npm.cmd run dev
```

Without Supabase variables, the site can still be previewed locally. With Supabase configured, the first visit opens the sign-in screen.

## Supabase setup

1. Create a new Supabase project.
2. Open SQL Editor and run [`supabase/schema.sql`](./supabase/schema.sql). It creates the allowlist, profiles, and an `auth.users` trigger that rejects unregistered usernames.
3. Copy the Project URL and Publishable key from Settings -> API into `.env`:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. Provision accounts with the admin-only script. Never put the service-role key in the frontend or any `VITE_*` variable:

```powershell
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SECRET_KEY="sb_secret_your_key"
npm.cmd run provision:user -- --username sylvan001 --password "a password with 6+ characters" --display-name "Sylvan"
```

The script inserts the username into the allowlist and creates a confirmed Supabase Auth user. The browser has no sign-up flow. A direct sign-up request with an unregistered username is rejected by the database trigger once the SQL schema is installed.

### Username rules

- 3-32 characters
- lowercase letters, numbers, dot, underscore, and hyphen only
- the browser maps a username to `<username>@english-sylvan.local` internally so Supabase can provide password hashing and sessions without exposing a real email address
- only `signInWithPassword` is used in the frontend

## Cloudflare setup

### Cloudflare Pages with GitHub

Connect the GitHub repository to Cloudflare Pages:

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: empty
- Production and Preview variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or the legacy `VITE_SUPABASE_ANON_KEY`)

Do not expose `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) as a `VITE_*` variable. It is only for `scripts/provision-user.mjs`.

### Cloudflare Workers Static Assets

The repository already includes [`wrangler.jsonc`](./wrangler.jsonc):

```powershell
npm.cmd run deploy:worker
```

The command builds `dist` and deploys it with SPA fallback. If deployment is run from GitHub Actions, inject the two public `VITE_*` build variables through Actions variables/secrets before `npm run build`.

## Verification

```powershell
npm.cmd run build
node --check scripts/provision-user.mjs
```

Before production, test one allowlisted username, a wrong password, and an unregistered username. Also verify session persistence after refresh and that Sign out opens the required login screen again.

## Content and copyright

The course index, expressions, exercises, and role-play scripts are original learning arrangements. The audio panel provides official or third-party links as references and does not redistribute copyrighted audio files.
