# 15. 미디어와 공개 연출 (두루마리·영상·효과음)

Status: 완료 (2026-09-15 재작업). 공개 연출 6종. 처음엔 recipe에 프리셋이 다 있어도 실제로
동작한 건 `FADE_UP` 하나였고(아래 "회귀"), 고친 뒤에도 카드 위에서 글자만 움직여 연출로
안 보이고 사진은 연출에 전혀 참여하지 않았다(아래 "연출은 카드 하나에 건다"). 지금은
연출이 카드 한 덩어리에 걸리고, 6종 전부 컴파일된 CSS와 `getComputedStyle().animationName`,
접힘/펼침 상호작용까지 테스트로 확인한다. 동영상 업로드(mp4 25MB, 이미지와 별도
한도·압축 없음), 효과음 3종(WebAudio 합성, 기본 꺼짐, sessionStorage에 기억) 모두 구현.
관리자 편집기에 정답 유형 버튼과 같은 패턴으로 프리셋/효과음 선택 + 미리듣기를 붙였다.

### 회귀: 정적 추출과 캐스케이드 (2026-09-15)

Storybook에서 `FADE_UP`만 움직였다. 원인 두 가지 모두 Panda 쪽 규칙이었고,
컴파일된 CSS를 보지 않으면 알아채기 어려운 종류였다.

