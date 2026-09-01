# 03. 답을 맞추면 뭔가를 보여준다

Status: Done. Verified end-to-end via `bun run dev` + curl + real HTML SSR output
(browser click-through not verified — no browser automation available this session).
PLAN.md item: 3

## Architecture note (added during implementation)

Built as a layered hexagonal structure (domain / application / persistence / api),
not routes calling Drizzle directly — matching the pattern already used elsewhere in
this developer's projects (see `../realworld-ts/back`). This applies to every ticket
from here on, not just this one:

- `src/domain/` — plain types + pure logic (`Quest`, `QuestGroup`, `isCorrectAnswer`),
  no I/O.
- `src/persistence/types.ts` — repo interfaces (`QuestRepo`, `QuestGroupRepo`).
  `src/persistence/Fake*Repo.ts` — in-memory implementations for fast tests.
  `src/persistence/drizzle/Drizzle*Repo.ts` — real implementations, plus the DB
  client/schema/migrations (moved here from the earlier `src/server/db/`).
- `src/application/*Service.ts` — orchestration functions `(ctx: AppContext, ...) => ...`,
  no framework/HTTP awareness. Throws domain errors (`src/domain/errors.ts`) on failure.
- `src/api/context.ts` — `AppContext` (the `repo` bag) + `createFakeContext()` for tests.
  `src/api/elysia/app.ts` — thin Elysia layer, maps domain errors to HTTP status via
  `.onError`. `src/api/elysia/index.ts` — real singleton wiring (Drizzle repos from
  `DATABASE_URL`), imported by the actual route mount at `src/routes/api/$.ts`.
- Repository tests seed fixtures through repo interfaces only (e.g.
  `DrizzleQuestGroupRepo.create()`), never by reaching into `db.insert()` directly —
  a repo test shouldn't need to know it's backed by Drizzle.
- Test DB fixtures use `await using db = await createTestDatabase()` (explicit
  resource management) instead of manual `afterEach` cleanup bookkeeping.

Known rough edge: a file-based PGLite instance (`pglite://...`) left unclosed leaves a
stale `postmaster.pid` lock that hangs the _next_ process indefinitely (no timeout, no
staleness check). `migrate.ts` now closes its client; any one-off script against
`.data/dev` should do the same or you'll need to manually remove the lock file.

## Why

`src/routes/quest/$questId.tsx` currently checks the answer client-side against a
hardcoded `TEST_QUEST` and shows a bare `alert()`. The real requirement is: the answer
is submitted to the server, the server decides correctness, and on success the quest
creator's prepared reward (text and/or image) is shown inline on the page.

This ticket also stands up the first real slice of the backend (Elysia mounted at
`/api`, plus the Eden Treaty client), since it's the first feature that needs it.

## Scope

### Backend

- Mount one Elysia app at a single catch-all TanStack Start API route (`/api/*`), per
  the [Elysia + TanStack Start integration guide](https://elysiajs.com/integrations/tanstack-start).
- Route schemas defined with **TypeBox** (Elysia's native validator) — not valibot.
  Valibot stays frontend-only (see [04](04-create-quest.md)).
- `GET /api/quests/:id` — public. Returns `{ content, image, placeholder, hint }`.
  Does **not** return `answer`, `alternatives`, or reward fields (don't leak the
  answer to the client).
- `POST /api/quests/:id/submit-answer` — public. Body `{ answer: string }`. Compares
  against `quests.answer` only (case-insensitive, trimmed) — **not** `alternatives`
  yet, that's explicitly deferred (see below). Returns
  `{ correct: true, reward: { text?, image? } }` on success, `{ correct: false }` on
  failure. No rate limiting, no attempt tracking — anyone can resubmit indefinitely.
- Export the Elysia app's type and set up an Eden Treaty client
  (`src/lib/api-client.ts` or similar) for typed frontend calls — this is the pattern
  every later ticket's API calls will reuse.

### Frontend

- Replace `TEST_QUEST` in `src/routes/quest/$questId.tsx` with a real
  `GET /api/quests/:id` call (loader or query).
- Replace the `alert()` in `onSubmit` with a call to
  `POST /api/quests/:id/submit-answer` via the Eden Treaty client.
- On `correct: true`, render the reward inline on the same page (a panel/card showing
  `reward.image` if present, `reward.text` if present) — no redirect to a separate
  success page.
- On `correct: false`, keep existing wrong-answer UX (the hint disclosure already
  works client-side and doesn't need a server round trip).

## Explicitly deferred

- Matching against `alternatives` — the column exists ([08](08-database-connection.md))
  but `submit-answer` only checks `answer` for now. Wiring in `alternatives` is a
  follow-up, no new migration needed when it happens.

## Acceptance criteria

- Visiting `/quest/:id` for a seeded quest shows real content fetched from the API,
  not `TEST_QUEST`.
- Submitting the correct answer shows the reward (text/image) inline, no `alert()`.
- Submitting a wrong answer shows the existing wrong-answer state, no server error.
- The quest's `answer` value never appears in any network response visible to the
  client (check the `GET /api/quests/:id` payload).

## Depends on

[08](08-database-connection.md) (needs quests to read/write).
