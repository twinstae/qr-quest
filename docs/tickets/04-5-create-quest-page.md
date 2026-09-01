# 04-5. Quest 생성 페이지

Status: Not started
Part of: [04](04-create-quest.md)

## Scope

- `src/routes/admin/_authed/groups/$groupId/quests/new.tsx` (or similar — decide
  exact path when writing, matching TanStack Router file conventions already used
  under `admin/_authed/groups/`).
- Form: `content`, quest image (`SimpleImageUpload`, required), `answer`, `hint`,
  `placeholder`, reward text (optional), reward image (`SimpleImageUpload`, optional).
- Submits to `POST /api/quests` with the current `groupId` from the route params.
- On success, navigate back to `/admin/groups/$groupId`.
- `/admin/groups/$groupId`'s disabled "Quest 만들기" button ([06-5](06-5-group-quests-page.md))
  becomes a real link to this page.

## Acceptance criteria

- From a group's quest list, admin can open this form, fill it in (uploading both
  images via [04-3](04-3-image-upload-field.md)), submit, and land back on the group's
  quest list with the new quest visible.
- The new quest is solvable at `/quest/:id` end-to-end (correct answer shows the
  configured reward) — verify via `bun run dev` + curl/seeded data, same as prior
  tickets.

## Depends on

[04-3](04-3-image-upload-field.md), [04-4](04-4-create-quest-api.md),
[06-5](06-5-group-quests-page.md).
