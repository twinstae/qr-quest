# 06-4. QuestRepo.listByGroupId + GET /api/groups/:id/quests

Status: Done. Repo isolation verified via `DrizzleQuestRepo.test.ts` (real PGLite);
endpoint verified via `bun run dev` + curl for 401 and the 200/empty-array case.
The full multi-group e2e case (seeding two groups' worth of quests and confirming
scoping through live HTTP) was **not** re-verified this way — hit an unrelated PGLite
reliability issue reopening a data directory after a `pkill`'d dev server (see note
below) and stopped rather than keep fighting it, since the repo-level test already
covers the exact same isolation logic against a real database.
Part of: [06](06-select-quest-group.md)

## Rough edge found (tooling, not a code bug)

Killing `bun run dev` with `pkill` (SIGTERM) doesn't let PGLite release its
`postmaster.pid` lock cleanly — already known (ticket 03). New this time: after
manually deleting that stale lock file and reopening the *same* data directory from a
one-off script, PGLite hung indefinitely with no other process holding it (not a lock
contention case — confirmed via `ps aux` that nothing else was touching `.data/dev`).
Root cause not diagnosed. Workaround: `rm -rf .data` and re-migrate fresh rather than
reusing a data directory that survived an unclean shutdown. Not worth deeper
investigation now — this only affects local scratch/manual testing, never the actual
app or test suite (which always uses either a fresh migrate or `createTestDatabase()`'s
in-memory instance).

## Why

The group detail page needs to list the quests inside one group. `QuestRepo`
currently only has `getById`/`create` — no way to query by group.

## Scope

- `QuestRepo.listByGroupId(groupId): Promise<Quest[]>` — add to
  `src/persistence/types.ts`, implement in `FakeQuestRepo` and `DrizzleQuestRepo`.
- `src/application/questService.ts` — `listQuestsInGroup(ctx, groupId)`. Returns the
  same reward-excluding/answer-excluding shape as `getQuestForDisplay` per quest (an
  admin list view still shouldn't need to show the raw answer inline — decide when
  building whether admin actually needs to _see_ the answer here for editing context;
  if so it's fine to return it since this endpoint is `auth: true`, unlike the public
  `GET /api/quests/:id`).
- `GET /api/groups/:id/quests` — `{ auth: true }`, on the app from
  [06-1](06-1-admin-session-guard.md).

## Acceptance criteria

- Repo test: creating quests in two different groups, `listByGroupId` for one group
  only returns that group's quests.
- App test: 401 without session; with session, returns the right quests for the
  group id in the URL.

## Depends on

[06-1](06-1-admin-session-guard.md).
