# 04. Quest를 생성할 수 있다

Status: Split into mini-tickets below (same pattern as ticket 06).
PLAN.md item: 4

## Why

Admin needs a way to author quests: content, an image, the answer, an optional hint,
and the reward shown on success. Also builds the image upload path (storage adapter +
presigned upload), since it's the first form that needs it — [05](05-update-quest.md)
reuses it as-is.

## Mini-tickets

1. [04-1](04-1-image-storage-adapter.md) — `ImageStorage` interface, Fake + Supabase
   S3-compatible real adapter
2. [04-2](04-2-upload-endpoint.md) — `POST /api/uploads/presign`
3. [04-3](04-3-image-upload-field.md) — upload form field component (client-side)
4. [04-4](04-4-create-quest-api.md) — `QuestRepo`/service/`POST /api/quests`
5. [04-5](04-5-create-quest-page.md) — the actual create-quest page, wired together

## Explicitly deferred

- `alternatives` field in the create form — column exists, not exposed in UI yet
  (matches [03](03-show-reward-on-correct-answer.md)'s deferral).
- Cloudflare R2 adapter — interface supports swapping it in, not implemented.
- The real Supabase S3 adapter can't be verified against live infrastructure in this
  environment (no Supabase project exists yet) — same situation as ticket 08's
  Postgres driver. Implemented against the documented API shape, tested via the fake,
  verify for real during [09](09-deployment.md).

## Depends on

[08](08-database-connection.md), [07](07-admin-login.md), [06](06-select-quest-group.md).
