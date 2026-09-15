# 16. 완료 인증번호와 참가 통계

Status: 완료. 16a(인증번호 발급·재표시·리딤), 16b(리딤 화면), 16c(통계 화면) 모두 구현.
실제 dev DB(PGLite)에 대고 시작 QR → INTRO → QR 01 → … → FINAL 정답 → 인증번호 발급 →
4글자 리딤(200) → 같은 코드 재리딤(409) → 통계(today)까지 실제 서버로 확인했다.
PLAN.md item: 16
상위 설계: [../plans/qr-mystery-tour.md](../plans/qr-mystery-tour.md) §5, §6

## What was built

- 도메인
  - `src/domain/tourStats.ts` — 세션·시도 원자료를 케이스 통계로 접는 순수 함수
    (`summarizeCaseStats`), 단계별 조언 문구(`adviseForStep`), 책방 기준(KST) 기간 계산
    (`startOfDayIso`/`periodSinceIso`), 소요 시간(`elapsedMinutes`).
  - `src/domain/codes.ts` — 직원이 뒤 네 글자만 입력해도 같은 코드로 보게
    `normalizeCompletionCode`가 접두사를 채운다.
  - `src/domain/playSession.ts` — `CompletionCodeStatus`를 리딤 화면이 그대로 쓸 수 있는 모양으로 확장.
- 애플리케이션
  - `src/application/redeemService.ts` — 정규화 → 형식 확인 → 코드 조회 → 테스트 세션 거부 →
    이미 사용됨 거부 → `redeemedAt` 기록(한 번만) → 그 CASE와 오늘 순번을 함께 돌려준다.
  - `src/application/statsService.ts` — 기간 필터·테스트 세션 제외한 뒤 도메인 집계에 넘긴다.
  - `src/application/playService.ts` — 완료 화면용 `elapsedMinutes`·`hintCount`를 COMPLETED 응답에 추가.
- 저장소 (`src/persistence/types.ts`, `FakePlaySessionRepo.ts`, `DrizzlePlaySessionRepo.ts`,
  `DrizzlePlaySessionRepo.test.ts`)
  - `PlaySessionRepo.getByCompletionCode`, `countRedeemedSince`, `countStartedSince`,
    `countCompletedSince`, `StepAttemptRepo.listBySessionIds`.
- API (`src/api/elysia/redeemRoutes.ts`, `statsRoutes.ts`, `redeemRoutes.test.ts`,
  `statsRoutes.test.ts`)
  - `POST /api/redeem` (인증 필요) — 200 VALID / 403 TEST_SESSION / 404 UNKNOWN /
    409 ALREADY_REDEEMED.
  - `GET /api/cases/:id/stats?period=today|week|all` (인증 필요).
  - `GET /api/stats/today` (인증 필요) — 관리자 첫 화면의 오늘 참가/완료.
- 화면
  - `src/components/domains/completion-screen.tsx` — 인증번호를 화면에서 가장 큰 글자로,
    그 아래 소요 시간·힌트 횟수, 맨 아래 직원 안내 문구.
  - `src/components/domains/redeem-panel.tsx` + `/admin/redeem` — 입력창 하나, 결과 한 줄,
    [리워드 전달 완료]로 다음 참가자를 받는다.
  - `src/components/domains/case-stats-panel.tsx` + `/admin/cases/$caseId/stats` — 기간 필터,
    요약 4개, 가장 어려운 단계/힌트를 많이 쓴 단계, 단계별 표(도달·이탈·첫 시도 정답률·힌트).
    기간은 주소(`?period=`)에 담는다.
  - `src/lib/format-time.ts` — 화면에 보이는 시각은 항상 KST.
  - 목록 카드·상세 헤더에서 통계/리딤으로 가는 링크, `DashboardSummary`의 오늘 참가·완료를
    실제 숫자로 연결(그전까지 `-`로 비어 있던 자리).

## 이 티켓에서 계획과 다르게 한 것

1. `src/domain/completionCode.test.ts`를 새로 만들지 않고 `codes.ts`/`codes.test.ts`를 확장했다 —
   코드 생성·정규화 규칙은 이미 그 파일 하나에 모여 있고, 같은 규칙을 두 파일로 나누면
   둘이 어긋날 때 어느 쪽이 진실인지 알 수 없다.
