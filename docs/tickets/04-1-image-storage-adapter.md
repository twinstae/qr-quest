# 04-1. ImageStorage 어댑터

Status: Not started
Part of: [04](04-create-quest.md)

## Why

Both the quest image and reward image need to go through presigned uploads
(explicit decision: upload-only, no pasted URLs). Build the storage abstraction
first so the upload endpoint ([04-2](04-2-upload-endpoint.md)) has something to call.

## Scope

- `src/persistence/types.ts` (or a new `src/domain/imageStorage.ts` + interface in
  persistence — decide based on what feels consistent when writing it): `ImageStorage`
  with `presignUpload(input: { filename: string; contentType: string }): Promise<{ uploadUrl: string; publicUrl: string }>`.
- `src/persistence/FakeImageStorage.ts` — returns deterministic fake URLs, no network.
- `src/persistence/s3/SupabaseImageStorage.ts` (new `src/persistence/s3/` dir,
  parallel to `src/persistence/drizzle/`) — `@aws-sdk/client-s3` +
  `@aws-sdk/s3-request-presigner`, `forcePathStyle: true`, endpoint
  `https://<project_ref>.storage.supabase.co/storage/v1/s3`. Env vars:
  `SUPABASE_S3_ENDPOINT`, `SUPABASE_S3_REGION`, `SUPABASE_S3_ACCESS_KEY_ID`,
  `SUPABASE_S3_SECRET_ACCESS_KEY`, `SUPABASE_STORAGE_BUCKET`. Public URL:
  `https://<project_ref>.supabase.co/storage/v1/object/public/<bucket>/<key>` — needs
  a `SUPABASE_PUBLIC_URL` (or derive from the endpoint) to build this correctly.
- `AppContext.imageStorage: ImageStorage` — add to `src/api/context.ts`.

## Acceptance criteria

- Fake adapter test: `presignUpload` returns a well-formed `{ uploadUrl, publicUrl }`.
- Real adapter: typechecks and constructs the right `PutObjectCommand`/presigned URL
  shape — cannot be verified against live Supabase in this environment (no project
  exists yet). Flag clearly as unverified, same as ticket 08's Postgres driver.

## Depends on

Nothing new.
