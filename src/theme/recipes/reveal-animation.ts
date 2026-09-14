import { defineRecipe } from "@pandacss/dev";

// 강한 ease-out — 기본 CSS ease-out은 진입 연출에 너무 약하다.
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/**
 * 단서 공개 연출 프리셋(요구, ticket 15). 정답을 맞힌 뒤 1초 규칙 안에서 legible해야
 * 하므로 전부 700ms 이하다. prefers-reduced-motion에서는 정보 손실 없이 즉시 보여준다 —
 * "부드럽게 줄이기"가 아니라 완전히 끈다. 이 컴포넌트는 단서를 읽어야만 다음 단계로
 * 넘어갈 수 있으므로 장식이 아니라 정보이기 때문이다.
 */
export const revealAnimation = defineRecipe({
  className: "revealAnimation",
  base: {
    _motionReduce: {
      animation: "none",
      clipPath: "none",
      opacity: "1",
      translate: "0",
    },
  },
  defaultVariants: { preset: "FADE_UP" },
  variants: {
    preset: {
      // 두루마리가 펴지듯 아래에서부터 드러난다.
      UNROLL: {
        animation: `reveal-unroll 600ms ${EASE_OUT} both`,
      },
      // 기본값. 차분하게 떠오른다.
      FADE_UP: {
        animation: `reveal-fade-up 400ms ${EASE_OUT} both`,
      },
      // steps()로 한 글자씩 드러나는 느낌 — 실제 DOM을 글자 단위로 쪼개지 않는다.
      TYPEWRITER: {
        animation: "reveal-typewriter 700ms steps(24, end) both",
      },
      TV_SCAN: {
        animation: `reveal-tv-scan 500ms ${EASE_OUT} both`,
      },
      // 남용 금지 — 미스터리 강조용으로만. steps()로 매끄럽게 이어지지 않아야 글리치답다.
      GLITCH: {
        animation: "reveal-glitch 400ms steps(6, end) both",
      },
    },
  },
});
