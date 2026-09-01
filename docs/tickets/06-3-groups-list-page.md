# 06-3. `/admin/groups` 페이지

Status: Done. Verified end-to-end via `bun run dev` + curl (guard redirect, empty
state, and a group created via the API showing up on reload).
Part of: [06](06-select-quest-group.md)

Built at `src/routes/admin/_authed/groups/index.tsx` (under the `_authed` pathless
layout from [06-1](06-1-admin-session-guard.md), not `admin/groups/index.tsx` as
originally sketched — needs to be a child of `_authed` for the guard to apply).
Each group row does **not** link to `/admin/groups/$groupId` yet — that route didn't
exist when this was built; `Link` to an unregistered route fails TanStack Router's
typecheck, so the link is being added in [06-5](06-5-group-quests-page.md) instead of
guessed here.

Also fixed a latent gap in `getApiClient` (ticket 03): its server branch called
`treaty(app)` with no headers, so an SSR loader hitting an `auth: true` endpoint would
always get treated as logged-out (Eden's in-process call to Elysia isn't a real fetch,
so cookies aren't forwarded automatically the way a browser request would). Now passes
`headers: () => getRequestHeaders()` so server-side loader calls carry the real
request's session cookie. Didn't matter for the earlier public quest endpoints; matters
for every auth-guarded endpoint from here on.

## Not yet in this ticket (see above)

## Why

Admin-facing landing page: see existing groups, create a new one, jump into one.

## Scope

- `src/routes/admin/groups/index.tsx`, under the guarded layout from
  [06-1](06-1-admin-session-guard.md).
- Loader calls `GET /api/groups` via the Eden Treaty client (`src/lib/api-client.ts`).
- List of groups (name, description); each row links to `/admin/groups/$groupId`
  ([06-5](06-5-group-quests-page.md) — the route can exist and 404/placeholder until
  06-5 lands, or build both together if that's less awkward in practice).
- Create form (`SimpleForm`/`SimpleInput`, matching existing conventions in
  `src/components/form/`) posting to `POST /api/groups`, then refetching/appending
  to the list.

## Acceptance criteria

- Logged out → redirected to `/admin/login` (exercises [06-1](06-1-admin-session-guard.md)'s
  guard against real content for the first time).
- Logged in → existing groups render; submitting the create form adds a new group to
  the visible list without a full page reload being required to see it.

## Depends on

[06-1](06-1-admin-session-guard.md), [06-2](06-2-group-repo-and-api.md).
