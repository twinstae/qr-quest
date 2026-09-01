# 06-2. QuestGroupRepo.list + POST/GET /api/groups

Status: Not started
Part of: [06](06-select-quest-group.md)

## Why

`QuestGroupRepo` currently only has `create` (added in ticket 03 purely to seed
fixtures for `DrizzleQuestRepo` tests). The admin group-list page needs to actually
list groups, and a real HTTP endpoint to create/list them through.

## Scope

- `QuestGroupRepo.list(): Promise<QuestGroup[]>` — add to
  `src/persistence/types.ts`, implement in `FakeQuestGroupRepo` and
  `DrizzleQuestGroupRepo`.
- `src/application/questGroupService.ts` — `listGroups(ctx)`, `createGroup(ctx, input)`.
- `AppContext.repo.questGroup: QuestGroupRepo` — add to `src/api/context.ts` (not
  wired in yet elsewhere; this is its first real consumer).
- Elysia routes on the app from [06-1](06-1-admin-session-guard.md):
  - `GET /api/groups` — `{ auth: true }`, returns `QuestGroup[]`.
  - `POST /api/groups` — `{ auth: true }`, body `{ name, description? }`.

## Acceptance criteria

- Repo test: `create` then `list` returns it (through the interface, per the
  interface-only testing convention established in ticket 03 — no raw `db.insert`).
- App test: both endpoints return 401 without a session, and work correctly with one.

## Depends on

[06-1](06-1-admin-session-guard.md).
