# 11. Case / Step / PlaySession 모델

Status: Not started. Phase 1의 첫 단계(모든 후속 티켓의 선행 조건).
PLAN.md item: 11
상위 설계: [../plans/qr-mystery-tour.md](../plans/qr-mystery-tour.md) §3~§4

## Why

현재 모델은 `QuestGroup`(이름/설명) → `Quest`(문제/정답/보상) 2계층이고 순서 개념이 없다.
요구서는 CASE(사건) → STEP(순서 있는 단계) → 참가 세션 3계층을 요구한다.
순서·잠금·통계는 모두 이 3계층 위에서만 표현할 수 있으므로 여기서 먼저 정리한다.

배포 전(티켓 09 미완료)이고 실사용 데이터가 없으므로, **이름을 지금 바꾸는 것이 가장 싸다.**
"관리자 화면의 단어와 코드의 단어가 다르면 CMS 유지보수가 비싸진다"가 rename의 이유다.

## Scope

### 도메인

- `QuestGroup` → `Case`, `Quest` → `Step`으로 rename하고 필드를 확장한다.
  - `Case`: `number`, `title`, `teaser`, `intro`, `thumbnail?`, `estimatedMinutes`,
    `status`(DRAFT/TEST/LIVE/CLOSED), `entryToken`, `finalBookTitle?`, `rewardNote?`
  - `Step`: `caseId`, `order`, `kind`(INTRO/QR/FINAL/CLOSING), `name`, `qrToken`,
    `published`, `title`, `body`, `media?`, `reveal`, `question?`, `answerSpec?`,
    `placeholder?`, `hint?`, `correctMessage?`, `wrongMessage?`
- `AnswerSpec` 판별 유니온 + `matchAnswer(spec, submitted)` 순수 함수 (계획 §4).
  - 정규화: NFC → trim → 연속 공백 1칸 → 소문자 → (SHORT_TEXT만) 문장부호 제거.
  - 퍼지 매칭 없음. 복수 정답 등록으로 해결한다.
- `openStep({ session, step, caseId })` 잠금 순수 함수 → `ALLOWED` / `NOT_STARTED` /
  `LOCKED` / `COMPLETED` / `OTHER_CASE` (계획 §4).
- `PlaySession`, `StepAttempt` 타입.
- `src/domain/fixtures.ts`를 새 모델 기준으로 갱신한다(테스트 픽스처를 계속 한 곳에서 관리).

### 영속성

- 마이그레이션 `0001`: `quest_groups` → `cases`, `quests` → `steps` rename +
  컬럼 추가/이름 변경 + `play_sessions`, `step_attempts` 생성.
  - 기존 `quests` 행은 `steps(kind='QR', order=<생성순>, qrToken=<신규>)`로 승계한다.
  - `steps.qrToken`은 unique + 추측 불가한 10자(혼동 문자 제외 영숫자).
  - `answerSpec`/`reveal`/`media`는 `jsonb` + `$type<>()`.
  - `play_sessions.token` unique, `step_attempts`는 `sessionId`·`stepId` 인덱스.
  - FK는 `on delete cascade`.
- `CaseRepo`에 `getById`/`update`/`delete`/`list`, `StepRepo`에
  `listByCaseId`/`getByQrToken`/`getByCaseAndOrder`/`getById`/`create`/`update`/`delete`/
  `reorder`/`nextOrder`를 추가한다. 인터페이스는 `src/persistence/types.ts`에 유지.
- `PlaySessionRepo`: `create`/`getByToken`/`getById`/`update`/`listByCase`/`listByCaseInRange`.
- `StepAttemptRepo`: `create`/`listBySession`/`listByCase`, 힌트 사용 시각 포함.

### API (thin)

- 기존 관리자 라우트를 `/api/cases*`, `/api/steps*`로 rename한다.
  참가자용 `/api/quests/:id`는 이 티켓에서 제거하지 않고 [12](12-player-tour-flow.md)에서
  `/api/play/*`로 대체한다(중간에 화면이 깨지지 않도록).

## 테스트 (RED 먼저)

- `src/domain/answerSpec.test.ts` — 유형별 판정, 공백/대소문자/NFC, 복수 정답,
  숫자 동등(허용 오차), 키워드 ALL/ANY, 복수선택 순서 무관, 빈 제출 방어.
- `src/domain/tourFlow.test.ts` — 잠금 5분기, 진행 전진, FINAL 이후 상태.
- `src/domain/case.test.ts` — 기본 단계 7개 자동 생성 순서/kind, qrToken 발급 규칙.
- `src/persistence/drizzle/DrizzleStepRepo.test.ts` — 순서 정렬, qrToken unique 충돌,
  jsonb 왕복(`AnswerSpec` 각 분기), cascade 삭제, reorder 원자성.
- `src/persistence/drizzle/DrizzleCaseRepo.test.ts`, `DrizzlePlaySessionRepo.test.ts`.
- rename 마이그레이션 테스트: 기존 형태의 `quests` 1행을 넣고 마이그레이션 후
  `steps`로 승계되며 `qrToken`이 채워졌는지 확인한다.

## Explicitly deferred

- 단계 복사(한 CASE 안에서 STEP 복제), 콘텐츠 버전 관리/되돌리기.
- `alternatives` 컬럼의 의미 확장 — `AnswerSpec.SHORT_TEXT.accepted`로 흡수하고 컬럼은 삭제한다.
- 다국어, 예약 공개일(`openAt`/`closeAt`).

## Acceptance criteria

- `bun run db:migrate`가 빈 PGLite와 기존 스키마 위에서 모두 깨끗하게 적용된다.
- 마이그레이션 후 기존 퀘스트 데이터가 단계로 남아 있고 잠금 로직이 동작한다.
- `bun run ci`(test/lint/format/typecheck) 통과.
- `src/` 어디에도 `QuestGroup`·`Quest` 타입 이름이 남아 있지 않다(화면 문구는 제외).

## Depends on

없음. 단, 이 티켓의 rename이 12~14에 넓게 영향을 주므로 **12·13과 병행하지 않는다.**