- **variant가 CSS로 안 나왔다.** `revealAnimation({ preset: state.reveal.preset })`처럼 프리셋이
  런타임 값이면 Panda는 어떤 variant가 쓰이는지 알 수 없어 CSS를 만들지 않는다. 클래스 이름은
  그대로 붙기 때문에 화면상으로는 적용된 것처럼 보인다. 폴백 리터럴 `?? "FADE_UP"` 하나만
  추출돼 `--preset_FADE_UP` 규칙만 생성된 것이 이 증상의 정체다.
  → 레시피에 `staticCss: [{ preset: ["*"] }]`를 달아 5종을 전부 생성한다
  ([Static CSS Generator](https://panda-css.com/docs/guides/static)의 "런타임 props로 variant를
  고를 때" 사용법).
- **reduced-motion 규칙이 variant에 밀렸다.** base의 `_motionReduce`와 variant의 `animation`은
  명시도가 같고(클래스 1개) variant가 소스에서 뒤에 나와 이긴다. 즉 연출이 꺼지지 않았다.
  → variant는 `--reveal-animation` 변수만 정하고, `animation: var(--reveal-animation, none)`은
  base가 갖는다. 이제 reduced-motion 규칙과 충돌하는 `animation` 선언이 variant에 없으므로
  정보 손실 없이 즉시 표시된다(spinner 레시피와 같은 변수 방식).

테스트는 클래스 이름이 아니라 **계산된 애니메이션 이름**을 본다 — 클래스만 붙고 CSS가 비는
회귀는 그렇게만 잡힌다. reduced-motion은 `matchMedia` 목킹으로는 안 바뀌므로 Chromium의
`Emulation.setEmulatedMedia`를 쓴다.
Phase 3 (12 직후에 일부만 먼저 해도 된다).
PLAN.md item: 15
상위 설계: [../plans/qr-mystery-tour.md](../plans/qr-mystery-tour.md) §8

## Why

대화에서 나온 아이디어: 텍스트만 넣는 애니메이션 템플릿, 두루마리 펴짐,
TV 화면에 영상처럼 텍스트가 나오는 연출, 효과음, 이모티콘, 동영상(MP4) 삽입.
기준은 "만드는 비용 대비 현장에서의 체감"이다.

- 영상 파일을 매번 만드는 방식은 콘텐츠 수정마다 영상 재제작이 필요해 요구 23번 정신과 어긋난다.
  → **텍스트는 CSS 연출로 처리**하고, 영상은 "꼭 영상이어야 하는 것"에만 쓴다.
- 효과음은 라이선스가 안전한 내장 사운드 몇 개로 시작하되, **기본 꺼짐**으로 둔다.
  조용한 서점에서 갑자기 소리가 나면 안 된다.

## Scope

### 미디어

- `Step.media`는 이미지 또는 동영상을 담는다. `Reveal.media`도 동일.
  - 이미지: jpg/png/webp/gif, 자동 압축([10](10-hotfix-uploads-and-group-delete.md) 재사용).
  - 동영상: mp4(H.264 권장), 상한 기본 25MB(`UPLOAD_MAX_VIDEO_BYTES`), 길이 30초 권장 안내.
    재생은 `playsInline` + `controls` 없음 + `poster` 필수, 자동재생은 음소거 상태에서만.
  - 동영상이 한도를 넘으면 압축 대신 "권장 길이/용량" 안내를 보여준다(브라우저 압축은 품질 손실이 큼).
  - 움직이는 GIF는 WebP/MP4로 대체 권장.
- 미디어에는 항상 `alt`를 저장한다(요구서에는 없지만 접근성·SEO·로딩 실패 대비).

### 공개 연출 프리셋

6종을 Panda `keyframes` + 레시피 variant로 구현한다(계획 §8).

| 프리셋        | 느낌                                 | 비고                                       |
| ------------- | ------------------------------------ | ------------------------------------------ |
| `FADE_UP`     | 차분하게 떠오름                      | 기본값                                     |
| `UNROLL`      | 두루마리가 말려 풀리며 카드가 펴짐   | clip-path + 말린 자리의 그늘이 따라 내려옴 |
| `TYPEWRITER`  | 카드가 왼쪽에서 한 칸씩 드러남       | 긴 본문에는 권장하지 않음(1초 규칙)        |
| `TV_SCAN`     | 브라운관 스캔라인과 함께 표시        | "TV 화면에 텍스트가 나온다" 아이디어       |
| `GLITCH`      | 순간적으로 어긋남                    | 미스터리 강조, 남용 금지                   |
| `CARD_UNFOLD` | 반으로 접힌 카드가 펼쳐짐(클릭/자동) | 3D 접힘(`rotateX` + 원근), 종이 뚜껑       |

- `src/theme/keyframes.ts` + `src/theme/recipes/`에 추가한다(새 CSS 라이브러리 도입 없음).
- 관리자 편집기에는 프리셋 드롭다운 + 미리보기 [다시 보기] 버튼.
- **`prefers-reduced-motion`이면 연출을 생략하고 즉시 표시한다.** 연출은 장식이므로
  정보 손실이 0이어야 하고, 이 규칙은 테스트로 고정한다.

#### 연출은 카드 하나에 건다 (2026-09-15 재작업)

처음에는 `Card.Title`(문구)에만 클래스를 붙였다. 그래서 ① 카드 안의 사진은 연출에
전혀 참여하지 않았고, ② 정지한 카드 위에서 글자만 움직여 "배경 위 텍스트 효과"처럼
보였다. 지금은 `RevealPanel`이 카드 전체에 클래스를 붙이므로 사진과 문구가 한 덩어리로
움직이고, 미디어에는 `--reveal-media-animation`(살짝 당겨지며 자리 잡기)이 따로 걸린다.

- `UNROLL`은 클립으로만 열리는 게 아니라, 풀리는 경계를 따라 말린 자리의 그늘이
  내려온다(`::before` + `reveal-curl`).
- `CARD_UNFOLD`는 반으로 접힌 카드다. 접힘선(카드 중앙)을 축으로 아래 절반(뚜껑)이
  `rotateX(180deg)`만큼 젖혀져 위 절반을 덮고(`::after`, 종이 색 + 접힘 그늘), 펼칠 때
  되돌아 눕는다. 원근(`perspective: 900px`)이 있어야 각도가 보인다.
  - **접힌 카드는 눌러서 펼친다.** 접힌 절반을 덮는 `<button>단서 펼치기</button>`가
    실제 조작 요소다(키보드로도 열린다). 카드 레이아웃은 접혀 있어도 원래 높이를
    유지하므로 펼칠 때 아래 버튼이 튀지 않는다.
  - **누르지 않아도 `AUTO_UNFOLD_MS`(900ms) 뒤 스스로 펼쳐진다.** 단서를 클릭 뒤에
    가두면 참가자가 멈춘다. 클릭은 기다리지 않고 먼저 펼쳐보는 선택지다.
- 연출(애니메이션·접힘·말림)은 전부 `_motionSafe` 안에서만 **만들어진다**. 이전처럼
  reduced-motion에서 `animation: none`으로 덮는 방식은 variant와 명시도가 같아
  순서에 따라 지는 싸움이었다 — 이제는 연출 자체가 없으므로 이길 싸움도 없다.
  reduced-motion 사용자는 접힌 카드도, 클릭도, 기다림도 없이 단서를 바로 본다.
- Storybook: `Domains/RevealPanel`에 프리셋별 스토리 + 사진 + [다시 보기](key를 바꿔
  다시 마운트). 사진 없이 오는 단서도 확인할 수 있다(`WithoutMedia`).

### 효과음

- 내장 사운드 2~3개(예: 종이 펴지는 소리, 낮은 확성기 톤). WebAudio로 재생해 파일을 만들지 않는다.
- **기본 꺼짐.** 화면 구석에 작은 스피커 배지로 켜고 끄며, 선택은 세션에 저장한다.
- 첫 사용자 제스처(버튼 클릭) 이후에만 재생한다 — 브라우저 자동재생 정책.
- 관리자는 단계별로 사운드를 고르거나 없음으로 둘 수 있다.

### 이모지

- 별도 작업 없음. 콘텐츠 텍스트에 그대로 사용한다(미리보기에서 렌더 확인).

## 테스트 (RED 먼저)

- domain: `revealPreset` 유효값 검증, `media` 판별(이미지/동영상), 동영상 메타 검증 함수.
- browser(siheom) — `src/components/domains/step-experience.test.tsx`
  - 6개 프리셋이 각각 카드 하나에 자기 keyframes(`animation-name`)로 걸린다
  - 카드 안의 사진도 연출을 받는다(`img`의 `animation-name`)
  - `prefers-reduced-motion` 에뮬레이션 시 연출도 접힘도 없다(`animation-name`/`clip-path`가
    `none`, `opacity`는 1) — 접힌 카드도 그냥 펼쳐져 있다
  - `CARD_UNFOLD`는 접힌 채로 나오고, 누르면 펼쳐지며, 누르지 않아도 스스로 펼쳐진다
  - 효과음 기본 상태에서 오디오가 재생되지 않는다(스파이로 확인)
  - 토글 후에만 재생되고, 토글 상태가 유지된다
  - 동영상 요소에 `playsInline`과 `poster`가 있다
- Storybook: `Domains/RevealPanel`에 프리셋 6종(사진 포함) + 사진 없는 단서 + [다시 보기],
  `Domains/StepExperience`에 프리셋별 정답 화면(사진 포함), 동영상 단계, 연출 끄기 상태.
- `src/application/uploadService.test.ts` 확장: 동영상 한도/형식, 이미지 규칙과의 분리.

## Explicitly deferred

- TTS/음성 내레이션(fish.audio 등 외부 API) — 비용·한국어 품질 편차. 연출과 효과음으로 먼저 검증한다.
- 커스텀 사운드 업로드, BGM 루프, Lottie/After Effects 연동.
- 영상 자막 트랙, 영상 편집.
- **연출을 하나씩 더 다듬기(사용자와 합의).** 남은 후보와 참고 자료:
  - `RIPPLE`(동그랗게 번지며 드러남 — `clip-path: circle()`), `PEEL`(모서리가 들려
    벗겨짐), `FLIP`(카드가 `rotateY`로 뒤집히며 단서가 나옴), `MAGNIFY`(렌즈처럼 확대).
    [canvasui](https://canvasui.dev/docs/components/ripple)·[flip gallery](https://www.originkit.dev/components/flip-gallery)는
    캔버스로 화면을 다시 그리는 방식이라 그대로 가져올 수 없다 — 효과만 참고해 CSS로 다시 짠다.
  - `FADE_UP`/`TYPEWRITER`/`TV_SCAN`/`GLITCH`도 아직 자기 자리를 못 찾았다(카드 전체가
    아니라 문구에 걸맞는 연출일 수 있다). 지금은 이전 정의를 카드 크기로 옮겨 둔 상태다.
- **효과음을 [uisfx](https://uisfx.com/)로 교체.** `uisfx` npm(0.4.0, MIT)이 WebAudio로
  소리를 합성하므로 파일을 저장소에 넣지 않는다 — 지금 방식(합성, 기본 꺼짐)을 그대로
  두고 소리만 좋아진다. 사운드는 CC0다.

## Acceptance criteria

- 관리자가 프리셋만 고르면 별도 파일 없이 연출이 적용된다.
- 텍스트가 1초 이내에 읽을 수 있게 표시되고, reduced-motion에서는 즉시 표시된다.
  - 예외: `CARD_UNFOLD`는 참가자가 먼저 펼쳐보는 연출이라 문구가 다 드러나는 시점이
    자동 펼침(900ms) + 연출(680ms) 뒤다. 연출 중에도 문구가 부분적으로 읽히긴 하지만,
    "누르면 즉시"가 기본 동작이라는 점이 이 규칙과의 타협점이다.
- 효과음은 기본적으로 나지 않으며, 원할 때만 켤 수 있다.
- 25MB 이하 MP4를 단계 미디어로 올려 참가자 화면에서 재생할 수 있다.

## Depends on

[11](11-case-step-session-model.md). 업로드 검증·압축은 [10](10-hotfix-uploads-and-group-delete.md)를
재사용한다. 편집기 UI는 [13](13-admin-case-editor.md) 13-4에 붙는다.
