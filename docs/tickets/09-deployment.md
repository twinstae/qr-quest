# 09. 배포되서 링크로 진입할 수 있다

Status: Not started. Everything code-side is ready and verified (`bun run build`
succeeds; Nitro auto-detects Vercel with **zero config** — confirmed via Nitro's
bundled docs, no `nitro.config.ts` changes needed). What's left is account/credential
work that has to be done by a human with real Supabase/Vercel accounts — not
something to automate here.
PLAN.md item: 9

## Why

The whole point is real-world QR cards linking to a publicly reachable app.

## Step-by-step guide

### 1. Create the Supabase project

1. Create a new project at [supabase.com](https://supabase.com) (any region close to
   your users; note it down — it affects `SUPABASE_S3_REGION` below).
2. **Database**: Project Settings → Database → copy the connection string
   (**use the "Transaction" pooler connection string**, not the direct connection —
   Vercel functions are short-lived/parallel and the direct connection has a low
   connection limit that pooling avoids). This is `DATABASE_URL`.
3. **Storage**: Storage → Create a new bucket (e.g. `quest-images`), set it **Public**
   (quest/reward images need to be publicly viewable without auth).
4. **Storage S3 credentials**: Project Settings → Storage → S3 Connection (or
   "Access Keys" under Storage settings) → create new access key. You'll get:
   - Access Key ID → `SUPABASE_S3_ACCESS_KEY_ID`
   - Secret Access Key → `SUPABASE_S3_SECRET_ACCESS_KEY`
   - Endpoint (looks like `https://<project_ref>.storage.supabase.co/storage/v1/s3`)
     → `SUPABASE_S3_ENDPOINT`
   - Region shown alongside it → `SUPABASE_S3_REGION`
5. `SUPABASE_STORAGE_BUCKET` = the bucket name from step 3 (e.g. `quest-images`).
6. `SUPABASE_STORAGE_PUBLIC_URL_BASE` = `https://<project_ref>.supabase.co/storage/v1/object/public`
   (find `<project_ref>` in your project URL/settings — this is **not** the S3
   endpoint, it's Supabase's own public object URL format).

### 2. Generate a better-auth secret

Run locally: `openssl rand -base64 32` → this is `BETTER_AUTH_SECRET`. Set it once
and never change it after real users exist — changing it invalidates every session
and (depending on config) can break existing password hashes tied to it.

### 3. Connect the repo to Vercel

1. [vercel.com/new](https://vercel.com/new) → import this GitHub repo.
2. Framework preset: Vercel should auto-detect Vite/TanStack Start — no changes
   needed to build command/output directory.
3. **Before the first deploy**, add these environment variables (Project Settings →
   Environment Variables, or during the import flow):

   | Variable                           | Value                                                                                                                                            |
   | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
   | `DATABASE_URL`                     | Supabase pooled connection string (step 1.2)                                                                                                     |
   | `SUPABASE_S3_ENDPOINT`             | from step 1.4                                                                                                                                    |
   | `SUPABASE_S3_REGION`               | from step 1.4                                                                                                                                    |
   | `SUPABASE_S3_ACCESS_KEY_ID`        | from step 1.4                                                                                                                                    |
   | `SUPABASE_S3_SECRET_ACCESS_KEY`    | from step 1.4                                                                                                                                    |
   | `SUPABASE_STORAGE_BUCKET`          | from step 1.5                                                                                                                                    |
   | `SUPABASE_STORAGE_PUBLIC_URL_BASE` | from step 1.6                                                                                                                                    |
   | `BETTER_AUTH_SECRET`               | from step 2                                                                                                                                      |
   | `BETTER_AUTH_URL`                  | your production URL once known (e.g. `https://qr-quest.vercel.app`) — can be added/fixed _after_ the first deploy once Vercel assigns the domain |

   `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` are **not** Vercel env vars — they're
   only used locally, once, to run the seed script against production (step 5).
   Don't store admin credentials in Vercel's env var list.

4. Deploy.

### 4. Run migrations against production

From your local machine (not on Vercel — this is a one-off script run):

```bash
DATABASE_URL="<the same pooled connection string from step 1.2>" bun run db:migrate
```

### 5. Seed the production admin account

```bash
ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="<a real password, not password1234>" \
DATABASE_URL="<same connection string>" bun run seed:admin
```

Do this **once**. Re-running `seed:admin` with a _different_ email creates a second
admin; re-running with the _same_ email will fail (better-auth rejects duplicate
emails) — that's expected, not a bug.

### 6. Verify (matches the ticket's acceptance criteria)

- [ ] Visit the production URL — the quest-solving page and `/admin/login` both load.
- [ ] Log into `/admin/login` with the seeded admin credentials.
- [ ] Create a group and a quest through the real admin UI (this exercises the real
      Supabase Storage upload path for the first time — nothing in this session
      verified that part against live infrastructure, only against the fake adapter).
- [ ] Download the quest's QR code, scan it with an actual phone camera (not
      localhost) — confirm it opens the quest and the correct answer shows the reward.
- [ ] Visit `/admin/*` in an incognito window (no session) — confirm it redirects to
      `/admin/login`.

## Explicitly deferred

- Connection pooling tuning beyond using Supabase's pooler connection string —
  revisit only if you actually hit connection-limit errors under load (not expected
  at event-scale traffic).
- Custom domain — use the default Vercel domain unless you want to set one up
  yourself; not required for QR cards to work.

## Depends on

All other tickets — this is the last one. All 8 others are done and verified as of
this ticket being written.
