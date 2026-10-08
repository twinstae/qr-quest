import { defineRecipe } from "@pandacss/dev";

import { inputVariants } from "./input";

/** 여러 줄 입력. 모양(variant)은 input과 같고, 높이 대신 위아래 여백으로 크기를 정한다. */
export const textarea = defineRecipe({
  className: "textarea",
  jsx: ["Textarea", "Field.Textarea"],
  base: {
    appearance: "none",
    borderRadius: "l2",
    minWidth: "0",
    outline: "0",
    position: "relative",
    transition: "colors",
    width: "100%",
    _disabled: {
      layerStyle: "disabled",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
  variants: {
    variant: inputVariants,
    size: {
      xs: { textStyle: "sm", px: "2", py: "1" },
      sm: { textStyle: "sm", px: "2.5", py: "1.5" },
      md: { textStyle: "md", px: "3", py: "2" },
      lg: { textStyle: "md", px: "3.5", py: "2.5" },
      xl: { textStyle: "lg", px: "4", py: "3" },
    },
  },
});