2. 집계를 SQL로 하지 않고 도메인 순수 함수로 했다(티켓의 "집계 SQL, 인덱스 사용" 항목).
   CASE당 세션이 수백 건 규모라 저장소는 원자료만 돌려주고 계산은 테스트가 싼 순수 함수가 한다.
   CASE당 세션이 1만 건을 넘으면 그때 SQL 집계로 옮긴다(그 전에는 인덱스도 의미가 없다).
3. 리딤 입력은 숫자 키패드가 아니라 큰 단일 입력창 + 휴대폰 키보드다. 코드 뒤 네 글자에는
   알파벳이 들어가므로(혼동 글자 O/0·I/1·L을 뺀 2~~9·A~~Z) 숫자 키패드만으로는 입력할 수 없고,
   32자 키패드는 오히려 느리다. 대신 "뒤 네 글자만 입력하면 접두사를 서버가 채운다"로 속도를 냈다.
4. 리딤 판정을 상태 코드로도 구분하되 화면은 `kind`만 본다(누락/형식 오류 = 404, 테스트 세션 = 403,
   중복 = 409). 직원 화면에서 상태 코드와 문구가 어긋날 여지를 없앤다.
5. 완료 화면의 "인증번호가 가장 큰 글자"는 다른 텍스트와 **computed font-size를 비교**해 고정했다.
   role/순서만 보면 "가장 크다"는 요구가 검증되지 않는다(참가자 화면이라 눈으로 읽히는 크기가 곧 기능).
6. 통계의 기간 필터는 세션의 **시작 시각** 기준이다. 완료 시각으로 나누면 자정을 넘긴 한 사람이
   두 기간에 걸쳐 완료율이 두 번 계산된다.
7. 단계 표에서 종결(CLOSING) 단계는 뺐다 — 통과할 문제가 없어 이탈률이 의미 없다.

## Verified

- `bun run test run` 380개 통과(서버 265 + 브라우저 115), `bun run lint`, `bun run typecheck` 통과.
- 실제 서버(`bun run dev` + dev PGLite DB): 시작 QR → 단계 통과(힌트 1회) → FINAL 정답 →
  `79-1-XXXX` 발급 → 뒤 네 글자 소문자 입력으로 리딤 200({오늘 1번째}) → 재리딤 409
  (최초 `redeemedAt` 그대로) → `/api/cases/:id/stats?period=today` 200.
- 관리자 아님(`/api/redeem` 401), `/admin/redeem`·`/admin/cases/:id/stats`는 로그인 없이 307로
  `/admin/login`으로 보내진다.

## Why

참가자는 완주하면 오프라인 리워드를 받는다(요구서 §13~14). 직원이 1초에 확인할 수 있어야
하고, 같은 화면을 두 번 보여줘서 두 번 받아가는 일은 없어야 한다.
동시에 사장님은 "몇 명이 시작했고 몇 명이 끝냈는지, 어느 문제에서 막히는지"를 알아야
난이도를 조정할 수 있다(요구 24).

## Mini-tickets

1. **16a 완료 인증번호** ✅ — `79-1-XXXX` 발급(혼동 문자 제외), 완료 화면 표시, 재진입 시 재표시.
   [12](12-player-tour-flow.md)에서 발급까지 하고 이 티켓에서 리딤까지 완성한다.
2. **16b 리딤 화면** ✅ — `/admin/redeem` (직원용, 인증 필요, 모바일 우선).
   코드 입력 → 즉시 판정:
   - ✅ `사건 01 · 오후 3:12 완료 · 오늘 3번째` + [리워드 전달 완료]
   - ⚠️ `이미 사용된 코드입니다 (오후 3:40 처리)`
   - ❌ `일치하는 코드가 없습니다`
     4자리만 입력하고 나머지는 서버가 채우는 입력 보조(직원이 오타 없이 빠르게).
