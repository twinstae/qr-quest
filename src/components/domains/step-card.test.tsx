import { describe, expect, it } from "vitest";
import {
  actions,
  assertions,
  effect,
  given,
  query,
  runSiheom,
  withFakeTimers,
} from "@siheom/react";

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

describe("StepCardForm > 제출 중 표시", () => {
  const slowSubmit = () => new Promise<void>((resolve) => setTimeout(resolve, 200));

  it("객관식 제출이 오래 걸리는 동안 제출하기 버튼이 로딩 상태로 눌리지 않는다", async () => {
    const step = baseStep({
      answerSpec: { type: "SINGLE_CHOICE", choices: [{ id: "A", label: "창가 쪽 서가" }] },
    });

    await runSiheom(
      given.render(<StepCardForm step={step} onSubmit={slowSubmit} onRequestHint={noHint} />),
      actions.click(query.button("A. 창가 쪽 서가")),
      withFakeTimers(
        actions.click(query.button("제출하기")),
        // 로딩 중에는 버튼 이름이 스피너로 바뀌므로 이름 없이 찾는다.
        assertions.disabled(query.button(/^$|제출하기/)),
        effect.elapsed(200),
        assertions.visible(query.button("제출하기")),
      ),
    );

    const submit = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("제출하기"),
    )!;
    expect(submit.disabled).toBe(false);
  });

  it("단답형 제출이 오래 걸리는 동안에도 제출하기 버튼이 로딩 상태다", async () => {
    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({ answerSpec: { type: "SHORT_TEXT" } })}
          onSubmit={slowSubmit}
          onRequestHint={noHint}
        />,
      ),
      actions.fill(query.textbox("정답"), "사과"),
      withFakeTimers(
        actions.click(query.button("제출하기")),
        assertions.disabled(query.button(/^$|제출하기/)),
        effect.elapsed(200),
        assertions.visible(query.button("제출하기")),
      ),
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

describe("StepCardForm > 긴 보기", () => {
  it("보기가 길면 잘리지 않고 여러 줄로 보인다", async () => {
    const long =
      "약 10,500 BCE까지 거슬러 올라가는 인간 활동의 흔적이 있으며, 기원전 9~8천년경에는 상당한 규모의 영구 정착지가 형성되었다.";

    await runSiheom(
      given.render(
        <div style={{ width: 320 }}>
          <StepCardForm
            step={baseStep({
              answerSpec: {
                type: "SINGLE_CHOICE",
                choices: [
                  { id: "1", label: "짧은 보기" },
                  { id: "2", label: long },
                ],
              },
            })}
            onSubmit={noSubmit}
            onRequestHint={noHint}
          />
        </div>,
      ),
      assertions.visible(query.button(`2. ${long}`)),
    );

    const button = [...document.querySelectorAll("button")].find((element) =>
      element.textContent?.startsWith("2."),
    )!;
    // 글자가 버튼 밖으로 넘치지 않고, 버튼이 여러 줄 높이로 늘어난다.
    expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
    expect(button.getBoundingClientRect().height).toBeGreaterThan(60);
  });
});

/** 화면에 그려진 글자(innerText) — 줄바꿈이 무시되면 줄바꿈 대신 공백이 나온다. */
function renderedText(text: string): string | undefined {
  const firstLine = text.split("\n")[0] ?? "";
  const element = [...document.querySelectorAll<HTMLElement>("p, h2, h3, div, span, button")]
    .filter((candidate) => candidate.textContent?.includes(firstLine))
    .at(-1);
  return element?.innerText;
}

describe("StepCardForm > 줄바꿈", () => {
  it("관리자가 넣은 줄바꿈을 본문·문제·보기에서 그대로 보여준다", async () => {
    await runSiheom(
      given.render(
        <StepCardForm
          step={baseStep({
            body: "본문 첫 줄\n본문 둘째 줄",
            question: "문제 첫 줄\n문제 둘째 줄",
            answerSpec: {
              type: "SINGLE_CHOICE",
              choices: [{ id: "A", label: "보기 첫 줄\n보기 둘째 줄" }],
            },
          })}
          onSubmit={noSubmit}
          onRequestHint={noHint}
        />,
      ),
      assertions.visible(query.heading("첫 번째 문제")),
    );

    expect(renderedText("본문 첫 줄\n본문 둘째 줄")).toBe("본문 첫 줄\n본문 둘째 줄");
    expect(renderedText("문제 첫 줄\n문제 둘째 줄")).toBe("문제 첫 줄\n문제 둘째 줄");
    expect(renderedText("보기 첫 줄\n보기 둘째 줄")).toBe("A. 보기 첫 줄\n보기 둘째 줄");
  });
});
