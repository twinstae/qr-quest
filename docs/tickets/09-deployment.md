# 09. 배포되서 링크로 진입할 수 있다

Status: Not started
PLAN.md item: 9

## Why

The whole point is real-world QR cards linking to a publicly reachable app.

## Scope

- Create a Supabase project: Postgres database + Storage bucket for uploaded images
  ([04](04-create-quest.md)).
- Deploy to Vercel: TanStack Start + Elysia (mounted at `/api`) per the
  [Elysia + TanStack Start integration guide](https://elysiajs.com/integrations/tanstack-start).
- Env vars on Vercel: Supabase Postgres connection string, Supabase Storage
  credentials/endpoint (S3-compatible, [04](04-create-quest.md)), better-auth secret,
  seeded-admin credentials used only to run [07](07-admin-login.md)'s seed script
  once against production.
- Run `bun run db:migrate` against the production database before first traffic.
- Run `bun run seed:admin` once against production to create the real admin login.
- Verify: `/quest/:id` for a real quest works from a phone camera scan end-to-end
  (scan → answer → reward shown), and `/admin/*` is reachable and guarded.

## Explicitly deferred

- Connection pooling tuning (revisit only if Vercel's serverless functions hit
  Postgres connection limits under load — not expected at event-scale traffic).
- Custom domain — use the default Vercel domain unless told otherwise.

## Acceptance criteria

- The production URL is reachable and `/quest/:id` for a seeded quest works from an
  external device (not localhost).
- `/admin/*` requires login in production, using the seeded admin account.
- A QR code generated in production ([01](01-qr-code-generation.md)) and scanned from
  a phone opens the correct quest.

## Depends on

All other tickets — this is the last one.
