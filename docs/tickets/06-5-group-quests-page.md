# 06-5. `/admin/groups/$groupId` 페이지

Status: Done. Verified end-to-end via `bun run dev` + curl: guard redirect, empty
state, and (after seeding a quest directly through the repo, since no create-quest
UI exists yet) a quest actually rendering in the list.
Part of: [06](06-select-quest-group.md)

Built at `src/routes/admin/_authed/groups/$groupId.tsx` (matches the `_authed`
nesting from 06-1/06-3, not the originally-sketched `admin/groups/$groupId.tsx`).
`src/routes/admin/_authed/groups/index.tsx` now links each group row to this route
(`Link to="/admin/groups/$groupId"`) — deferred from 06-3 since the route didn't
exist yet at that point.

A disabled "Quest 만들기" button and a code comment mark where 04/05/01's actions
attach; no links to unbuilt routes.

## Why

Where the admin actually sees a group's quests, and (later) creates/edits them and
downloads QR codes. This ticket only builds the list view — the actions get wired
in by [04](04-create-quest.md), [05](05-update-quest.md), [01](01-qr-code-generation.md).

## Scope

- `src/routes/admin/groups/$groupId.tsx`, under the guarded layout.
- Loader calls `GET /api/groups/:id/quests` via Eden Treaty.
- Renders the group's quests (content, maybe a thumbnail); empty state if none yet.
- Leave visible placeholders (disabled buttons or plain text, admin's call when
  building) for "create quest", "edit", "download QR" — don't link to routes that
  don't exist yet.

## Acceptance criteria

- Logged out → redirected to `/admin/login`.
- A group with no quests shows an empty state, not an error.
- A group with quests lists them.

## Depends on

[06-1](06-1-admin-session-guard.md), [06-4](06-4-group-quests-api.md).
