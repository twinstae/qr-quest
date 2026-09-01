# 02. Quest 페이지에서 Quest를 풀 수 있다

Status: Done (client-only version), superseded by [03](03-show-reward-on-correct-answer.md)
PLAN.md item: 2

## Why

Tracking this ticket only so the PLAN.md link list is complete. The original scope —
render a quest card and check the answer — is done in
`src/components/domains/quest-card.tsx` and `src/routes/quest/$questId.tsx`, but
against a hardcoded `TEST_QUEST` with a client-side check and an `alert()`.

## Remaining work

None under this ticket. The move to a real server-side check, real quest data, and a
proper reward display is scoped under [03](03-show-reward-on-correct-answer.md) —
don't duplicate work here.
