# 01. Quest 페이지의 QR 코드를 생성할 수 있다

Status: Done. Verified via a real browser-mode test (`@siheom/react`, headless
Chromium through vitest's "browser" project) rendering the component and clicking
both download buttons without error, plus `bun run dev` + curl confirming the group
page renders the buttons and that the encoded URL (what scanning the QR would open)
actually opens the right quest.
PLAN.md item: 1

## What was actually built

Used `qrcode.react`'s `QRCodeCanvas` directly (it exists, wasn't in the original plan
which assumed drawing the SVG onto a canvas by hand) — simpler and more robust than
manual SVG-to-canvas conversion: `QRCodeSVG` (hidden) → `XMLSerializer` → SVG Blob
download; `QRCodeCanvas` (hidden, larger `size` for print-quality PNG) →
`canvas.toDataURL("image/png")` download.

**SSR bug caught by the end-to-end check** (not by the browser-mode component test,
which only ever runs client-side): the component originally read
`window.location.origin` directly in the render body. That's fine in the isolated
component test (real browser, `window` exists) but crashes SSR (`window is not
defined`) once actually mounted on a real page — `bun run dev` + curl surfaced a full
500 where the QR buttons should have been. Fixed with
`typeof window !== "undefined" ? window.location.origin : ""`; the client-side
hydration pass recomputes the correct value before any download can happen.
**Lesson**: a component test alone (even a real-browser one) doesn't prove SSR
safety — only rendering the actual page does.

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
