# 06-2. QuestGroupRepo.list + POST/GET /api/groups

Status: Done. Verified end-to-end via `bun run dev` + curl (401 without session,
create + list working with one).
Part of: [06](06-select-quest-group.md)

`createFakeContext`'s `override` now deep-merges `repo` (`...override.repo` instead
of replacing the whole `repo` object) — needed once `repo` had two keys, since
existing call sites only override `quest` and expect `questGroup` to still get its
default. Same pattern will apply for any future repo addition, no further changes
needed there.

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
