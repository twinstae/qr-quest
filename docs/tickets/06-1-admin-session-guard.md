# 06-1. `/admin` 세션 가드

Status: Not started
Part of: [06](06-select-quest-group.md)

## Why

Deferred from [07](07-admin-login.md): there was no protected content to verify a
guard against. Now that this ticket is about to add real protected admin pages, build
the guard first so 06-3/06-5 can just sit inside it.

## Scope

- `src/routes/admin/route.tsx` — pathless-ish layout wrapping everything under
  `/admin` **except** `/admin/login`. `beforeLoad` calls `authClient.getSession()`
  (`src/lib/auth-client.ts`) and `throw redirect({ to: "/admin/login" })` if there's
  no session.
  - TanStack Router convention to exclude `/admin/login`: keep `login.tsx` as a
    sibling file outside the guarded layout's route id, e.g. layout at
    `src/routes/admin/route.tsx` matching `/admin` and `/admin/*`, with `login.tsx`
    registered so it doesn't inherit that `beforeLoad` — verify against the actual
    generated `routeTree.gen.ts` once written; TanStack Start's exact layout/pathless
    conventions should be checked against installed version, not assumed.
- Elysia side: add the `auth: true` macro (from the
  [Elysia + better-auth integration guide](https://elysiajs.com/integrations/better-auth))
  to `src/api/elysia/app.ts` so [06-2](06-2-group-repo-and-api.md) and
  [06-4](06-4-group-quests-api.md) can guard their routes with `{ auth: true }` instead
  of hand-rolling a session check per route.

## Acceptance criteria

- An Elysia route marked `{ auth: true }` returns 401 without a session cookie, 200
  with a valid one (test via `app.handle()` + a real signed-in session from
  `ctx.auth`, not a mocked check).
- Visiting any route under the `/admin` layout while logged out redirects to
  `/admin/login`; `/admin/login` itself stays reachable while logged out.

## Depends on

[07](07-admin-login.md).
