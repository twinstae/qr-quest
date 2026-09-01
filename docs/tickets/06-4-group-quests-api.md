# 06-4. QuestRepo.listByGroupId + GET /api/groups/:id/quests

Status: Not started
Part of: [06](06-select-quest-group.md)

## Why

The group detail page needs to list the quests inside one group. `QuestRepo`
currently only has `getById`/`create` — no way to query by group.

## Scope

- `QuestRepo.listByGroupId(groupId): Promise<Quest[]>` — add to
  `src/persistence/types.ts`, implement in `FakeQuestRepo` and `DrizzleQuestRepo`.
- `src/application/questService.ts` — `listQuestsInGroup(ctx, groupId)`. Returns the
  same reward-excluding/answer-excluding shape as `getQuestForDisplay` per quest (an
  admin list view still shouldn't need to show the raw answer inline — decide when
  building whether admin actually needs to *see* the answer here for editing context;
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
