import { dialogAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const dialog = defineSlotRecipe({
  className: "dialog",
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
      maxWidth: "md",
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
});
