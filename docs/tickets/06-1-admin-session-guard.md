# 06-1. `/admin` 세션 가드

Status: Done. Verified end-to-end via `bun run dev` + curl (logged out → redirect to
`/admin/login`; logged in → `/admin` renders, no redirect).
Part of: [06](06-select-quest-group.md)

## What was actually built

- `src/api/elysia/authGuard.ts` — `createAuthGuard(ctx)`, an Elysia plugin exporting
  the `auth` macro from the
  [Elysia + better-auth integration guide](https://elysiajs.com/integrations/better-auth):
  `{ auth: true }` on a route resolves `ctx.auth.api.getSession({ headers })` and
  returns 401 if absent. `.use()`'d into `src/api/elysia/app.ts` — no routes use it
  yet, [06-2](06-2-group-repo-and-api.md)/[06-4](06-4-group-quests-api.md) are the
  first consumers.
- `src/routes/admin/_authed.tsx` — a **pathless layout route** (TanStack Router's
  `_` prefix convention: contributes no URL segment, just wraps children).
  `beforeLoad` redirects to `/admin/login` if there's no session. Registers at
  `fullPath: "/admin"`, so visiting bare `/admin` already exercises it.
  `src/routes/admin/login.tsx` stays a sibling _outside_ `_authed`, so it's never
  wrapped by its own guard.

## Bug caught during end-to-end verification (not visible in unit tests)

`authClient.getSession()` (the `better-auth/react` client) does a relative
`fetch("/api/auth/get-session")`. That's fine in the browser but throws
`Failed to parse URL from /api/auth/get-session` when `beforeLoad` runs **server-side**
during SSR — Bun's server-side `fetch` has no implicit origin to resolve a relative
URL against. Same class of problem `getApiClient` (ticket 03) already solved with
`createIsomorphicFn`.

Fix: `src/lib/auth-client.ts` now exports `getCurrentSession`, isomorphic:

- `.server()`: calls `auth.api.getSession({ headers: getRequest().headers })` directly
  (no HTTP round-trip — `getRequest`/`getRequest().headers` from
  `@tanstack/react-start/server`), using the real incoming request's cookies.
- `.client()`: `authClient.getSession()` (relative fetch works fine in-browser).

`src/api/elysia/index.ts` now also exports the raw `auth` singleton (previously only
`app`), since the server branch needs direct access to it.

**Lesson for future routes**: any session/data read needed in a `beforeLoad`/loader
that runs isomorphically must use this pattern (or `getApiClient`'s), never a bare
client-only fetch call — unit tests (`app.handle()`) won't catch this, only an actual
`bun run dev` + curl/SSR check will, since vitest's browser project never exercises
server-side loader execution the way real SSR does.

## Acceptance criteria — verified

- Elysia route marked `{ auth: true }`: 401 without a session cookie, 200 with a real
  signed-in session (`authGuard.test.ts`, via `ctx.auth` directly — not mocked).
- `curl http://localhost:3000/admin` while logged out → redirects to `/admin/login`,
  200, no error page.
- `curl http://localhost:3000/admin` with a valid session cookie → 200, stays at
  `/admin`, no redirect, no error page.

## Depends on

[07](07-admin-login.md).
