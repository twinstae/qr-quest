import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { EMPTY_STEP_EDITOR_VALUES, StepEditorForm, type StepEditorSubmit } from "./step-editor-form.tsx";

const noSubmit = async () => {};

describe("StepEditorForm > 정답 유형별 편집 필드", () => {
  it("객관식으로 바꾸면 보기 입력이 보이고, 단답형으로 바꾸면 사라진다", async () => {
    await runSiheom(
      given.render(
        <StepEditorForm
          kind="QR"
          submitLabel="저장"
          defaultValues={EMPTY_STEP_EDITOR_VALUES}
          onSubmit={noSubmit}
        />,
      ),
      actions.click(query.button("객관식(단일 선택)")),
      assertions.visible(query.textbox("보기 A")),
      actions.click(query.button("단답형")),
      assertions.not.visible(query.textbox("보기 A")),
      assertions.visible(query.textbox("정답")),
    );
  });

  it("키워드로 바꾸면 키워드 입력이 보인다", async () => {
    await runSiheom(
      given.render(
        <StepEditorForm
          kind="FINAL"
          submitLabel="저장"
          defaultValues={EMPTY_STEP_EDITOR_VALUES}
          onSubmit={noSubmit}
        />,
      ),
      actions.click(query.button("키워드")),
      assertions.visible(query.textbox("키워드")),
    );
  });

  it("소개 단계는 정답 유형 선택을 아예 보여주지 않는다", async () => {
    await runSiheom(
      given.render(
        <StepEditorForm
          kind="INTRO"
          submitLabel="저장"
          defaultValues={EMPTY_STEP_EDITOR_VALUES}
          onSubmit={noSubmit}
        />,
      ),
      assertions.not.visible(query.button("단답형")),
    );
  });
});

describe("StepEditorForm > 정답 검증", () => {
  it("정답이 비어 있으면 저장을 막고 이유를 보여준다", async () => {
    let submitted: StepEditorSubmit | undefined;

    await runSiheom(
      given.render(
        <StepEditorForm
          kind="QR"
          submitLabel="저장"
          defaultValues={{ ...EMPTY_STEP_EDITOR_VALUES, name: "QR 05", title: "제목" }}
          onSubmit={async (payload) => {
            submitted = payload;
          }}
        />,
      ),
      actions.click(query.button("저장")),
      assertions.visible(query.status("안내")),
    );

    expect(submitted).toBeUndefined();
  });

  it("단답형 정답을 채우면 저장된다", async () => {
    let submitted: StepEditorSubmit | undefined;

    await runSiheom(
      given.render(
        <StepEditorForm
          kind="QR"
          submitLabel="저장"
          defaultValues={{ ...EMPTY_STEP_EDITOR_VALUES, name: "QR 05", title: "제목" }}
          onSubmit={async (payload) => {
            submitted = payload;
          }}
        />,
      ),
      actions.fill(query.textbox("정답"), "사과"),
      actions.click(query.button("저장")),
    );

    expect(submitted?.answerSpec).toEqual({ type: "SHORT_TEXT", accepted: ["사과"], match: "EXACT" });
  });

  it("객관식은 정답으로 고른 보기가 없으면 막는다", async () => {
    let submitted: StepEditorSubmit | undefined;

    await runSiheom(
      given.render(
        <StepEditorForm
          kind="QR"
          submitLabel="저장"
          defaultValues={{ ...EMPTY_STEP_EDITOR_VALUES, name: "QR 05", title: "제목" }}
          onSubmit={async (payload) => {
            submitted = payload;
          }}
        />,
      ),
      actions.click(query.button("객관식(단일 선택)")),
      actions.fill(query.textbox("보기 A"), "창가 쪽 서가"),
      actions.fill(query.textbox("보기 B"), "계단 옆 서가"),
      actions.click(query.button("저장")),
      assertions.visible(query.status("안내")),
    );

    expect(submitted).toBeUndefined();
  });

  it("객관식은 보기를 채우고 정답 체크를 하면 저장된다", async () => {
    let submitted: StepEditorSubmit | undefined;

    await runSiheom(
      given.render(
        <StepEditorForm
          kind="QR"
          submitLabel="저장"
          defaultValues={{ ...EMPTY_STEP_EDITOR_VALUES, name: "QR 05", title: "제목" }}
          onSubmit={async (payload) => {
            submitted = payload;
          }}
        />,
      ),
      actions.click(query.button("객관식(단일 선택)")),
      actions.fill(query.textbox("보기 A"), "창가 쪽 서가"),
      actions.fill(query.textbox("보기 B"), "계단 옆 서가"),
      actions.click(query.checkbox("보기 B를 정답으로 표시")),
      actions.click(query.button("저장")),
    );

    expect(submitted?.answerSpec).toEqual({
      type: "SINGLE_CHOICE",
      choices: [
        { id: "A", label: "창가 쪽 서가" },
        { id: "B", label: "계단 옆 서가" },
      ],
      correctChoiceIds: ["B"],
    });
  });
});
