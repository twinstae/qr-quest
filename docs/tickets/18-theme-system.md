# 18. 테마 시스템

Status: Done. 실제 dev 서버(임시 PGlite)에서 Playwright로 테마 생성(9.3MB PNG 배경 → 1.5MB WebP
자동 압축) → CASE에 적용 → 참가자 시작 화면 → 삭제 경고까지 확인했다.
PLAN.md item: 18

## Why

CASE마다 분위기가 다르다. 팔레스타인 CASE는 팔레스타인다운 색·글꼴·배경으로 보여야 한다.
지금은 모든 CASE가 같은 모습이다.

## 결정 (grilling 2026-10-01)

- 테마 = 이름 + 팔레트(프리셋) + 제목 폰트 + 본문 폰트(프리셋) + 배경 이미지(선택) +
  배경 어둡게 덮기(0~80%).
  - 팔레트는 빌드에 들어있는 Radix 색 중 고른다. 자유 HEX는 받지 않는다 — 대비가 깨진다.
  - 폰트는 한글 Google Fonts 프리셋 목록에서 고르고, 선택된 폰트만 불러온다.
- 적용 범위: **참가자 화면만** (/s, /t, /play — 공개 연출·완주 화면 포함).
  관리자 화면·QR 인쇄 시트는 기본 모습. 테마 없는 CASE는 지금 모습 그대로.
- 배경: 화면 전체 cover + 어둡게 덮기, 본문은 반투명 카드 위에.
- 관리 페이지(`/admin/themes`): 미리보기가 붙은 앨범형 목록, 추가/수정 폼(실시간 미리보기),
  삭제. 미리보기는 고정 샘플 문제 화면(질문·보기 3개·버튼).
- CASE 편집 폼에서 테마를 고른다 (`cases.theme_id`, nullable).
- 삭제: 쓰는 CASE가 있으면 확인 창에 CASE 번호·제목·상태를 나열하고
  "테마 없음으로 바뀝니다"를 경고한다. LIVE여도 허용 (FK `on delete set null`).
- 마이그레이션은 테이블·nullable 컬럼 추가만 — 이전 코드와 호환.

## What was built

- 도메인 `src/domain/theme.ts` — 팔레트·폰트 프리셋, `googleFontsHref`, `fontStack`,
  `describeThemeDeletion`(삭제 경고 문구).
- 저장소 — `themes` 테이블 + `cases.theme_id`(on delete set null), 마이그레이션 `0001_themes.sql`,
  `DrizzleThemeRepo`, `FakeThemeRepo`.
- 서비스 `src/application/themeService.ts` — 목록(사용 중인 CASE 포함), 생성·수정·삭제(쓰던 CASE는
  테마 없음으로), `setCaseTheme`, 참가자용 `getThemeForCase`.
- API — `GET/POST /api/themes`, `GET/PATCH/DELETE /api/themes/:id`, `PATCH /api/cases/:id/theme`
  (인증), `GET /api/play/cases/:caseId/theme`(공개, `{ theme | null }`).
- 화면
  - `ThemedScreen` — 팔레트 클래스 + 폰트 CSS 변수 + 고정 배경(바탕색으로 흐리게) + 카드 반투명.
  - `ThemePreview` — 휴대폰 틀 안의 고정 샘플 문제 화면.
  - `ThemeEditorForm`/`ThemeFormDialog` — 실시간 미리보기, 폰트 보기는 그 폰트로 그린다.
  - `/admin/themes` 앨범(`ThemeCard`), CASE 화면의 `CaseThemePicker`(고르면 바로 저장, 실패 시 되돌림).
  - `/s`, `/t`, `/play`는 `CaseThemedScreen`으로 감싸고 loader에서 테마를 미리 받는다.

## 구현하며 알게 된 것

- **폰트 `<link>`에 `precedence`를 주면 안 된다.** React 19는 이를 suspensey 리소스로 보고 CSS가 올 때까지
  커밋을 멈춘다. 폰트를 고르자 다이얼로그가 굳어 업로드가 동작하지 않았다(Playwright로 재현).
  평범한 stylesheet 링크 + `display=swap`이면 글자는 먼저 보이고 폰트는 나중에 바뀐다.
- **어둡게가 아니라 바탕색으로 흐리게 덮는다.** 카드 밖 안내 문구는 라이트 모드에서 어두운 글자라
  검은 덮개 위에서는 읽히지 않는다. 필드 이름은 `backgroundDim`, 화면 문구는 "배경 흐리게(%)".
- Radix `olive`는 회녹색 무채색 계열이라 "올리브 그레이"로 표시한다.
- Panda는 빌드 때 클래스를 뽑으므로 팔레트마다 정적인 `css({ colorPalette })` 호출을 둔다.
- 미리보기 틀에 `transform`을 주면 `position: fixed` 배경이 화면이 아니라 틀에 붙는다.
- CASE 필드 수정 폼이 아직 없다(생성만 있음). 테마는 전용 엔드포인트로 따로 바꾼다 —
  `PATCH /cases/:id`는 전체 교체라 썸네일 등을 함께 보내지 않으면 지워진다.
