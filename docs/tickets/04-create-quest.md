# 04. Quest를 생성할 수 있다

Status: Not started
PLAN.md item: 4

## Why

Admin needs a way to author quests: content, an image, the answer, an optional hint,
and the reward shown on success. This ticket also builds the image upload path
(storage adapter + presigned upload), since it's the first form that needs it —
[05](05-update-quest.md) reuses it as-is.

## Scope

### Storage adapter (shared infra, lives here first)

- Define a small interface, e.g. `ImageStorage.presignUpload(filename, contentType): Promise<{ uploadUrl, publicUrl }>`.
- Implement it against **Supabase Storage's S3-compatible API** — plain
  presigned `PUT`, not Supabase's proprietary signed-upload-URL API. This keeps the
  browser-side upload code protocol-generic: if the backend ever swaps to Cloudflare
  R2, only the server-side adapter implementation changes, not the client.
- Implement a fake/in-memory adapter for tests (no network calls).
- `POST /api/uploads/presign` — admin-guarded (see [07](07-admin-login.md)). Body
  `{ filename, contentType }`, returns `{ uploadUrl, publicUrl }`. Validate
  `contentType` starts with `image/`.
- Browser flow: request a presigned URL → `fetch(uploadUrl, { method: 'PUT', body: file })`
  directly to storage → use `publicUrl` as the form's image value. The server never
  sees the file bytes.

### Quest create form (admin)

- New field component(s) in `src/components/form/simple-field.tsx` (or a sibling
  file) for image upload — none exists yet, follow the existing `SimpleInput`/
  `SimpleCheckbox` pattern (Controller + `Field.Root` + error handling).
- Form fields: `content`, quest image (upload, required), `answer`, `hint`,
  `placeholder`, reward text (optional), reward image (upload, optional).
- **Upload-only** for both quest image and reward image — no "paste a URL" fallback.
  Existing `TEST_QUEST`'s external URL (`press.knou.ac.kr/...`) is dev fixture data
  only, not a supported input mode going forward.
- Validation schema in valibot (frontend), matching the TypeBox schema used by
  `POST /api/quests` (independent definitions — no shared-schema bridge, per the
  TypeBox-server/valibot-frontend split).
- `POST /api/quests` — admin-guarded. Body includes `group_id` (quest is always
  created within a group, see [06](06-select-quest-group.md)).
- On success, navigate back to the group's quest list ([06](06-select-quest-group.md)).

## Explicitly deferred

- `alternatives` field in the create form — the column exists but isn't exposed in
  the UI yet (matches [03](03-show-reward-on-correct-answer.md)'s deferral of
  alternatives-matching).
- Cloudflare R2 adapter — interface supports it, not implemented.

## Acceptance criteria

- From a group's quest list page, admin can open a create form, upload a quest image
  and (optionally) a reward image, fill in the rest, and submit.
- The new quest appears in the group's quest list and is solvable at `/quest/:id`
  with the correct answer showing the configured reward.
- Uploading a non-image file is rejected before it reaches storage.

## Depends on

[08](08-database-connection.md), [07](07-admin-login.md) (route/endpoint guarding),
[06](06-select-quest-group.md) (needs a group to create the quest into — can be
developed in parallel with a seeded test group, but needs the group list UI to be
reachable end-to-end).
