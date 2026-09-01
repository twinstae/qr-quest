# 04-2. POST /api/uploads/presign

Status: Done. Verified end-to-end via `bun run dev` + curl (401, 200 with a real
fake-storage URL, 422 rejection for a non-image content type).
Part of: [04](04-create-quest.md)

## What was actually built

`contentType` validation is **not** application-level — it's a TypeBox pattern on
the route body schema (`t.String({ pattern: "^image/" })`). Elysia rejects
non-matching requests with a 422 before the handler (and therefore
`ImageStorage.presignUpload`) ever runs, which is exactly "reject before it reaches
storage" with less code than a hand-rolled domain validation error would need — no
new error class, no `.onError` branch. `src/application/uploadService.ts` is
consequently a thin one-line wrapper over `ctx.imageStorage.presignUpload`.

- `src/application/uploadService.ts` — `presignUpload(ctx, { filename, contentType })`.
- `POST /api/uploads/presign` on the app — `{ auth: true }`, body
  `{ filename, contentType }` (contentType pattern-validated), returns
  `{ uploadUrl, publicUrl }`.

## Acceptance criteria

- 401 without a session.
- Non-image `contentType` rejected before any `ImageStorage` call (test with the
  fake adapter + a spy/counter, or just assert the fake's call count stays 0).
- Valid image `contentType` returns the fake adapter's `{ uploadUrl, publicUrl }`.

## Depends on

[04-1](04-1-image-storage-adapter.md), [06-1](06-1-admin-session-guard.md) (for the
`auth: true` macro).
