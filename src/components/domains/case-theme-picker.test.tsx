import { describe, expect, it, vi } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { Theme } from "@/domain/theme.ts";

import { CaseThemePicker } from "./case-theme-picker.tsx";

const PALESTINE: Theme = {
  id: "theme-1",
  name: "팔레스타인",
  palette: "green",
  headingFont: "noto-serif-kr",
  bodyFont: "system",
  backgroundDim: 40,
};

describe("CaseThemePicker", () => {
  it("테마를 고르면 바로 저장하고 미리보기를 보여주고, 테마 없음으로 되돌릴 수 있다", async () => {
    const setTheme = vi.fn(async (_themeId: string | null) => {});

    await runSiheom(
      given.render(
        <CaseThemePicker themes={[PALESTINE]} themeId={undefined} setTheme={setTheme} />,
      ),
      assertions.checked(query.radio("테마 없음")),
      assertions.not.visible(query.figure("팔레스타인 미리보기")),
      actions.click(query.radio("팔레스타인")),
      assertions.visible(query.figure("팔레스타인 미리보기")),
      assertions.textContent(query.status("테마 저장"), "저장했어요"),
      actions.click(query.radio("테마 없음")),
      assertions.not.visible(query.figure("팔레스타인 미리보기")),
    );

    expect(setTheme.mock.calls).toEqual([["theme-1"], [null]]);
  });

  it("저장에 실패하면 원래 테마로 되돌리고 알려준다", async () => {
    await runSiheom(
      given.render(
        <CaseThemePicker
          themes={[PALESTINE]}
          themeId={undefined}
          setTheme={async () => {
            throw new Error("network");
          }}
        />,
      ),
      actions.click(query.radio("팔레스타인")),
      assertions.textContent(query.status("테마 저장"), "저장하지 못했어요. 다시 시도해 주세요."),
      assertions.checked(query.radio("테마 없음")),
    );
  });
});
