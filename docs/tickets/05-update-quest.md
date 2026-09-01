# 05. Quest를 수정할 수 있다

Status: Not started
PLAN.md item: 5

## Why

Admin needs to edit an existing quest (fix a typo, swap an image, change the answer)
without deleting and recreating it.

## Scope

- Reuse the create form from [04](04-create-quest.md) in "edit" mode: same fields,
  same upload flow, pre-filled with the existing quest's values via
  `GET /api/quests/:id` (an authenticated variant, or reuse the public one plus an
  admin-only field set — decide when implementing based on how much the two payloads
  actually diverge).
- `PATCH /api/quests/:id` — admin-guarded, same TypeBox schema shape as create
  (fields optional for partial update, or require the full object — keep it simple
  and require the full object unless that proves annoying).
- Replacing an image re-runs the presigned-upload flow from [04](04-create-quest.md);
  the old image is not deleted from storage (no cleanup logic in this ticket — orphaned
  files are an acceptable MVP cost).

## Explicitly deferred

- Deleting a quest — not requested, not building it.
- Cleaning up replaced/orphaned images in storage.

## Acceptance criteria

- From a group's quest list, admin can open an existing quest, change a field (e.g.
  swap the reward text), save, and see the change reflected both in the admin list
  and on the live `/quest/:id` page.

## Depends on

[04](04-create-quest.md) (reuses its form and upload flow).
