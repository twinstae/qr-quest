import { describe, expect, it, vi } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { StepCardForm, type StepCardData } from "./step-card.tsx";

function baseStep(overrides: Partial<StepCardData> = {}): StepCardData {
  return {
    name: "QR 01",
    title: "첫 번째 문제",
    body: "서가를 살펴보세요",
    question: "정답은?",
    ...overrides,
  };
}

describe("StepCardForm > SHORT_TEXT", () => {
  it("단답형 입력을 제출하면 TEXT 제출을 돌려준다", async () => {
    const onSubmit = vi.fn(async () => {});

    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "SHORT_TEXT" }, placeholder: "정답 입력" })}
          onSubmit={onSubmit}
          onRequestHint={async () => undefined}
        />,
      ),
      actions.fill(query.textbox("정답"), "사과"),
      actions.click(query.button("제출하기")),
    );

    expect(onSubmit).toHaveBeenCalledWith({ type: "TEXT", value: "사과" });
  });
});

describe("StepCardForm > KEYWORDS", () => {
  it("키워드 입력도 TEXT 제출을 돌려준다", async () => {
    const onSubmit = vi.fn(async () => {});

    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "KEYWORDS" } })}
          onSubmit={onSubmit}
          onRequestHint={async () => undefined}
        />,
      ),
      actions.fill(query.textbox("정답"), "사과, 빨강"),
      actions.click(query.button("제출하기")),
    );

    expect(onSubmit).toHaveBeenCalledWith({ type: "TEXT", value: "사과, 빨강" });
  });
});

describe("StepCardForm > SINGLE_CHOICE", () => {
  it("보기를 고르고 제출하면 CHOICE 제출을 돌려준다", async () => {
    const onSubmit = vi.fn(async () => {});
    const step = baseStep({
      answerSpec: {
        type: "SINGLE_CHOICE",
        choices: [
          { id: "A", label: "창가 쪽 서가" },
          { id: "B", label: "계단 옆 서가" },
        ],
      },
    });

    await runSiheom(
      given.render(<StepCardForm step={step} onSubmit={onSubmit} onRequestHint={async () => undefined} />),
      actions.click(query.button("B. 계단 옆 서가")),
      actions.click(query.button("제출하기")),
    );

    expect(onSubmit).toHaveBeenCalledWith({ type: "CHOICE", choiceIds: ["B"] });
  });

  it("보기를 고르기 전에는 제출 버튼이 비활성화된다", async () => {
    const step = baseStep({
      answerSpec: {
        type: "SINGLE_CHOICE",
        choices: [{ id: "A", label: "창가 쪽 서가" }],
      },
    });

    await runSiheom(
      given.render(
        <StepCardForm step={step} onSubmit={async () => {}} onRequestHint={async () => undefined} />,
      ),
      assertions.disabled(query.button("제출하기")),
    );
  });
});

describe("StepCardForm > 힌트", () => {
  it("힌트가 없는 단계는 힌트 버튼을 보여주지 않는다", async () => {
    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "SHORT_TEXT" }, hasHint: false })}
          onSubmit={async () => {}}
          onRequestHint={async () => "안 쓰임"}
        />,
      ),
      assertions.not.visible(query.button("힌트 보기")),
    );
  });

  it("힌트 버튼을 누르면 그때 요청하고, 받은 글자를 보여준다", async () => {
    const onRequestHint = vi.fn(async () => "표지 안에 답이 있습니다.");

    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "SHORT_TEXT" }, hasHint: true })}
          onSubmit={async () => {}}
          onRequestHint={onRequestHint}
        />,
      ),
      actions.click(query.button("힌트 보기")),
      assertions.visible(query.status("힌트")),
      assertions.textContent(query.status("힌트"), "표지 안에 답이 있습니다."),
    );

    expect(onRequestHint).toHaveBeenCalledTimes(1);
  });

  it("다시 열어도 요청은 한 번만 한다", async () => {
    const onRequestHint = vi.fn(async () => "힌트 글자");

    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "SHORT_TEXT" }, hasHint: true })}
          onSubmit={async () => {}}
          onRequestHint={onRequestHint}
        />,
      ),
      actions.click(query.button("힌트 보기")),
      actions.click(query.button("힌트 숨기기")),
      actions.click(query.button("힌트 보기")),
    );

    expect(onRequestHint).toHaveBeenCalledTimes(1);
  });
});
