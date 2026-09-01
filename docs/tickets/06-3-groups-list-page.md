# 06-3. `/admin/groups` 페이지

Status: Not started
Part of: [06](06-select-quest-group.md)

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
