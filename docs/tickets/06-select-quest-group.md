# 06. Quest 그룹 목록에서 그룹을 선택할 수 있다

Status: Done — all 5 mini-tickets complete and verified end-to-end.
PLAN.md item: 6

## Why

Quests are organized into groups (e.g. "Library Event 2026" — one group per
real-world event). Admin needs a landing page listing groups, and a way into each
group's quest list, both behind the login built in [07](07-admin-login.md).

## Mini-tickets

1. [06-1](06-1-admin-session-guard.md) — `/admin` route guard (deferred from 07)
2. [06-2](06-2-group-repo-and-api.md) — `QuestGroupRepo.list`/API endpoints
3. [06-3](06-3-groups-list-page.md) — `/admin/groups` page (list + create)
4. [06-4](06-4-group-quests-api.md) — `QuestRepo.listByGroupId`/API endpoint
5. [06-5](06-5-group-quests-page.md) — `/admin/groups/$groupId` page (quest list)

## Explicitly deferred (v1 scope: create + list only)

- Updating or deleting a group — not requested; only quests get update in this round.
- Create/update-quest forms and QR download on the group's quest list page — those
  are [04](04-create-quest.md), [05](05-update-quest.md), [01](01-qr-code-generation.md)
  and land after this ticket. 06-5 shows the quest list without those actions yet.

## Depends on

[08](08-database-connection.md), [07](07-admin-login.md).
