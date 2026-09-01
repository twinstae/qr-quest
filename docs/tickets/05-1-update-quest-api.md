# 05-1. QuestRepo.update + PATCH /api/quests/:id + GET /api/quests/:id/edit

Status: Done. Verified end-to-end via `bun run dev` + curl: 401 on both new
endpoints, edit fetch includes answer/reward, PATCH changes are visible immediately
and the old answer stops working while the new one works.
Part of: [05](05-update-quest.md)

## Real bug caught by the end-to-end check (not by `app.test.ts`)

`src/routes/api/$.ts` (the TanStack Start route mounting the Elysia app) only
registered `GET`/`POST` in its `server.handlers` — a `PATCH` request fell through to
the SPA shell and got an HTML page back, not JSON. `app.test.ts` never caught this
because it calls `app.handle()` directly, bypassing the TanStack Start route mount
entirely. Fixed by adding `PATCH`/`PUT`/`DELETE` handlers too, all delegating to the
same `app.fetch`. **This is exactly why the `bun run dev` + curl check matters for
every ticket that adds a new HTTP method** — unit tests alone would have shipped this
broken.

## Why

The edit form needs the quest's _full_ data to pre-fill (including `answer` and
`reward`, which the public `GET /api/quests/:id` deliberately never returns). Rather
than overload the public endpoint with auth-dependent behavior (confusing, and risky
if the guard logic ever has a bug — same path returning different data based on
session is an easy way to accidentally leak an answer), use a distinct admin path.

## Scope

- `QuestRepo.update(id, input): Promise<Quest>` — `input` is `Omit<Quest, "id" |
"groupId">` (a quest doesn't change groups in this ticket; `alternatives` still
  isn't exposed, matches ticket 03/04's deferral — repo keeps it as-is on update, or
  just accept it staying `[]`). Add to `src/persistence/types.ts`, implement in
  `FakeQuestRepo` and `DrizzleQuestRepo`.
- `src/application/questService.ts` — `getQuestForEdit(ctx, id)` (full `Quest`, throws
  `NotExistError` like the other getters), `updateQuest(ctx, id, input)`.
- `GET /api/quests/:id/edit` — `{ auth: true }`, returns the full `Quest` (reuse
  `QuestSchema` from `app.ts`).
- `PATCH /api/quests/:id` — `{ auth: true }`, same body shape as `POST /api/quests`
  minus `groupId`, returns the updated `Quest`.

## Acceptance criteria

- 401 without a session on both new endpoints.
- `GET /api/quests/:id/edit` on a real quest returns `answer`/`reward` (unlike the
  public endpoint) — worth asserting explicitly, it's the whole point of this route.
- `PATCH` changes are visible both via `GET /api/quests/:id/edit` and via the public
  `GET /api/quests/:id` / `submit-answer` (the updated answer works, the old one
  doesn't) — one test tying this together, matching ticket 04-4's pattern.

## Depends on

[06-1](06-1-admin-session-guard.md).
