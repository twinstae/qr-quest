import { css } from "styled-system/css";

/** 라디오를 감싼 label을 칩처럼 보이게 한다. 고른 칩은 테두리가 진해진다. */
export const choiceChip = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  borderWidth: "1px",
  borderColor: "border",
  borderRadius: "l2",
  px: "3",
  py: "1.5",
  cursor: "pointer",
  "&:has(input:checked)": { borderColor: "gray.12", bg: "gray.subtle.bg" },
});

export const choiceLegend = css({ textStyle: "sm", fontWeight: "medium", mb: "2" });
