# 05-2. Quest 수정 페이지

Status: Not started
Part of: [05](05-update-quest.md)

## Scope

- Extract the form JSX currently inline in
  `src/routes/admin/_authed/groups/$groupId/quests/new.tsx` into a reusable
  component (e.g. `src/components/domains/quest-editor-form.tsx`) taking
  `defaultValues` and an `onSubmit`, so both the create and edit pages render the
  same fields/upload behavior instead of duplicating the JSX.
- `new.tsx` updated to use the extracted component.
- New route `src/routes/admin/_authed/groups/$groupId/quests/$questId/edit.tsx` —
  loader calls `GET /api/quests/:id/edit` ([05-1](05-1-update-quest-api.md)),
  passes the result as `defaultValues`, submits via `PATCH /api/quests/:id`.
- On success, navigate back to `/admin/groups/$groupId`.
- Each quest row on `/admin/groups/$groupId` ([06-5](06-5-group-quests-page.md))
  gets an "edit" link to this route (the code comment placeholder there gets wired up).

## Acceptance criteria

- From a group's quest list, admin can open an existing quest's edit page and see
  its current values pre-filled (content, answer, hint, etc. — images show as
  already-uploaded, no need to re-upload unless changing them).
- Changing a field and saving updates it — verify via `bun run dev` + curl/seeded
  data: the change is visible in the group's quest list and the quest is still
  solvable at `/quest/:id` with the _new_ answer (not the old one).

## Depends on

[05-1](05-1-update-quest-api.md), [04-5](04-5-create-quest-page.md) (the form being
extracted from).
