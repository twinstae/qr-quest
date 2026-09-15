import { defineKeyframes } from "@pandacss/dev";

export const keyframes = defineKeyframes({
  // collapse
  "expand-height": {
    from: { height: "0" },
    to: { height: "var(--height)" },
  },
  "collapse-height": {
    from: { height: "var(--height)" },
    to: { height: "0" },
  },
  "expand-width": {
    from: { width: "0" },
    to: { width: "var(--width)" },
  },
  "collapse-width": {
    from: { width: "var(--width)" },
    to: { width: "0" },
  },
  // fade
  "fade-in": {
    from: { opacity: "0" },
    to: { opacity: "1" },
  },
  "fade-out": {
    from: { opacity: "1" },
    to: { opacity: "0" },
  },
  // slide from (full)
  "slide-from-left-full": {
    from: { translate: "-100% 0" },
    to: { translate: "0 0" },
  },
  "slide-from-right-full": {
    from: { translate: "100% 0" },
    to: { translate: "0 0" },
  },
  "slide-from-top-full": {
    from: { translate: "0 -100%" },
    to: { translate: "0 0" },
  },
  "slide-from-bottom-full": {
    from: { translate: "0 100%" },
    to: { translate: "0 0" },
  },
  // slide to (full)
  "slide-to-left-full": {
    from: { translate: "0 0" },
    to: { translate: "-100% 0" },
  },
  "slide-to-right-full": {
    from: { translate: "0 0" },
    to: { translate: "100% 0" },
  },
  "slide-to-top-full": {
    from: { translate: "0 0" },
    to: { translate: "0 -100%" },
  },
  "slide-to-bottom-full": {
    from: { translate: "0 0" },
    to: { translate: "0 100%" },
  },
  // slide from
  "slide-from-top": {
    "0%": { translate: "0 -0.5rem" },
    to: { translate: "0" },
  },
  "slide-from-bottom": {
    "0%": { translate: "0 0.5rem" },
    to: { translate: "0" },
  },
  "slide-from-left": {
    "0%": { translate: "-0.5rem 0" },
    to: { translate: "0" },
  },
  "slide-from-right": {
    "0%": { translate: "0.5rem 0" },
    to: { translate: "0" },
  },
  // slide to
  "slide-to-top": {
    "0%": { translate: "0" },
    to: { translate: "0 -0.5rem" },
  },
  "slide-to-bottom": {
    "0%": { translate: "0" },
    to: { translate: "0 0.5rem" },
  },
  "slide-to-left": {
    "0%": { translate: "0" },
    to: { translate: "-0.5rem 0" },
  },
  "slide-to-right": {
    "0%": { translate: "0" },
    to: { translate: "0.5rem 0" },
  },
  // scale
  "scale-in": {
    from: { scale: "0.95" },
    to: { scale: "1" },
  },
  "scale-out": {
    from: { scale: "1" },
    to: { scale: "0.95" },
  },
  "bg-position": {
    from: {
      backgroundPosition: "var(--animate-from, 1rem) 0",
    },
    to: {
      backgroundPosition: "var(--animate-to, 0) 0",
    },
  },
  position: {
    from: {
      insetInlineStart: "var(--animate-from-x)",
      insetBlockStart: "var(--animate-from-y)",
    },
    to: {
      insetInlineStart: "var(--animate-to-x)",
      insetBlockStart: "var(--animate-to-y)",
    },
  },
  // 단서 공개 연출 프리셋 (ticket 15). 연출은 카드 한 덩어리에 걸린다 — 카드 안의
  // 사진과 문구가 함께 움직여야 "단서가 나온다"로 읽힌다. 정지한 카드 위에서 글자만
  // 움직이면 장식으로 보인다. 1초 규칙을 지키고(2초짜리 TV_SCAN 포함),
  // prefers-reduced-motion에서는 레시피가 연출 자체를 만들지 않는다.
  "reveal-fade-up": {
    from: { opacity: "0", translate: "0 10px" },
    to: { opacity: "1", translate: "0" },
  },
  // 두루마리: 카드가 위에서부터 말려 풀린다. 처음 남는 4%가 말린 심이다.
  "reveal-unroll": {
    from: { clipPath: "inset(0 0 96% 0)" },
    to: { clipPath: "inset(0 0 0% 0)" },
  },
  // 말린 자리의 그늘이 풀리는 경계를 따라 내려간다 — 종이를 감고 있는 축.
  "reveal-curl": {
    from: { top: "0%" },
    to: { top: "100%" },
  },
  "reveal-typewriter": {
    from: { clipPath: "inset(0 100% 0 0)" },
    to: { clipPath: "inset(0 0% 0 0)" },
  },
  "reveal-tv-scan": {
    "0%": { opacity: "0" },
    "10%": { opacity: "0.4" },
    "20%": { opacity: "0.1" },
    "35%": { opacity: "0.8" },
    "50%": { opacity: "0.3" },
    to: { opacity: "1" },
  },
  "reveal-glitch": {
    "0%": { translate: "0 0", opacity: "0" },
    "20%": { translate: "-4px 0", opacity: "1" },
    "40%": { translate: "3px 0" },
    "60%": { translate: "-2px 0" },
    "80%": { translate: "2px 0" },
    to: { translate: "0 0" },
  },
  // 접힌 카드: 반으로 접혀 위 절반만 보이던 카드가 아래 절반을 드러내며 두 배가 된다.
  "reveal-unfold": {
    from: { clipPath: "inset(0 0 50% 0)" },
    "38%": { clipPath: "inset(0 0 50% 0)" },
    to: { clipPath: "inset(0 0 0% 0)" },
  },
  // 접혀 있던 아래 절반(뚜껑)이 카드 중앙 접힘선을 축으로 눕는다. 다 누우면 뒤의
  // 카드 내용을 가리지 않도록 사라진다 — 뚜껑이 종이 색이라 사라지는 건 안 보인다.
  "reveal-unfold-flap": {
    from: { transform: "rotateX(180deg)", opacity: "1" },
    "58%": { opacity: "1" },
    "84%": { transform: "rotateX(24deg)", opacity: "0" },
    to: { transform: "rotateX(0deg)", opacity: "0" },
  },
  // 사진이 아주 살짝 당겨지며 자리 잡는다 — 사진도 연출에 참여한다.
  "reveal-media-settle": {
    from: { scale: "1.07", opacity: "0.55" },
    to: { scale: "1", opacity: "1" },
  },
});
