1. [x] Quest 페이지의 QR 코드를 생성할 수 있다 ([ticket](docs/tickets/01-qr-code-generation.md))
2. [x] Quest 페이지에서 Quest를 풀 수 있다 ([ticket](docs/tickets/02-quest-solving.md))
3. [x] 답을 맞추면 뭔가를 보여준다 ([ticket](docs/tickets/03-show-reward-on-correct-answer.md))
4. [x] Quest를 생성할 수 있다 ([ticket](docs/tickets/04-create-quest.md))
5. [x] Quest를 수정할 수 있다 ([ticket](docs/tickets/05-update-quest.md))
6. [x] Quest 그룹 목록에서 그룹을 선택할 수 있다 ([ticket](docs/tickets/06-select-quest-group.md))
7. [ ] admin 은 passkey로 로그인할 수 있다. ([ticket](docs/tickets/07-admin-login.md) — v1 scope is email+password only, passkey deferred)
8. [x] 실제 데이터베이스에 연결된다 ([ticket](docs/tickets/08-database-connection.md))
9. [x] 배포되서 링크로 진입할 수 있다 ([ticket](docs/tickets/09-deployment.md))

## 책방79-1 QR 미스터리 투어 (CASE/STEP 투어 시스템)

설계: [docs/plans/qr-mystery-tour.md](docs/plans/qr-mystery-tour.md)

10. [x] 업로드 실패 이유와 한도를 안내하고, 큰 이미지는 자동 압축한다 + 그룹을 삭제할 수 있다 ([ticket](docs/tickets/10-hotfix-uploads-and-group-delete.md))
11. [x] CASE/STEP/참가 세션 모델로 데이터 구조를 정리한다 ([ticket](docs/tickets/11-case-step-session-model.md) — 도메인 규칙 + 전체 rename 완료, 세션 API는 12에서)
12. [x] 참가자가 시작 QR부터 사건 종결까지 순차적으로 투어를 진행한다 (서버 잠금·재개 포함) ([ticket](docs/tickets/12-player-tour-flow.md))
13. [x] 관리자가 개발자 없이 CASE를 만들고 STEP을 편집한다 (복제·미리보기·테스트 모드·상태) ([ticket](docs/tickets/13-admin-case-editor.md))
14. [x] CASE별 QR을 인쇄하고 설치를 점검한다 (고정 URL 유지) ([ticket](docs/tickets/14-qr-operations.md))
15. [x] 단서 공개 연출 프리셋과 동영상·효과음을 지원한다 ([ticket](docs/tickets/15-media-and-reveal.md))
16. [x] 완료 인증번호를 발급·리딤하고 참가 통계를 본다 ([ticket](docs/tickets/16-completion-code-and-stats.md) — 16a·16b·16c 완료. 대시보드 "오늘 참가/완료"도 실제 숫자로 연결)

Recommended build order (dependency-driven, not the numbering above):
[08](docs/tickets/08-database-connection.md) → [03](docs/tickets/03-show-reward-on-correct-answer.md) →
[07](docs/tickets/07-admin-login.md) → [06](docs/tickets/06-select-quest-group.md) →
[04](docs/tickets/04-create-quest.md) → [05](docs/tickets/05-update-quest.md) →
[01](docs/tickets/01-qr-code-generation.md) → [09](docs/tickets/09-deployment.md)

Tour build order:
[10](docs/tickets/10-hotfix-uploads-and-group-delete.md) (운영 핫픽스) →
[11](docs/tickets/11-case-step-session-model.md) → [12](docs/tickets/12-player-tour-flow.md) →
[16](docs/tickets/16-completion-code-and-stats.md) 중 인증번호 →
[13](docs/tickets/13-admin-case-editor.md) → [14](docs/tickets/14-qr-operations.md) →
[15](docs/tickets/15-media-and-reveal.md) → [16](docs/tickets/16-completion-code-and-stats.md) 중 통계

Phase 3(15·16)까지 끝났고, 남은 항목은 [07](docs/tickets/07-admin-login.md)(passkey)뿐이다.
passkey는 이메일+비밀번호 로그인이 이미 동작하므로 선택적 잔여 작업이다.

