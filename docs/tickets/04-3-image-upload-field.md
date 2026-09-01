# 04-3. 이미지 업로드 폼 필드

Status: Done. Typechecks/lints/compiles against the existing `SimpleForm` machinery.
Not click-tested in a real browser (no browser automation available this session,
same limitation as prior UI tickets) — will get indirect coverage once
[04-5](04-5-create-quest-page.md) actually renders it on a page reachable via
`bun run dev`.
Part of: [04](04-create-quest.md)

`SimpleImageUpload`'s field value is `{ src: string; alt: string }`. `alt` isn't a
separate user-editable input for MVP — it's set to the uploaded file's name
automatically. Accessibility-conscious custom alt text is a fine future addition,
not blocking here.

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
