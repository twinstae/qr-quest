# 05. Quest를 수정할 수 있다

Status: Done — both mini-tickets complete.
PLAN.md item: 5

## Why

Admin needs to edit an existing quest (fix a typo, swap an image, change the answer)
without deleting and recreating it.

## Mini-tickets

1. [05-1](05-1-update-quest-api.md) — `QuestRepo.update`, `GET /api/quests/:id/edit`,
   `PATCH /api/quests/:id`
2. [05-2](05-2-update-quest-page.md) — extract a shared quest-editor form component,
   the actual edit page

## Explicitly deferred

- Deleting a quest — not requested, not building it.
- Cleaning up replaced/orphaned images in storage when an image is swapped.
- Changing a quest's group — not needed, not building it.

## Depends on

[04](04-create-quest.md) (reuses its form and upload flow).