Phase 1(11·12)이 끝나면 체험비를 받고 실제 운영이 가능하고,
Phase 2(13·14)가 끝나면 사장님이 개발자 없이 CASE 02를 만들 수 있다.

## 팔레스타인 QR (식민지역사박물관 × 책방79-1, 2026-10-09)

요청: `docs/asset/REQUEST.md` (자료 폴더는 git ignore)

17. [x] 한도를 넘는 이미지는 버튼 없이 자동으로 압축해서 올린다 (PNG→WebP, JPG는 JPEG 유지) ([ticket](docs/tickets/17-auto-compress-uploads.md))
18. [x] 테마(팔레트·제목/본문 폰트·배경 이미지)를 만들고 CASE에 적용한다 ([ticket](docs/tickets/18-theme-system.md))
19. [ ] 실제 서버에 팔레스타인 CASE와 테마 틀을 만든다 ([ticket](docs/tickets/19-palestine-case.md))

20. [x] QA 피드백 (`docs/asset/QA.md`)
    - 저장된 이미지를 지우면 단계 편집기가 죽던 문제 (media를 선택 값으로)
    - 긴 객관식 보기가 잘리던 문제 (보기 버튼 줄바꿈)
    - 앱 안 카메라로 다음 QR을 바로 찍기 (`QrScanPanel`, 대기 화면)
    - 초기값으로 들어온 이미지의 X가 먹지 않던 문제 — `Controller`의 `field.value`는 값이
      `undefined`로 비워졌을 때 mount 시점 기본값(처음 들어있던 이미지)으로 되돌아와 칸이 그대로
      남았다. 실제 폼 값을 보는 `useWatch` 구독 하나로 갈아끼웠다. (재현·검증: 로컬 PGlite로
      CASE 생성 → 단계 편집 → 저장 → 재오픈 → X)
21. [x] 하다가 찾은 운영 버그
    - SPA 전환(09-15) 뒤 브라우저에서 시작하면 세션 쿠키가 안 생겨 `/play`·`/t`가 "먼저 시작 QR을 찍어주세요"만 보이던 문제
    - 단계 순서 바꾸기가 Postgres에서 (case_id, order) 유일 인덱스에 걸려 500이던 문제
22. [x] 테스트 규칙: `vi.mock`/`vi.fn`/`vi.spyOn`/`vi.stubGlobal` 금지 (oxlint `vitest/no-restricted-vi-methods`).
        가짜는 props로 주입하거나 `fake-aliases.ts`로 연결한다.
23. [x] 여러 CASE를 동시에, 순서와 무관하게 플레이한다 + 프롤로그/에필로그 QR 옵션 + 스탬프판
    - 세션 쿠키를 토큰 여러 개(`tok1,tok2`)로 바꿔 CASE마다 세션이 따로 살아 있는 것처럼 취급한다.
      서버는 요청마다 caseId에 맞는 세션을 고른다(같으면 가장 최근). 다른 CASE 세션은 시작 안내로 풀어준다.
    - CASE 진행 옵션 3개: `freeOrder`(자유 순서), `prologueEnabled`(시작 QR), `epilogueEnabled`(마지막 문지기).
      모두 DB 기본값 true, CASE 상세 환면에서 토글(`PATCH /api/cases/:id/play-options`). 마이그레이션 `0002`.
    - 프롤로그 OFF면 문제 QR 하나를 풀어야 시작, 에필로그 OFF면 문제를 다 풀면 즉시 완주(에필로그는 투어에서 제외).
    - 진행 표시를 점(`ProgressDots`, 삭제) 대신 스탬프판 `StampBoard`로 — 푼 문제 칸에 도장이 찍힌다.
      에필로그는 스탬프판이 아니라 완주 안내로 분리했다.
    - 완주 시 인증번호는 에필로그 ON/OFF와 무관하게 항상 발급한다.

24. [x] 시작 QR을 단계 목록 맨 위에서도 내려받는다
    - 시작 QR은 단계가 아니라 CASE 자산(`/s/{entryToken}`)이라 목록에 없었고, 목록의 사건
      소개·사건 종결이 "QR 없는 단계"로 보여 "시작/에필로그 QR을 어디서 만드나" 문의가 왔다.
    - `StepListItem`의 "QR 없는 단계"·"QR 없음" 표시를 지우고, 목록 맨 위에 `StartQrCard`
      (제목·인쇄 안내·QR/URL 복사)를 항상 둔다. 에필로그로 쓰는 마지막 단서(FINAL)에는
      인쇄 시트처럼 `(에필로그)` 라벨을 붙인다.
    - `StepQrCodeDownload`를 `QrCodeDownload`(path 기반)로 일반화해 시작·단계 QR이 같은
      버튼을 쓴다.

