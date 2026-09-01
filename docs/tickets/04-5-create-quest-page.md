# 04-5. Quest 생성 페이지

Status: Done. Verified via `bun run dev` + curl: guard redirect, the group page's
link to this route, and this page rendering all fields (content/answer/hint, both
image-upload fields, submit button) with no errors. The actual click-through
(picking a file, submitting, landing back on the group page) is **not** verified —
no browser automation available. The pieces it's built from (`POST
/api/uploads/presign`, `POST /api/quests`, `SimpleImageUpload`) are each
independently verified end-to-end already (04-2, 04-3, 04-4).
Part of: [04](04-create-quest.md)

## Routing structure note

Built at `src/routes/admin/_authed/groups/$groupId/quests/new.tsx` — this required
restructuring [06-5](06-5-group-quests-page.md)'s `$groupId.tsx` (a single file) into
`$groupId/index.tsx` (a directory), because TanStack Router treats a file `$groupId.tsx`
sitting _alongside_ a `$groupId/` directory as a **layout** for everything inside that
directory (requiring an `<Outlet/>` to show children) — verified this by checking the
actual generated `routeTree.gen.ts` rather than trusting a fetched-docs paraphrase,
which suggested a different (and, on inspection, unnecessary) trailing-underscore
convention. With `$groupId.tsx` moved to `$groupId/index.tsx`, there's no ambiguous
layout file, so `$groupId/index.tsx` and `$groupId/quests/new.tsx` are independent
sibling routes sharing a URL prefix — `quests/new.tsx` renders as a fully standalone
page, not nested inside the quest-list page's chrome.

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
