# 04-2. POST /api/uploads/presign

Status: Not started
Part of: [04](04-create-quest.md)

## Scope

- `src/application/uploadService.ts` — `presignUpload(ctx, { filename, contentType })`,
  validates `contentType` starts with `image/` (reject otherwise — domain-level
  validation error, not a storage call).
- `POST /api/uploads/presign` on the app — `{ auth: true }`, body
  `{ filename, contentType }`, returns `{ uploadUrl, publicUrl }`.

## Acceptance criteria

- 401 without a session.
- Non-image `contentType` rejected before any `ImageStorage` call (test with the
  fake adapter + a spy/counter, or just assert the fake's call count stays 0).
- Valid image `contentType` returns the fake adapter's `{ uploadUrl, publicUrl }`.

## Depends on

[04-1](04-1-image-storage-adapter.md), [06-1](06-1-admin-session-guard.md) (for the
`auth: true` macro).
