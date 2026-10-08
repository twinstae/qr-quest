import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { StartScreenEditorForm, type StartScreenFields } from "./start-screen-editor.tsx";

const DEFAULTS: StartScreenFields = {
  title: "사라진 책의 행방",
  teaser: "책방 안에 남겨진 단서를 찾아주세요.",
  estimatedMinutes: 20,
  startNote: "",
  startButtonLabel: "",
};

const preview = query.region("시작 화면 미리보기");

describe("StartScreenEditorForm", () => {
  it("입력하는 대로 오른쪽 미리보기가 바뀐다", async () => {
    await runSiheom(
      given.render(
        <StartScreenEditorForm caseNumber={1} defaultValues={DEFAULTS} onSubmit={async () => {}} />,
      ),
      assertions.visible(query.within(preview, query.button("시작하기"))),
      actions.fill(query.textbox("시작 버튼 문구"), "사건 속으로"),
      assertions.visible(query.within(preview, query.button("사건 속으로"))),
      actions.fill(query.textbox("제목"), "잃어버린 편지"),
      assertions.visible(query.within(preview, query.heading("잃어버린 편지"))),
      actions.fill(query.textbox("안내 문구 (선택)"), "2인 이상 추천"),
      actions.fill(query.textbox("예상 소요 시간(분)"), "45"),
      // 마지막 입력이 반영될 때까지 기다린다.
      actions.fill(query.textbox("시작 버튼 문구"), "  "),
      assertions.visible(query.within(preview, query.button("시작하기"))),
    );

    const previewText = document.querySelector("[aria-label='시작 화면 미리보기']")?.textContent;
    expect(previewText).toContain("2인 이상 추천");
    expect(previewText).toContain("예상 소요 시간 약 45분");
  });

  it("미리보기는 휴대폰 모양 틀 안에 보인다", async () => {
    await runSiheom(
      given.render(
        <StartScreenEditorForm caseNumber={1} defaultValues={DEFAULTS} onSubmit={async () => {}} />,
      ),
      assertions.visible(query.within(preview, query.group("휴대폰 화면"))),
    );
  });

  it("저장하면 입력한 값을 넘긴다", async () => {
    let submitted: StartScreenFields | undefined;

    await runSiheom(
      given.render(
        <StartScreenEditorForm
          caseNumber={1}
          defaultValues={DEFAULTS}
          onSubmit={async (values) => {
            submitted = values;
          }}
        />,
      ),
      actions.fill(query.textbox("시작 버튼 문구"), "사건 속으로"),
      actions.fill(query.textbox("예상 소요 시간(분)"), "45"),
      actions.click(query.button("저장")),
    );

    expect(submitted).toEqual({
      ...DEFAULTS,
      estimatedMinutes: 45,
      startButtonLabel: "사건 속으로",
    });
  });
});
