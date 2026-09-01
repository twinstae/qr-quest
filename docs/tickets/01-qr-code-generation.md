# 01. Quest 페이지의 QR 코드를 생성할 수 있다

Status: Not started
PLAN.md item: 1

## Why

Physical QR cards placed in the real world (on a book, wall, table, chair) need to
encode a working link to `/quest/:id`. Admin needs to generate and download that code
for each quest from the admin quest list.

## Scope

- Add [`qrcode.react`](https://www.npmjs.com/package/qrcode.react) as a dependency.
- On the group's quest list page ([06](06-select-quest-group.md)), add a "download QR"
  action per quest row.
- Render via `qrcode.react`'s SVG component, encoding
  `window.location.origin + '/quest/' + quest.id`.
- Offer both **SVG** and **PNG** download:
  - SVG: serialize the rendered `<svg>` directly.
  - PNG: draw the SVG to an off-screen `<canvas>` and export via
    `canvas.toDataURL('image/png')`.
- No server involvement — this is entirely client-side, no new API endpoint.

## Explicitly deferred

- Env-configurable base URL (e.g. `PUBLIC_BASE_URL`) for cases where
  `window.location.origin` would embed a Vercel preview-deployment URL into a printed
  card. Starting with `window.location.origin`; revisit if this becomes a real
  problem once deployment ([09](09-deployment.md)) is live.

## Acceptance criteria

- From the group's quest list, admin can download a QR code (SVG and PNG) for any
  quest.
- Scanning the downloaded QR code (or pasting the encoded URL) opens
  `/quest/:id` for that exact quest.

## Depends on

[06](06-select-quest-group.md) (needs the quest list UI to hang the action off of).
Can be built against a single hardcoded/seeded quest ID for local testing before 06
is fully done, if useful to unblock work in parallel.
