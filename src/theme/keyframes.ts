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
  // 단서 공개 연출 프리셋 (ticket 15). 정보 손실 없이 legible해야 하므로
  // 1초 규칙을 지킨다 — prefers-reduced-motion에서는 레시피가 이 자체를 끈다.
  "reveal-unroll": {
    from: { clipPath: "inset(0 0 100% 0)", opacity: "0" },
    "40%": { opacity: "1" },
    to: { clipPath: "inset(0 0 0% 0)", opacity: "1" },
  },
  "reveal-fade-up": {
    from: { opacity: "0", translate: "0 8px" },
    to: { opacity: "1", translate: "0" },
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
});
