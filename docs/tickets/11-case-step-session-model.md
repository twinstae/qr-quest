# 11. Case / Step / PlaySession 모델

Status: Done (2단계 완료). Phase 1의 첫 단계(모든 후속 티켓의 선행 조건).
세션 API(`/api/play/*`)만 [12](12-player-tour-flow.md)로 넘겼다.
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

- [x] `bun run db:migrate`가 빈 PGLite에서 깨끗하게 적용된다(로컬 dev DB를 비우고 확인).
- [~] 기존 퀘스트 데이터 승계 — 배포 전이라 승계할 데이터가 없다. 이 관문은 사라졌다.
- [x] `bun run ci`(test/lint/format/typecheck) 통과 — 22 files / 179 tests.
- [x] `src/` 어디에도 `QuestGroup`·`Quest` 타입 이름이 남아 있지 않다(화면 문구 제외,
      제품 이름은 12에서 정리).
- [x] 브라우저에서 CASE 생성 → 7단계 뼈대 → 단계 편집 → 참가자 QR 화면까지 확인(2026-09-14).

## 진행 상황 (2026-09-14)

### 1단계 — 도메인 규칙 (동작 변화 없음)

- `AnswerSpec` 5종 + `matchAnswer`: `src/domain/step.ts`, `step.test.ts`
- `openStep` 5분기 + `nextOrderAfter` + `progressOf`: `src/domain/tourFlow.ts`(테스트 포함)
- `Case`/`StepTemplate`/`defaultStepTemplates`: `src/domain/case.ts`, `case.test.ts`
- `PlaySession`/`StepAttempt`/`CompletionCodeStatus`: `src/domain/playSession.ts`
- 코드 생성기(`generateQrToken`/`generateCompletionCode`/`normalizeCompletionCode`):
  `src/domain/codes.ts` — 0/O, 1/I/L을 뺀 알파벳으로 종이에 인쇄된 QR과 인증번호를
  사람이 잘못 읽지 않게 한다.

### 2단계 — rename (도메인·DB·API·화면)

- 마이그레이션은 **0001을 덧붙이지 않고 0000을 다시 생성**했다. 배포 전(티켓 09 미완료)이고
  실사용 데이터가 없어서 기존 행을 승계하는 코드가 필요 없고, 그 코드가 오히려 오해를 만든다.
  로컬 dev DB(`.data/dev`)는 비우고 재마이그레이션했다.
- `QuestGroup→Case`(`cases`), `Quest→Step`(`steps`), `PlaySession`(`play_sessions`),
  `StepAttempt`(`step_attempts`). `order`는 0부터, `kind`는 INTRO/QR/FINAL/CLOSING.
- `steps`에 `unique(case_id, order)`를 걸었다 — 순서는 CASE 안에서 위치 그 자체라
  같은 순서가 둘이면 잠금 판단이 흔들린다.
- 자식 FK는 모두 `on delete cascade`. 그래서 CASE를 지우면 단계·세션·제출 기록이 함께 사라진다.
- 라우트: `/quest/$questId` → `/t/$qrToken`(참가자), `/admin/groups*` → `/admin/cases*`(관리자).
- `GET /api/steps/qr/:qrToken`은 `reveal`·정답을 담지 않는다(회귀 테스트로 고정).
- `PATCH /api/steps/:id`는 `qrToken`과 `order`를 절대 바꾸지 않는다(요구 23, 회귀 테스트로 고정).

### 아직 안 한 것 (12 이후로 넘김)

- 참가 세션 API와 쿠키(`/api/play/*`) — 엔티티·테이블만 준비됨.
- `reorder`, `getByCaseAndOrder`, `listByCaseInRange`, `StepAttemptRepo.listByCase`.
- `PlaySessionRepo`는 아직 참가 세션을 만들지 않는다(어느 경로도 호출하지 않는다).
- 관리자 화면의 단계 종류 선택·공개 토글·유형별 정답 편집(→ [13](13-admin-case-editor.md)).

## Depends on

없음. 단, 이 티켓의 rename이 12~14에 넓게 영향을 주므로 **12·13과 병행하지 않는다.**
