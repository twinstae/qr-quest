import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { StepCardForm, type StepCardData } from "./step-card.tsx";
import type { AnswerSubmission } from "@/domain/step.ts";

function baseStep(overrides: Partial<StepCardData> = {}): StepCardData {
  return {
    name: "QR 01",
    title: "첫 번째 문제",
    body: "서가를 살펴보세요",
    question: "정답은?",
    ...overrides,
  };
}

const noSubmit = async () => {};
const noHint = async () => undefined;

describe("StepCardForm > SHORT_TEXT", () => {
  it("단답형 입력을 제출하면 TEXT 제출을 돌려준다", async () => {
    let submitted: AnswerSubmission | undefined;

    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "SHORT_TEXT" }, placeholder: "정답 입력" })}
          onSubmit={async (submission) => {
            submitted = submission;
          }}
          onRequestHint={noHint}
        />,
      ),
      actions.fill(query.textbox("정답"), "사과"),
      actions.click(query.button("제출하기")),
    );

    expect(submitted).toEqual({ type: "TEXT", value: "사과" });
  });
});

describe("StepCardForm > KEYWORDS", () => {
  it("키워드 입력도 TEXT 제출을 돌려준다", async () => {
    let submitted: AnswerSubmission | undefined;

    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "KEYWORDS" } })}
          onSubmit={async (submission) => {
            submitted = submission;
          }}
          onRequestHint={noHint}
        />,
      ),
      actions.fill(query.textbox("정답"), "사과, 빨강"),
      actions.click(query.button("제출하기")),
    );

    expect(submitted).toEqual({ type: "TEXT", value: "사과, 빨강" });
  });
});

describe("StepCardForm > SINGLE_CHOICE", () => {
  it("보기를 고르고 제출하면 CHOICE 제출을 돌려준다", async () => {
    let submitted: AnswerSubmission | undefined;
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
      given.render(
        <StepCardForm
          step={step}
          onSubmit={async (submission) => {
            submitted = submission;
          }}
          onRequestHint={noHint}
        />,
      ),
      actions.click(query.button("B. 계단 옆 서가")),
      actions.click(query.button("제출하기")),
    );

    expect(submitted).toEqual({ type: "CHOICE", choiceIds: ["B"] });
  });

  it("보기를 고르기 전에는 제출 버튼이 비활성화된다", async () => {
    const step = baseStep({
      answerSpec: {
        type: "SINGLE_CHOICE",
        choices: [{ id: "A", label: "창가 쪽 서가" }],
      },
    });

    await runSiheom(
      given.render(<StepCardForm step={step} onSubmit={noSubmit} onRequestHint={noHint} />),
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
          onSubmit={noSubmit}
          onRequestHint={async () => "안 쓰임"}
        />,
      ),
      assertions.not.visible(query.button("힌트 보기")),
    );
  });

  it("힌트 버튼을 누르면 그때 요청하고, 받은 글자를 보여준다", async () => {
    let requestCount = 0;

    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "SHORT_TEXT" }, hasHint: true })}
          onSubmit={noSubmit}
          onRequestHint={async () => {
            requestCount += 1;
            return "표지 안에 답이 있습니다.";
          }}
        />,
      ),
      actions.click(query.button("힌트 보기")),
      assertions.visible(query.status("힌트")),
      assertions.textContent(query.status("힌트"), "표지 안에 답이 있습니다."),
    );

    expect(requestCount).toBe(1);
  });

  it("다시 열어도 요청은 한 번만 한다", async () => {
    let requestCount = 0;

    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "SHORT_TEXT" }, hasHint: true })}
          onSubmit={noSubmit}
          onRequestHint={async () => {
            requestCount += 1;
            return "힌트 글자";
          }}
        />,
      ),
      actions.click(query.button("힌트 보기")),
      actions.click(query.button("힌트 숨기기")),
      actions.click(query.button("힌트 보기")),
    );

    expect(requestCount).toBe(1);
  });
});

describe("StepCardForm > 정답 보기 (테스트 모드)", () => {
  it("정답 요약이 없으면 정답 보기 버튼을 보여주지 않는다", async () => {
    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "SHORT_TEXT" } })}
          onSubmit={noSubmit}
          onRequestHint={noHint}
        />,
      ),
      assertions.not.visible(query.button("정답 보기")),
    );
  });

  it("정답 보기를 누르면 정답 요약을 보여준다", async () => {
    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "SHORT_TEXT" }, debugAnswer: "이민열, 김도균" })}
          onSubmit={noSubmit}
          onRequestHint={noHint}
        />,
      ),
      actions.click(query.button("정답 보기")),
      assertions.visible(query.status("정답")),
      assertions.textContent(query.status("정답"), "이민열, 김도균"),
    );
  });
});
