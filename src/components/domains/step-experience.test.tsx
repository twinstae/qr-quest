import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { StepExperience, type StepExperienceState } from "./step-experience.tsx";
import type { StepCardData } from "./step-card.tsx";

const STEP: StepCardData = {
  name: "QR 01",
  title: "첫 번째 문제",
  body: "서가를 살펴보세요",
  question: "정답은?",
  answerSpec: { type: "SHORT_TEXT" },
};

const INCORRECT_MESSAGE = "아직 사건의 핵심에 도달하지 못했어요. 문장을 다시 살펴보세요.";

/** 실제 화면(/t/$qrToken)처럼 상태를 직접 들고 onSubmit 결과에 따라 갱신한다. */
function setup(onSubmitResult: () => StepExperienceState, onContinue: () => void = () => {}) {
  function Harness() {
    const [state, setState] = useState<StepExperienceState>({ status: "idle" });
    return (
      <StepExperience
        step={STEP}
        state={state}
        onSubmit={async () => setState(onSubmitResult())}
        onRequestHint={async () => undefined}
        onContinue={onContinue}
      />
    );
  }
  return given.render(<Harness />);
}

describe("StepExperience > 오답", () => {
  it("경고가 아닌 안내로 문구를 보여주고, 입력값을 지우지 않는다", async () => {
    await runSiheom(
      setup(() => ({ status: "incorrect" })),
      actions.fill(query.textbox("정답"), "틀린 답"),
      actions.click(query.button("제출하기")),
      assertions.visible(query.status("안내")),
      assertions.textContent(query.status("안내"), INCORRECT_MESSAGE),
      assertions.value(query.textbox("정답"), "틀린 답"),
    );
  });

  it("오답 횟수 제한 없이 계속 다시 시도할 수 있다", async () => {
    const onSubmit = vi.fn(() => ({ status: "incorrect" }) as const);

    await runSiheom(
      setup(onSubmit),
      actions.fill(query.textbox("정답"), "1"),
      actions.click(query.button("제출하기")),
      actions.fill(query.textbox("정답"), "2"),
      actions.click(query.button("제출하기")),
      actions.fill(query.textbox("정답"), "3"),
      actions.click(query.button("제출하기")),
      assertions.visible(query.button("제출하기")),
    );

    expect(onSubmit).toHaveBeenCalledTimes(3);
  });
});

describe("StepExperience > 정답", () => {
  it("공개할 단서를 보여주고, 다음 단서 찾기를 누르면 onContinue를 부른다", async () => {
    const onContinue = vi.fn();

    await runSiheom(
      setup(() => ({ status: "correct", reveal: { text: "새 단서 발견" } }), onContinue),
      actions.fill(query.textbox("정답"), "정답"),
      actions.click(query.button("제출하기")),
      assertions.visible(query.heading("새 단서 발견")),
      actions.click(query.button("다음 단서 찾기")),
    );

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
