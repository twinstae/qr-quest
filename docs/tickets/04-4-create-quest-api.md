# 04-4. POST /api/quests

Status: Not started
Part of: [04](04-create-quest.md)

## Scope

- `src/application/questService.ts` — `createQuest(ctx, input: Omit<Quest, "id">)`,
  thin wrapper over `ctx.repo.quest.create` (repo `create` already exists, from
  ticket 03's test-fixture needs).
- `POST /api/quests` — `{ auth: true }`, body `{ groupId, content, image, answer,
  placeholder, hint, rewardText?, rewardImage? }` (TypeBox schema; `alternatives` not
  exposed, per the ticket-level deferral — repo still defaults it to `[]`).

## Acceptance criteria

- 401 without a session.
- Valid body creates a quest; response includes the new quest's id.
- The created quest is immediately solvable at the existing public
  `GET /api/quests/:id` / `POST /api/quests/:id/submit-answer` endpoints (ticket 03) —
  worth one test tying these together, not just testing 04-4 in isolation.

## Depends on

[06-1](06-1-admin-session-guard.md).
