# 04-3. 이미지 업로드 폼 필드

Status: Not started
Part of: [04](04-create-quest.md)

## Scope

- `SimpleImageUpload` in `src/components/form/simple-field.tsx` (or a sibling file),
  following the existing `SimpleInput`/`SimpleCheckbox` pattern (RHF `Controller` +
  `Field.Root` + error/hint display).
- On file select: `POST /api/uploads/presign` (via `getApiClient()`) → `fetch(uploadUrl, { method: "PUT", body: file })`
  directly to storage → set the field's value to `publicUrl`.
- Shows upload progress/state (uploading / done / error) and a preview once uploaded.

## Acceptance criteria

- Component compiles and typechecks against the `SimpleForm` machinery already in
  use elsewhere (quest-card.tsx, admin/login.tsx, admin/groups pages).
- Can't fully browser-test file selection/upload without browser automation
  (unavailable this session, as with prior UI tickets) — note this explicitly rather
  than claiming full verification.

## Depends on

[04-2](04-2-upload-endpoint.md).
