# 07. admin 은 passkey로 로그인할 수 있다

Status: Email+password v1 done and verified end-to-end via `bun run dev` + curl
(sign-up, sign-in, session cookie, get-session). Passkey itself (the PLAN.md item's
literal title) is still not started — left unchecked in PLAN.md until that lands.
PLAN.md item: 7

## What was actually built (v1 scope note)

- `src/api/auth.ts` — `createAuth(database)` factory over better-auth, generic over
  the adapter (mirrors the `createDrizzleXRepo`/`createFakeXRepo` pattern: real usage
  passes `drizzleAdapter`, tests pass `memoryAdapter` — no hand-rolled fake auth, since
  password hashing/session correctness is exactly what you don't want to reimplement).
- Mounted at `/api/auth/*` via Elysia's `.mount(ctx.auth.handler)` — **note**: `.mount()`
  forwards the full original request path, it does not strip the enclosing `prefix`.
  better-auth's `basePath` must therefore be `"/api/auth"` (matching the real path), not
  `"/auth"` — got this wrong on the first pass, caught by an end-to-end curl test.
- `src/persistence/drizzle/authSchema.ts` — better-auth's `user`/`session`/`account`/
  `verification` tables. **Not fully CLI-generated as originally planned**: the
  published `@better-auth/cli` (tops out around 1.5.0-beta) is behind our installed
  `better-auth@1.7.2` core, and generated a schema missing the `account.issuer` column
  (+ its unique `issuer+accountId` index) that 1.7.x's core requires. Generated the
  bulk via CLI, then hand-patched against `@better-auth/core`'s `get-tables.mjs` (the
  actual runtime source of truth) to close the gap. Re-verify against that file if
  bumping `better-auth` versions.
- `src/api/seed-admin.ts` (`bun run seed:admin`, needs `ADMIN_EMAIL`/`ADMIN_PASSWORD`
  env vars) — calls `auth.api.signUpEmail` directly, not a hand-rolled DB insert.
- `src/lib/auth-client.ts` (`better-auth/react`'s `createAuthClient`) + `/admin/login`
  page using it.
- **Deferred to [06](06-select-quest-group.md)**: the `/admin` layout route's
  `beforeLoad` session guard. There's no protected admin content yet to verify a guard
  against, so building it now would be unverifiable. When 06 adds `/admin/groups`,
  wrap it in a route that checks `authClient.getSession()` and redirects to
  `/admin/login` if absent.

## Why

Admin pages ([04](04-create-quest.md), [05](05-update-quest.md),
[06](06-select-quest-group.md)) need to be behind a login. There's no registration
page, ever — the single admin account is created once via a seed script.

## v1 scope: email + password only

Passkey needs a device credential to be registered against an _already authenticated_
session — a chicken-and-egg problem if passkey were the only login method. Rather
than solve that now, v1 ships **better-auth's `emailAndPassword` plugin only**. The
passkey plugin ([better-auth passkey docs](https://better-auth.com/docs/plugins/passkey))
is a deliberate follow-up, not part of this ticket's acceptance criteria — don't block
on it.

## Scope

- Install and configure `better-auth` with the `emailAndPassword` plugin, mounted
  inside the single Elysia app at `/api/auth/*` (better-auth exposes a standard fetch
  handler Elysia can wrap directly).
- Run better-auth's schema generation to add its tables (`user`, `session`, `account`,
  `verification`) to the Drizzle migration set from [08](08-database-connection.md).
- `bun run seed:admin` script: reads admin email/password from env vars or CLI args
  at run time (never committed), calls better-auth's server-side signup API directly
  (not a hand-rolled DB insert — must go through better-auth so the password hash
  matches what login expects). Produces exactly one `user` row.
- A `/admin/login` route with an email+password form (reuse `SimpleForm`/
  `SimpleInput`).
- `/admin` layout route (`beforeLoad` or equivalent) checks for a valid better-auth
  session; redirects to `/admin/login` if absent. Applies to
  [04](04-create-quest.md), [05](05-update-quest.md), [06](06-select-quest-group.md),
  and their corresponding API routes.

## Explicitly deferred

- Passkey plugin / WebAuthn registration and login flow.
- Any admin-management UI (adding a second admin) — re-run the seed script manually
  if a second admin is ever needed.

## Acceptance criteria

- Running the seed script against a fresh database creates exactly one working admin
  login.
- Visiting any `/admin/*` route while logged out redirects to `/admin/login`.
- Logging in with the seeded credentials grants access to the admin pages; logging in
  with wrong credentials does not.
- No registration route exists anywhere in the app.

## Depends on

[08](08-database-connection.md).
