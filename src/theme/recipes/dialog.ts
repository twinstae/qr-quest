import { dialogAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const dialog = defineSlotRecipe({
  className: "dialog",
  // size는 DialogShell이 prop으로 받아 런타임에 넘긴다 — Panda는 정적으로 쓰인 variant만
  // CSS로 뽑으므로 그냥 두면 클래스만 붙고 폭이 적용되지 않는다(reveal-animation과 같은 함정).
  staticCss: [{ size: ["*"] }],
  slots: [...dialogAnatomy.keys(), "root", "header", "body", "footer"],
  base: {
    backdrop: {
      bg: "black.a8",
      position: "fixed",
      inset: "0",
      zIndex: "overlay",
      _open: {
        animationName: "fade-in",
        animationDuration: "slow",
      },
      _closed: {
        animationName: "fade-out",
        animationDuration: "fast",
      },
    },
    positioner: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "fixed",
      inset: "0",
      zIndex: "modal",
      padding: "4",
      overscrollBehaviorY: "none",
    },
    content: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      borderRadius: "l3",
      bg: "gray.surface.bg",
      boxShadow: "xl",
      width: "full",
      maxHeight: "calc(100% - 7.5rem)",
      overflow: "auto",
      _open: {
        animationName: "scale-in, fade-in",
        animationDuration: "slow",
      },
      _closed: {
        animationName: "scale-out, fade-out",
        animationDuration: "fast",
      },
    },
    header: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "4",
      p: "6",
      pb: "4",
    },
    body: {
      display: "flex",
      flexDirection: "column",
      px: "6",
      pb: "6",
      flex: "1",
    },
    footer: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "3",
      px: "6",
      pb: "6",
    },
    title: {
      textStyle: "lg",
      fontWeight: "semibold",
    },
    description: {
      color: "fg.muted",
      textStyle: "sm",
    },
    closeTrigger: {
      color: "fg.muted",
      _hover: { color: "fg.default" },
    },
  },
  defaultVariants: {
    size: "md",
  },
  variants: {
    // 폭은 variant로만 정한다 — base에 maxWidth를 두고 variant로 덮으면 명시도가 같아
    // 스타일시트 순서에 따라 지는 싸움이 된다(ticket 15의 "정적 추출과 캐스케이드").
    size: {
      md: { content: { maxWidth: "md" } },
      // 폼 옆에 참가자 화면 미리보기를 나란히 두는 편집기용 크기.
      wide: { content: { maxWidth: "5xl" } },
    },
  },
});
