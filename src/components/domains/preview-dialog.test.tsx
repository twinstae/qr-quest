import { describe, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { PreviewDialog } from "./preview-dialog.tsx";

describe("PreviewDialog", () => {
  it("열면 PC 화면으로 시작하고, 모바일로 바꿀 수 있다", async () => {
    await runSiheom(
      given.render(<PreviewDialog previewUrl="/admin/preview/step-1" />),
      actions.click(query.button("미리보기")),
      assertions.visible(query.status("현재 화면")),
      assertions.textContent(query.status("현재 화면"), "PC 화면"),
      actions.click(query.button("모바일")),
      assertions.textContent(query.status("현재 화면"), "모바일 화면"),
      actions.click(query.button("PC")),
      assertions.textContent(query.status("현재 화면"), "PC 화면"),
    );
  });
});
