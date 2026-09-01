# 06. Quest 그룹 목록에서 그룹을 선택할 수 있다

Status: Not started
PLAN.md item: 6

## Why

Quests are organized into groups (e.g. "Library Event 2026" — one group per
real-world event). Admin needs a landing page listing groups, and a way into each
group's quest list.

## Scope

- Route `src/routes/admin/groups/index.tsx`:
  - Lists all `quest_groups` (name, description).
  - A create form (name, optional description) — `POST /api/groups`, admin-guarded.
  - Each row links to `/admin/groups/$groupId`.
- Route `src/routes/admin/groups/$groupId.tsx`:
  - Fetches the group's quests via `GET /api/groups/:id/quests`, admin-guarded.
  - Lists quests with links/actions to create ([04](04-create-quest.md)), update
    ([05](05-update-quest.md)), and download QR ([01](01-qr-code-generation.md)).
- Both routes sit under an `/admin` layout route (`src/routes/admin/route.tsx` or
  similar) carrying a `beforeLoad` guard: check `authClient.getSession()`
  (`src/lib/auth-client.ts`, from [07](07-admin-login.md)) and redirect to
  `/admin/login` if there's no session. [07](07-admin-login.md) built the login page
  and backend but explicitly deferred this guard here, since it couldn't be verified
  against any real protected content until now.

## Explicitly deferred (v1 scope: create + list only)

- Updating or deleting a group — not requested; only quests get update in this round.
  Revisit if groups turn out to need renaming/cleanup often.

## Acceptance criteria

- `/admin/groups` shows existing groups and a working create-group form.
- Clicking a group navigates to `/admin/groups/$groupId` showing that group's quests
  (empty state if none yet).
- Visiting either route while logged out redirects to admin login
  ([07](07-admin-login.md)).

## Depends on

[08](08-database-connection.md), [07](07-admin-login.md) (for the route guard —
can be stubbed/unguarded during initial development and guarded once 07 lands, per
the build order in [PLAN.md](../../PLAN.md)).
