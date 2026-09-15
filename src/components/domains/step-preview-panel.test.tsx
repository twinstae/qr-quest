import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { screen } from "@testing-library/dom";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { DialogShell } from "./dialog-shell.tsx";
import { StepPreviewPanel } from "./step-preview-panel.tsx";
import { EMPTY_STEP_EDITOR_VALUES, StepEditorForm } from "./step-editor-form.tsx";
import { DEFAULT_CORRECT_MESSAGE } from "@/domain/step.ts";

const noSubmit = async () => {};

/**
 * 편집기 + 미리보기. 실제 화면(step-form-dialog.tsx)과 같은 구성으로 앉힌다.
 * 미리보기 안의 요소는 편집기 필드와 이름이 겹칠 수 있어(정답 입력 등) 영역으로 좁혀서 찾는다.
 */
const preview = query.region("참가자 화면 미리보기");

function dialogWidth(name: string): number {
  return Number.parseFloat(getComputedStyle(screen.getByRole("dialog", { name })).maxWidth);
}

const editor = (
  <StepEditorForm
    kind="QR"
    submitLabel="저장"
    defaultValues={EMPTY_STEP_EDITOR_VALUES}
    onSubmit={noSubmit}
    preview={<StepPreviewPanel kind="QR" />}
  />
);

describe("StepPreviewPanel", () => {
  it("저장하지 않은 초안이 입력하는 대로 미리보기에 나타난다", async () => {
    await runSiheom(
      given.render(editor),
      // 아직 아무것도 안 채웠으면 카드가 비어 있다는 걸 보여준다.
      assertions.visible(query.within(preview, query.heading("제목 없음"))),
      actions.fill(query.textbox("제목"), "잃어버린 편지"),
      assertions.visible(query.within(preview, query.heading("잃어버린 편지"))),
      actions.fill(query.textbox("문구"), "서가 세 번째 칸을 보세요."),
      assertions.visible(query.within(preview, query.heading("서가 세 번째 칸을 보세요."))),
    );
  });

  it("단서 문구가 비면 정답 메시지가, 그것도 비면 기본 문구가 단서 자리에 온다", async () => {
    await runSiheom(
      given.render(editor),
      assertions.visible(query.within(preview, query.heading(DEFAULT_CORRECT_MESSAGE))),
      actions.fill(query.textbox("정답 메시지"), "정답이에요!"),
      assertions.visible(query.within(preview, query.heading("정답이에요!"))),
    );
  });

  it("넓은 화면에서는 폼 옆에 나란히 선다", async () => {
    // 테스트 화면은 휴대폰 폭이 기본값이라, 관리자가 실제로 쓰는 넓은 화면을 따로 만든다.
    await page.viewport(1280, 800);

    try {
      await runSiheom(given.render(editor), assertions.visible(preview));

      // 폼을 고치는 동안 미리보기가 함께 보이는 게 요점이다 — 좁을 때만 아래로 내려간다.
      const fields = screen.getByRole("textbox", { name: "제목" }).getBoundingClientRect();
      const panel = screen
        .getByRole("region", { name: "참가자 화면 미리보기" })
        .getBoundingClientRect();

      expect(panel.left).toBeGreaterThanOrEqual(fields.right);
    } finally {
      await page.viewport(414, 896);
    }
  });

  it("미리보기를 옆에 두는 편집기 다이얼로그는 그만큼 넓게 열린다", async () => {
    // 미리보기가 22rem을 차지하므로 기본 폭(md=28rem)으로는 폼과 미리보기가 함께 못 산다.
    // variant CSS가 클래스만 붙고 안 나오는 회귀(ticket 15)를 막으려고 계산된 폭을 본다.
    await runSiheom(
      given.render(
        <DialogShell title="단계 수정" size="wide" open onOpenChange={() => {}} trigger={<span />}>
          내용
        </DialogShell>,
      ),
      assertions.visible(query.dialog("단계 수정")),
    );

    expect(dialogWidth("단계 수정")).toBeGreaterThanOrEqual(1024);
  });

  it("넓이를 안 준 다이얼로그는 예전처럼 좁다", async () => {
    await runSiheom(
      given.render(
        <DialogShell title="삭제 확인" open onOpenChange={() => {}} trigger={<span />}>
          내용
        </DialogShell>,
      ),
      assertions.visible(query.dialog("삭제 확인")),
    );

    expect(dialogWidth("삭제 확인")).toBeLessThan(1024);
  });

  it("정답 유형을 바꾸면 미리보기의 입력 방식도 함께 바뀐다", async () => {
    await runSiheom(
      given.render(editor),
      assertions.visible(query.within(preview, query.textbox("정답"))),
      actions.click(query.button("객관식(단일 선택)")),
      actions.fill(query.textbox("보기 A"), "창가 쪽 서가"),
      actions.fill(query.textbox("보기 B"), "계단 옆 서가"),
      // 정답 체크를 아직 안 했어도 보기는 보여야 한다 — 저장 검증과 미리보기는 다른 일이다.
      assertions.visible(query.within(preview, query.button("A. 창가 쪽 서가"))),
      assertions.visible(query.within(preview, query.button("B. 계단 옆 서가"))),
      actions.click(query.button("단답형")),
      assertions.visible(query.within(preview, query.textbox("정답"))),
      assertions.not.visible(query.within(preview, query.button("A. 창가 쪽 서가"))),
    );
  });
});