25. [x] 단계 편집 편의 기능
    - [x] 단계 복제 — 복사본은 원본 바로 다음 자리에 생기고 QR 토큰은 새로 발급한다.
          에필로그(FINAL)를 복제하면 일반 문제(QR)가 된다(에필로그는 하나뿐). `POST /steps/:id/duplicate`
    - [x] 드래그로 단계 순서 바꾸기 — `SortableList`(HTML5 DnD, 의존성 없음) + `moveItem`.
          위/아래 버튼은 키보드·터치 사용자를 위해 남긴다.
    - [x] 에필로그로 쓸 단계를 고르고 바꾸기 — 문제 단계의 [에필로그로 지정]. 고른 단계는 FINAL,
          예전 에필로그는 QR로 돌아간다. 순서·QR 토큰은 그대로. `PATCH /cases/:id/epilogue`
    - [x] 시작 QR 화면 문구(제목·한 줄 소개·예상 소요 시간·안내 문구·버튼) 편집 + 오른쪽 미리보기.
          버튼 기본값 "시작하기"(빈 문구는 저장하지 않고 화면이 기본값을 쓴다). 예상 소요 시간 0분이면 줄을 숨긴다.
          참가자 화면과 미리보기가 같은 `StartScreenCard`를 쓴다. `PATCH /cases/:id/start-screen`, 마이그레이션 `0004`.

26. [x] 기기 초기화 페이지(`/reset`)와 그 QR
    - 버그·잘못된 조작으로 기기에 저장된 상태가 꼬여 같은 에러가 반복될 때, QR을 찍거나 링크로 들어가기만
      하면 그 기기의 진행 정보를 지운다(확인 버튼 없음, 여러 번 해도 같음). 실패하면 [다시 시도].
    - 참가 세션 쿠키는 httpOnly라 서버가 만료시킨다(`DELETE /api/play/sessions`). localStorage·sessionStorage·
      Cache Storage·IndexedDB는 `resetDevice`가 비운다. 관리자 로그인(better-auth 쿠키)은 남는다.
    - QR은 CASE 목록 아래 `ResetDeviceQrCard`에서 내려받는다.

27. [ ] QA 피드백 2 (2026-10-08)
    - [x] 완주한 정답 화면(에필로그까지 끝남)은 "다음 단서 찾기" 대신 "완료하기"
    - [x] 단계마다 QR 찾기 화면 문구(제목·안내)를 바꾼다 — 예: 에필로그 "책방지기에게 받아주세요".
          순차 진행·에필로그 차례에만 쓰고, 자유 진행의 "남은 문제 QR"은 기본 문구. `steps.find_screen`(jsonb), 마이그레이션 `0005`.
    - [x] 편집기 라벨 "정답 시 공개할 단서" → "정답 시 공개할 해설" (미리보기 제목도)
    - [x] 단계마다 QR 위치 힌트(`findScreen.hint`)를 적고, 찾기 화면 힌트 칸에 보여준다.
          순차 진행·에필로그는 지금 찾을 QR의 힌트, 자유 진행은 아직 못 푼 문제들의 힌트(이름을 붙여서).
          문제를 풀 때 쓰는 힌트(`hint`, 사용 통계 집계)와는 다르다.
    - [x] QR 01을 풀었는데 진행 화면이 또 "QR 01 차례"라고 하던 문제.
          재현: 진행 화면 → 앱 안 카메라로 QR 01 → 30초 안에 정답 → [다음 단서 찾기].
          원인: 정답을 맞혀도 진행 캐시를 무효화하지 않아, `/play` 로더가 캐시(기본 30초)의 옛 진행을 그대로 썼다.
          정답 제출(`submitPlayAnswer`)·시작 QR에서 진행 캐시를 무효화하고, 로더는 무효화를 무시하는 `"static"`을 뺀다.
    - [x] 길게 쓰는 칸은 여러 줄 입력(`SimpleTextarea`, 쓰는 만큼 늘어남): 본문·문제·보기·해설·찾기 화면 안내·QR 위치 힌트.
          `textarea` 레시피는 input과 같은 모양(`inputVariants`)을 쓴다.
    - [x] 미리보기와 실제 화면 맞추기 — 미리보기가 참가자 카드(`StepCardView`)를 그대로 쓴다.
          힌트는 [힌트 보기]를 눌러야 열리고, 보기는 참가자와 같은 버튼(눌리지 않음), 해설 아래 [다음 단서 찾기].
          관리자가 쓴 글(본문·문제·보기·힌트·해설·사건 소개·종결)은 줄바꿈을 그대로 보여준다(`white-space: pre-line`).