3. **16c 통계 화면** ✅ — `/admin/cases/$caseId/stats`
   - 총 시작 세션 / 완료 / 미완료 / 완료율
   - 평균 플레이 시간 (24시간을 넘긴 세션은 평균에서 제외 — 중간에 그만둔 세션 왜곡 방지)
   - 단계별 도달 수·이탈률·정답률, 단계별 힌트 사용 횟수
   - "가장 많이 틀린 단계", "힌트를 가장 많이 쓴 단계"
   - 기간 필터: 오늘 / 최근 7일 / 전체. 테스트 세션은 항상 제외.

## 화면 원칙

- 완료 화면(참가자): 케이스명 → `CASE CLOSED` → **인증번호를 화면에서 가장 큰 글자로** →
  소요 시간·힌트 횟수 → "직원에게 이 화면을 보여주세요". 어두운 배경에서 대비가 확보되어야 한다.
- 리딤 화면(직원): 큰 숫자 키패드와 단일 입력창. 스캔 없이 4글자 입력 → 결과 1줄.
- 통계(사장님): 표와 숫자 중심, 그래프 라이브러리는 도입하지 않는다(막대는 div로 충분).
  각 숫자 옆에 "그래서 무엇을 하면 되는지"를 한 줄로 붙인다
  (예: `QR 03 정답률 41% — 힌트를 조금 더 친절하게 바꿔보세요`).

## 테스트 (RED 먼저)

- `src/domain/completionCode.test.ts` — 형식 `79-1-XXXX`, 혼동 문자 제외, 대소문자 무시 비교,
  재발급 금지(세션당 1개).
- `src/application/playService.test.ts` 확장 — FINAL 정답 시 1회만 발급, 재진입 시 동일 코드.
- `src/application/redeemService.test.ts`
  - 유효 코드 → 사용 처리 + `redeemedAt` 기록
  - 이미 사용된 코드 → 거부 + 최초 사용 시각 반환
  - 없는 코드 → 거부
  - 테스트 모드 세션의 코드는 리딤되지 않는다
- `src/application/statsService.test.ts`
  - 픽스처 세션 5개(완료 3, 중도 이탈 1, 24시간 초과 1)로 완료율·평균 시간·단계별 이탈 정확성
  - 오답 여러 번 제출한 세션의 단계별 정답률(첫 시도 정답률과 총 시도 정답률 구분)
  - 힌트 사용 횟수 집계, 테스트 세션 제외
  - 세션이 0개일 때 0으로 나누기 없이 표시 가능한 값 반환
- `src/persistence/drizzle/DrizzlePlaySessionRepo.test.ts` — 집계 SQL, 기간 필터, 인덱스 사용.
- `src/api/elysia/redeemRoutes.test.ts` — 인증 필요, 중복 리딤 409, 없는 코드 404.
- 브라우저 테스트(siheom)
  - 완료 화면에서 인증번호가 가장 큰 요소다(스타일 검증 대신 role/순서로 확인)
  - 리딤 화면의 3가지 결과 표시
  - 통계 화면이 세션 0개일 때 빈 상태를 보여주고 깨지지 않는다

## Explicitly deferred (그대로)

- SQL 집계·인덱스 추가 — CASE당 세션이 수천 건을 넘을 때.
- 리딤 취소/되돌리기, 리워드 재고 관리, 참가자별 리워드 이력 조회, CSV 내보내기.
- 실시간 대시보드(폴링), 알림/슬랙 연동.
- 그래프 라이브러리 도입, 비교 통계(CASE 간 벤치마크).

## Acceptance criteria

- 완주 화면에 4자리 인증번호가 크게 표시되고, 재진입해도 같은 번호가 나온다.
- 직원이 4자리를 입력하면 유효/이미 사용/없음을 즉시 구분할 수 있다.
- 같은 코드로 리워드를 두 번 받을 수 없다.
- 사장님이 CASE별 완료율·평균 시간·가장 어려운 단계를 한 화면에서 확인할 수 있다.
- 중간에 그만둔 세션 때문에 평균 시간이 왜곡되지 않는다.

## Depends on

[12](12-player-tour-flow.md)(세션·완료), [11](11-case-step-session-model.md)(기록 테이블).
