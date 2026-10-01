import type { CSSProperties, ReactNode } from "react";

import { fontStack, googleFontsHref, type Theme, type ThemePalette } from "@/domain/theme.ts";
import { css, cx } from "styled-system/css";

// Panda는 빌드 때 클래스를 뽑으므로 팔레트마다 정적인 css() 호출이 있어야 한다.
export const PALETTE_CLASS: Record<ThemePalette, string> = {
  green: css({ colorPalette: "green" }),
  olive: css({ colorPalette: "olive" }),
  red: css({ colorPalette: "red" }),
  tomato: css({ colorPalette: "tomato" }),
  amber: css({ colorPalette: "amber" }),
  blue: css({ colorPalette: "blue" }),
  iris: css({ colorPalette: "iris" }),
  brown: css({ colorPalette: "brown" }),
  gray: css({ colorPalette: "gray" }),
};

const root = css({
  position: "relative",
  isolation: "isolate",
  fontFamily: "var(--theme-body-font, inherit)",
  "& :is(h1, h2, h3, h4, h5, h6)": { fontFamily: "var(--theme-heading-font, inherit)" },
  // 배경 위에서도 글이 읽히게 카드를 불투명에 가깝게 올린다.
  "&[data-has-background] .card__root": {
    bg: "color-mix(in srgb, var(--colors-gray-1) 88%, transparent)",
    backdropFilter: "blur(6px)",
  },
});

// 검게 덮지 않고 화면 바탕색으로 흐리게 덮는다 — 카드 밖의 글자(안내 문구 등)가
// 라이트·다크 모두에서 읽히도록.
const backgroundLayer = css({
  position: "fixed",
  inset: "0",
  zIndex: "-1",
  backgroundSize: "cover",
  backgroundPosition: "center",
  _after: {
    content: '""',
    position: "absolute",
    inset: "0",
    bg: "gray.1",
    opacity: "var(--theme-dim)",
  },
});

/**
 * 참가자 화면에 CASE의 테마(색·폰트·배경)를 입힌다 (ticket 18).
 * 테마가 없으면 아무것도 감싸지 않아 지금 모습 그대로다.
 */
export function ThemedScreen({ theme, children }: { theme: Theme | null; children: ReactNode }) {
  if (!theme) return children;

  const fontsHref = googleFontsHref([theme.headingFont, theme.bodyFont]);

  return (
    <div
      className={cx(PALETTE_CLASS[theme.palette], root)}
      data-has-background={theme.background ? "" : undefined}
      style={
        {
          "--theme-heading-font": fontStack(theme.headingFont),
          "--theme-body-font": fontStack(theme.bodyFont),
        } as CSSProperties
      }
    >
      {fontsHref && <link rel="stylesheet" href={fontsHref} precedence="theme-fonts" />}
      {theme.background && (
        <div
          data-theme-background
          aria-hidden
          className={backgroundLayer}
          style={
            {
              backgroundImage: `url("${theme.background.src}")`,
              "--theme-dim": theme.backgroundDim / 100,
            } as CSSProperties
          }
        />
      )}
      {children}
    </div>
  );
}
