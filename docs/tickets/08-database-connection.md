# 08. 실제 데이터베이스에 연결된다

Status: Core done (schema, PGLite driver, migrations, test helper, `bun run db:migrate`).
Postgres driver path is implemented but only verified against PGLite so far — confirm
against a real Supabase database during [09](09-deployment.md).
PLAN.md item: 8

## Why

Every other ticket except QR download reads or writes real data (quests, groups, admin
users, images). This is the foundation everything else is built on — build this first,
regardless of PLAN.md's numbering.

## Scope

- Add Drizzle ORM (`drizzle-orm`, `drizzle-kit`) targeting Postgres.
- Define schema for:
  - `quest_groups`: `id, name, description?, created_at, updated_at`
  - `quests`: `id, group_id (fk -> quest_groups.id), content, image_src, image_alt, answer, alternatives (text[]), placeholder, hint, reward_text?, reward_image_src?, reward_image_alt?, created_at, updated_at`
  - better-auth's own tables (`user`, `session`, `account`, `verification`) — generated via better-auth's schema CLI, not hand-written (see [07](07-admin-login.md)).
- Two drivers behind one schema, switched by env:
  - Local dev + tests: `@electric-sql/pglite`
  - Production: `postgres` (or `node-postgres`) pointed at Supabase's connection string.
- `drizzle-kit` migrations checked into the repo; a `bun run db:migrate` script runs them against whichever driver is active.
- A test-only helper that spins up a fresh in-memory PGLite instance per test run (or per test file), so tests never touch a shared database.

## Explicitly deferred

- Connection pooling tuning for Vercel serverless (revisit in [09](09-deployment.md) if cold-start/connection-limit issues show up).

## Acceptance criteria

- `bun run db:migrate` applies all migrations cleanly against a fresh PGLite instance and against a fresh Supabase Postgres database.
- A schema-level test can insert a `quest_group` and a `quest` referencing it, and read them back.
- `alternatives` column exists and accepts a string array, even though nothing reads/writes it yet beyond raw storage (see [03](03-show-reward-on-correct-answer.md) for why it's unwired).

## Depends on

Nothing. This is the first ticket.
