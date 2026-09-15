import { defineRecipe } from "@pandacss/dev";

// 강한 ease-out — 기본 CSS ease-out은 진입 연출에 너무 약하다.
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

// 종이가 접히는 자리. 검은 그림자를 토큰으로 만들 만큼 대단한 값은 아니라 raw로 둔다.
const CREASE_LIGHT = "linear-gradient(to bottom, rgb(0 0 0 / 0.07), rgb(0 0 0 / 0) 45%)";
const CURL_SHADOW = "linear-gradient(to bottom, rgb(0 0 0 / 0), rgb(0 0 0 / 0.16))";

/**
 * 단서 공개 연출 프리셋(요구, ticket 15). 카드 하나에 걸린다 — 카드 안의 사진과 문구가
 * 함께 움직여야 "단서가 나온다"로 읽히고, 정지한 카드 위에서 글자만 움직이면 장식으로
 * 보인다. 정답을 맞힌 뒤 1초 규칙 안에서 legible해야 하므로 대부분 700ms 안에 끝난다
 * (TV_SCAN만 2초 동안 깜빡이며 서서히 밝아진다 — 이 프리셋도 자기 차례에 다시 볼 것).
 *
 * prefers-reduced-motion에서는 연출이 장식이 아니라 정보라서 "부드럽게 줄이기"가 아니라
 * 완전히 끈다 — 이 컴포넌트는 단서를 읽어야만 다음 단계로 넘어갈 수 있다. 그래서
 * 연출(애니메이션·접힘·말림)은 전부 `_motionSafe` 안에서만 만들어진다. reduced-motion
 * 사용자는 접힌 카드도, 클릭도, 기다림도 없이 단서를 바로 본다.
 */
export const revealAnimation = defineRecipe({
  className: "revealAnimation",
  // 프리셋은 관리자가 편집기에서 고른 값이 state로 들어온다 — 빌드 타임에 무엇이 쓰일지
  // 알 수 없다. Panda는 정적으로 쓰인 variant만 CSS로 뽑으므로, 그냥 두면 폴백에 적힌
  // FADE_UP만 CSS가 나오고 나머지는 클래스만 붙은 빈 껍데기가 된다.
  // 그래서 6종을 전부 미리 생성한다(https://panda-css.com/docs/guides/static).
  staticCss: [{ preset: ["*"] }],
  base: {
    // 연출이 없는 기본 상태 = 그냥 카드. reduced-motion이 떨어지는 자리이기도 하다.
    "&::before, &::after": {
      content: '""',
      display: "none",
      position: "absolute",
      pointerEvents: "none",
    },
    _motionSafe: {
      "&::before, &::after": { display: "block" },
      // 연출 중인 카드. 어떤 연출인지는 variant가 CSS 변수로만 정한다 — variant가
      // animation을 직접 쓰면 이 규칙과 명시도가 같아져(클래스 1개) 소스 순서에 따라
      // reduced-motion이나 접힘 상태를 덮어쓴다.
      '&:not([data-fold="closed"])': {
        animation: "var(--reveal-animation, none)",
        "&::before": { animation: "var(--reveal-animation-before, none)" },
        "&::after": { animation: "var(--reveal-animation-after, none)" },
        "& img, & video": { animation: "var(--reveal-media-animation, none)" },
      },
      // 접힌 채 기다리는 카드(CARD_UNFOLD). 위 절반만 보이고, 누르면 위 규칙이 이어받는다.
      '&[data-fold="closed"]': {
        clipPath: "inset(0 0 50% 0)",
        cursor: "pointer",
        "&::after": { transform: "rotateX(180deg)" },
      },
    },
  },
  defaultVariants: { preset: "FADE_UP" },
  variants: {
    preset: {
      // 기본값. 차분하게 떠오른다.
      FADE_UP: {
        "--reveal-animation": `reveal-fade-up 420ms ${EASE_OUT} both`,
        "--reveal-media-animation": `reveal-media-settle 640ms ${EASE_OUT} both`,
      },
      // 두루마리가 펴지듯 카드 전체가 위에서부터 말려 풀린다.
      UNROLL: {
        "--reveal-animation": `reveal-unroll 760ms ${EASE_OUT} both`,
        "--reveal-animation-before": `reveal-curl 760ms ${EASE_OUT} both`,
        "--reveal-media-animation": `reveal-media-settle 760ms ${EASE_OUT} both`,
        "&::before": {
          insetInline: "0",
          top: "0",
          height: "2.5rem",
          // 말린 자리의 그늘은 풀리는 경계 바로 위에 걸린다.
          transform: "translateY(-100%)",
          backgroundImage: CURL_SHADOW,
        },
      },
      // steps()로 한 글자씩 드러나는 느낌 — 실제 DOM을 글자 단위로 쪼개지 않는다.
      TYPEWRITER: {
        "--reveal-animation": "reveal-typewriter 700ms steps(24, end) both",
      },
      TV_SCAN: {
        "--reveal-animation": `reveal-tv-scan 2000ms ${EASE_OUT} both`,
      },
      // 남용 금지 — 미스터리 강조용으로만. steps()로 매끄럽게 이어지지 않아야 글리치답다.
      GLITCH: {
        "--reveal-animation": "reveal-glitch 440ms steps(6, end) both",
      },
      // 카드가 반으로 접혀 있다가 펼쳐진다. 클릭(또는 자동)으로 펼쳐지고,
      // 접힌 상태는 카드의 `data-fold="closed"`가 표현한다.
      CARD_UNFOLD: {
        "--reveal-animation": `reveal-unfold 680ms ${EASE_OUT} both`,
        "--reveal-animation-after": `reveal-unfold-flap 680ms ${EASE_OUT} both`,
        "--reveal-media-animation": `reveal-media-settle 900ms ${EASE_OUT} both`,
        // 뚜껑이 뒤로 젖혀지는 각도가 보이려면 원근이 필요하다.
        perspective: "900px",
        "&::after": {
          inset: "50% 0 0 0",
          transformOrigin: "center top",
          bg: "gray.surface.bg",
          backgroundImage: CREASE_LIGHT,
        },
      },
    },
  },
});
