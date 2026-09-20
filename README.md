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

The same SQL file also creates `public.user_progress`. Run the updated `supabase/schema.sql` again in Supabase SQL Editor to enable per-user cloud progress. Existing tables, policies, and triggers are guarded with `if not exists` / `drop ... if exists` so the migration can be rerun safely.

### Username rules

- 3-32 characters
- lowercase letters, numbers, dot, underscore, and hyphen only
- the browser maps a username to `<username>@english-sylvan.local` internally so Supabase can provide password hashing and sessions without exposing a real email address
- only `signInWithPassword` is used in the frontend

## Cloudflare setup

### Cloudflare Pages with GitHub

Connect the GitHub repository to Cloudflare Pages:

- Framework preset: None (or React if Cloudflare offers it)
- Vite is configured manually through the build command below
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

## Administrator user management

The administrator console is available only to accounts whose `public.profiles.is_admin` is `true`. Run the latest `supabase/schema.sql` (or the shorter `supabase/admin.sql` if the main schema is already installed), then promote the first administrator once in Supabase SQL Editor:

```sql
update public.profiles
set is_admin = true
where username = 'sylvan';
```

The admin console uses the Cloudflare Pages Function at `/api/admin/users`. Add these **server-only** variables to Cloudflare Pages (Production and Preview only if you use the console in previews):

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Legacy Supabase projects may use `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_SECRET_KEY`. Never prefix either secret with `VITE_`, never expose it to the browser, and never commit it to GitHub.

After deployment, sign in as the promoted administrator and open **Admin** in the header. The console can create users, reset passwords, enable/disable accounts, change display names, and grant/revoke administrator status. Deleting a user requires explicit browser confirmation and removes the Auth account, profile, cloud progress, and allowlist entry. The current administrator account cannot delete itself.

## Learning activity history

Run [`supabase/activity.sql`](./supabase/activity.sql) once in Supabase SQL Editor to create `public.user_activity`. The frontend then records login, Unit opens, practice/dialogue starts and completions, and progress updates. Each user can read and insert only their own activity rows through RLS.

Verify activity after using the site:

```sql
select activity_type, unit_id, metadata, created_at
from public.user_activity
order by created_at desc;
```

## Administrator audit log

The admin console includes an **Audit log** tab for account-management actions: creating users, resetting passwords, enabling or disabling accounts, changing administrator access, and deleting users. Run [`supabase/audit.sql`](./supabase/audit.sql) once in Supabase SQL Editor. Audit rows are readable only through the authenticated admin API and retain the actor, target username, action, metadata, and timestamp.

## PWA and mobile support

The production build includes a web app manifest, installable app metadata, a lightweight service worker, offline fallback caching, an install prompt when the browser supports it, and responsive mobile layouts with safe-area support. The PWA is available over HTTPS after Cloudflare Pages deploys the latest commit. On iOS, use Safari's **Share ? Add to Home Screen**; on Chromium browsers, use the **Install app** button or the browser install icon.

## Sync recovery and single-device sessions

The header shows cloud progress status: `Synced`, `Syncing...`, `Offline ? saved locally`, or `Sync issue`. Progress changes are queued in per-user local storage while offline and retried automatically when the browser comes back online.

Run [`supabase/session.sql`](./supabase/session.sql) once in Supabase SQL Editor and deploy the latest code. The session API stores one device lease per account; signing in on another device replaces the lease, and the previous browser detects the replacement within 30 seconds and signs out. The server-only Cloudflare variables `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are required for `/api/session/*`. Offline browsers can keep reading local content, but the single-device check resumes when connectivity returns.

## Content design: spaced review and foldable lessons

The learning page now includes a lightweight forgetting-curve review queue. A completed Unit is scheduled for review, and the learner can rate it as Again, Hard, Good, or Easy; intervals grow as recall becomes more stable. Review state is currently stored per account in browser storage so it remains separate between users on the same device.

Long Unit content is divided into collapsible sections: key expressions, chapter practice, and optional audio. This keeps the mobile page shorter while preserving one-tap access to the full lesson.

## PDF source and pronunciation

The three supplied PDFs are treated as private source material. The site keeps the original 20-Unit learning structure and original lesson arrangements, but does not publish a verbatim scan or a full-book transcription. Public redistribution of the complete book text or a complete audiobook requires the relevant rights.

The pronunciation controls use the browser's available English voices and let the learner choose an `en-US`, `en-GB`, or other installed English voice. These are synthesized voices, not book audio recordings. To add licensed recordings, place the authorized MP3 files under `public/audio/` and wire them to the matching Unit; do not upload third-party or unlicensed book audio.

## Private full-book reader

The original PDFs are kept out of GitHub and out of public Pages assets. To use the complete purchased book privately, run [`supabase/book-storage.sql`](./supabase/book-storage.sql), create the private `book-source` bucket, and upload these exact object names from the three local PDFs: `part-1-50.pdf`, `part-51-100.pdf`, and `part-101-132.pdf`. After upload, signed URLs are generated only for authenticated users from the **Original source** menu.

The browser voice picker selects installed English voices for pronunciation practice. It is synthesized speech, not a recording of the book audio. Only upload MP3 files for which you have the right to use them.
