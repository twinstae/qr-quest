import { describe, expect, it, vi } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { Theme } from "@/domain/theme.ts";

import { EMPTY_THEME_VALUES, ThemeEditorForm } from "./theme-editor-form.tsx";

describe("ThemeEditorForm", () => {
  it("이름·색·폰트·흐리기를 고르면 그 값으로 저장한다", async () => {
    let saved: Omit<Theme, "id"> | undefined;

    await runSiheom(
      given.render(
        <ThemeEditorForm
          defaultValues={EMPTY_THEME_VALUES}
          submitLabel="테마 만들기"
          onSubmit={async (input) => {
            saved = input;
          }}
        />,
      ),
      actions.fill(query.textbox("테마 이름"), "팔레스타인"),
      actions.click(query.radio("초록")),
      actions.click(query.within(query.group("제목 폰트"), query.radio("Noto Serif KR"))),
      actions.click(query.within(query.group("본문 폰트"), query.radio("고운돋움"))),
      actions.fill(query.spinbutton("배경 흐리게(%)"), "40"),
      actions.click(query.button("테마 만들기")),
    );

    await vi.waitFor(() =>
      expect(saved).toStrictEqual({
        name: "팔레스타인",
        palette: "green",
        headingFont: "noto-serif-kr",
        bodyFont: "gowun-dodum",
        background: undefined,
        backgroundDim: 40,
      }),
    );
  });

  it("고르는 대로 미리보기가 바로 바뀐다", async () => {
    await runSiheom(
      given.render(
        <ThemeEditorForm
          defaultValues={EMPTY_THEME_VALUES}
          submitLabel="저장"
          onSubmit={async () => {}}
        />,
      ),
      actions.fill(query.textbox("테마 이름"), "올리브 숲"),
      actions.click(query.within(query.group("제목 폰트"), query.radio("고운바탕"))),
      assertions.visible(query.figure("올리브 숲 미리보기")),
    );

    const previewHeading = document.querySelector("figure h3")!;
    expect(getComputedStyle(previewHeading).fontFamily).toBe('"Gowun Batang", serif');
  });

  it("이름이 없으면 저장하지 않고 알려준다", async () => {
    let submitted = 0;
    const onSubmit = async () => {
      submitted++;
    };

    await runSiheom(
      given.render(
        <ThemeEditorForm
          defaultValues={EMPTY_THEME_VALUES}
          submitLabel="저장"
          onSubmit={onSubmit}
        />,
      ),
      actions.click(query.button("저장")),
      assertions.visible(query.alert("테마 이름을 입력해 주세요")),
    );

    expect(submitted).toBe(0);
  });
});