남은 일 / 새로 발견한 것:

- [x] Panda v2 업그레이드 마이그레이션 (Vercel `bun run build` 46 MISSING_EXPORT 복구)
  - v2는 v1과 달리 preset을 자동으로 추가하지 않는다. presets에 `@pandacss/preset-base`와
    `@pandacss/preset-panda`(기본 breakpoints·토큰)를 명시해야 `styled-system/jsx`에
    VStack/Flex/Grid 패턴 컴포넌트가 생성된다. preset 누락 시 radii.sm 토큰 missing,
    `unknown_condition` 경고가 함께 난다.
  - v1은 `.mjs`를, v2는 `.js`를 쓰고 v2는 더 이상 만들지 않는 파일을 지우지 않는다.
    Vite는 `index.mjs`를 먼저 해석하므로 로컬의 옛 `.mjs` 잔재가 새 코드보다 우선해
    로컬 빌드만 우연히 통과하고 Vercel(매번 클린 설치)에서만 깨졌다. → `panda codegen --clean`
    (prepare 스크립트에도 --clean 추가, Vercel build cache 대비).
  - `createStyleContext`는 v2에서 제거 → 9개 UI 컴포넌트를 `createSlotRecipeContext`로 교체.
  - defineSlotRecipe로 정의한 레시피(card·table 등 9개)를 `recipes`가 아니라
    `slotRecipes`에 등록해야 slots/base가 포함된 cva 대신 sva로 생성된다.
  - checkbox `solid` variant에 `control.control` 중복 중첩이 있었고, control 스타일이
    CSS에 안 나오던 버그를 함께 수정. `RecipeConfig` 타입은 v2에서 제거 → input도 defineRecipe로.
  - 검증: 클린 설치 시뮬레이션(`rm -rf styled-system && prepare && build`) 통과,
    codegen 경고 0건, typecheck/lint 통과.

- [ ] CASE 기본 정보(썸네일·사건 소개·번호 등) 수정 폼 — 제목·한 줄 소개는 시작 화면 편집(25)에서 고친다.
      `PATCH /cases/:id`는 전체 교체다.
- [ ] 시작 화면 미리보기에 CASE 테마(팔레트·폰트·배경)를 입히기 — 지금은 기본 모습으로만 보인다.
- [ ] 드래그 정렬은 HTML5 DnD라 휴대폰 터치로는 끌 수 없다(위/아래 버튼으로 대신). 관리자가 휴대폰으로 편집하면 다시 본다.
- [x] 전체 테스트를 한 번에 돌리면 PGlite DB 테스트가 가끔 실패한다 — 부하에서 첫 테스트가 5초를 넘었다. 서버 테스트 제한 시간 15초.
- [ ] 위 문제가 다시 난다(2026-10-06): 전체 실행 시 각 DB 테스트 파일의 첫 테스트가 ~19초로 15초를 넘는다.
      파일만 따로 돌리면 통과한다. 테스트 DB 생성(마이그레이션)을 파일 간에 공유하거나 server 프로젝트 동시성을 낮추는 방안 검토.
- [ ] 꺼 둔 lint 규칙 켜기: `vitest/no-conditional-expect`(9곳), `vitest/require-to-throw-message`(6곳).
- [ ] 휴대폰 실기기에서 앱 안 카메라 확인 (iOS Safari는 BarcodeDetector가 없어 ZXing wasm을 CDN에서 받는다).
