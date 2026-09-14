import { describe, expect, it } from "vitest";

import {
  DEFAULT_CORRECT_MESSAGE,
  DEFAULT_WRONG_MESSAGE,
  describeAnswerForDebug,
  matchAnswer,
  normalizeLoose,
  normalizeText,
  resolveCorrectMessage,
  resolveWrongMessage,
  type AnswerSpec,
} from "./step.ts";

describe("describeAnswerForDebug", () => {
  it("객관식은 정답 보기 기호와 라벨을 보여준다", () => {
    const spec: AnswerSpec = {
      type: "SINGLE_CHOICE",
      choices: [
        { id: "A", label: "창가 쪽 서가" },
        { id: "B", label: "계단 옆 서가" },
      ],
      correctChoiceIds: ["B"],
    };
    expect(describeAnswerForDebug(spec)).toBe("B. 계단 옆 서가");
  });

  it("복수 선택은 여러 보기를 함께 보여준다", () => {
    const spec: AnswerSpec = {
      type: "MULTI_CHOICE",
      choices: [
        { id: "A", label: "창가 쪽 서가" },
        { id: "B", label: "계단 옆 서가" },
      ],
      correctChoiceIds: ["A", "B"],
    };
    expect(describeAnswerForDebug(spec)).toBe("A. 창가 쪽 서가, B. 계단 옆 서가");
  });

  it("단답형·숫자·키워드는 허용값을 쉼표로 보여준다", () => {
    expect(
      describeAnswerForDebug({ type: "SHORT_TEXT", accepted: ["사과", "apple"], match: "EXACT" }),
    ).toBe("사과, apple");
    expect(describeAnswerForDebug({ type: "NUMBER", accepted: [42] })).toBe("42");
    expect(describeAnswerForDebug({ type: "KEYWORDS", keywords: ["사라진", "책"], match: "ALL" })).toBe(
      "사라진, 책",
    );
  });
});

describe("resolveCorrectMessage / resolveWrongMessage", () => {
  it("커스텀 메시지가 있으면 그대로 쓴다", () => {
    expect(resolveCorrectMessage({ correctMessage: "잘했어요!" })).toBe("잘했어요!");
    expect(resolveWrongMessage({ wrongMessage: "다시 살펴보세요." })).toBe("다시 살펴보세요.");
  });

  it("비어 있거나 공백뿐이면 기본 문구를 쓴다", () => {
    expect(resolveCorrectMessage({})).toBe(DEFAULT_CORRECT_MESSAGE);
    expect(resolveCorrectMessage({ correctMessage: "   " })).toBe(DEFAULT_CORRECT_MESSAGE);
    expect(resolveWrongMessage({})).toBe(DEFAULT_WRONG_MESSAGE);
    expect(resolveWrongMessage({ wrongMessage: "" })).toBe(DEFAULT_WRONG_MESSAGE);
  });
});

describe("normalizeText / normalizeLoose", () => {
  it("앞뒤 공백과 연속 공백, 대소문자를 흡수한다", () => {
    expect(normalizeText("  사라진   책의 행방 ")).toBe("사라진 책의 행방");
    expect(normalizeText("Case 01")).toBe("case 01");
  });

  it("normalizeLoose는 문장부호까지 지운다", () => {
    expect(normalizeLoose("이민열, 김도균.")).toBe("이민열 김도균");
    expect(normalizeLoose("'사라진 책'")).toBe("사라진 책");
  });
});

describe("matchAnswer — 객관식", () => {
  const spec: AnswerSpec = {
    type: "SINGLE_CHOICE",
    choices: [
      { id: "A", label: "서가 첫 번째 칸" },
      { id: "B", label: "계산대 아래" },
    ],
    correctChoiceIds: ["B"],
  };

  it("정답 보기를 고르면 통과한다", () => {
    expect(matchAnswer(spec, { type: "CHOICE", choiceIds: ["B"] })).toBe(true);
  });

  it("다른 보기를 고르면 통과하지 못한다", () => {
    expect(matchAnswer(spec, { type: "CHOICE", choiceIds: ["A"] })).toBe(false);
  });

  it("보기를 여러 개 고르면 통과하지 못한다", () => {
    expect(matchAnswer(spec, { type: "CHOICE", choiceIds: ["A", "B"] })).toBe(false);
    expect(matchAnswer(spec, { type: "CHOICE", choiceIds: [] })).toBe(false);
  });

  it("글자로 제출하면 통과하지 못한다", () => {
    expect(matchAnswer(spec, { type: "TEXT", value: "B" })).toBe(false);
  });
});

describe("matchAnswer — 복수 선택", () => {
  const spec: AnswerSpec = {
    type: "MULTI_CHOICE",
    choices: [
      { id: "A", label: "책" },
      { id: "B", label: "커피" },
      { id: "C", label: "사진" },
    ],
    correctChoiceIds: ["A", "C"],
  };

  it("순서와 상관없이 같은 조합이면 통과한다", () => {
    expect(matchAnswer(spec, { type: "CHOICE", choiceIds: ["C", "A"] })).toBe(true);
  });

  it("일부만 고르거나 더 고르면 통과하지 못한다", () => {
    expect(matchAnswer(spec, { type: "CHOICE", choiceIds: ["A"] })).toBe(false);
    expect(matchAnswer(spec, { type: "CHOICE", choiceIds: ["A", "B", "C"] })).toBe(false);
  });
});

describe("matchAnswer — 단답형", () => {
  const spec: AnswerSpec = {
    type: "SHORT_TEXT",
    accepted: ["사라진 책의 행방", "사라진책의행방"],
    match: "EXACT",
  };

  it("공백·문장부호·대소문자 차이를 흡수한다", () => {
    expect(matchAnswer(spec, { type: "TEXT", value: " 사라진 책의 행방. " })).toBe(true);
  });

  it("등록한 다른 정답도 통과한다", () => {
    expect(matchAnswer(spec, { type: "TEXT", value: "사라진책의행방" })).toBe(true);
  });

  it("다른 문장은 통과하지 못한다", () => {
    expect(matchAnswer(spec, { type: "TEXT", value: "사라진 책" })).toBe(false);
    expect(matchAnswer(spec, { type: "TEXT", value: "" })).toBe(false);
    expect(matchAnswer(spec, { type: "TEXT", value: "   " })).toBe(false);
  });

  it("CONTAINS는 정답이 들어 있으면 통과한다", () => {
    const contains: AnswerSpec = {
      type: "SHORT_TEXT",
      accepted: ["헌법논증이론"],
      match: "CONTAINS",
    };
    expect(matchAnswer(contains, { type: "TEXT", value: "책 제목은 헌법논증이론입니다" })).toBe(
      true,
    );
    expect(matchAnswer(contains, { type: "TEXT", value: "헌법" })).toBe(false);
  });
});

describe("matchAnswer — 숫자", () => {
  const spec: AnswerSpec = { type: "NUMBER", accepted: [79] };

  it("숫자만 입력하면 통과한다", () => {
    expect(matchAnswer(spec, { type: "TEXT", value: "79" })).toBe(true);
  });

  it("쉼표와 공백을 흡수한다", () => {
    expect(
      matchAnswer({ type: "NUMBER", accepted: [1200] }, { type: "TEXT", value: "1,200" }),
    ).toBe(true);
  });

  it("숫자가 아니면 통과하지 못한다", () => {
    expect(matchAnswer(spec, { type: "TEXT", value: "칠십구" })).toBe(false);
    expect(matchAnswer(spec, { type: "TEXT", value: "" })).toBe(false);
  });

  it("허용 오차를 설정할 수 있다", () => {
    const withTolerance: AnswerSpec = { type: "NUMBER", accepted: [1993], tolerance: 1 };
    expect(matchAnswer(withTolerance, { type: "TEXT", value: "1992" })).toBe(true);
    expect(matchAnswer(withTolerance, { type: "TEXT", value: "1990" })).toBe(false);
  });
});

describe("matchAnswer — 키워드", () => {
  it("ALL은 키워드가 모두 있어야 통과한다", () => {
    const spec: AnswerSpec = { type: "KEYWORDS", keywords: ["책", "사라"], match: "ALL" };
    expect(matchAnswer(spec, { type: "TEXT", value: "책이 사라졌다" })).toBe(true);
    expect(matchAnswer(spec, { type: "TEXT", value: "책이 있다" })).toBe(false);
  });

  it("ANY는 하나만 있어도 통과한다", () => {
    const spec: AnswerSpec = { type: "KEYWORDS", keywords: ["책", "서가"], match: "ANY" };
    expect(matchAnswer(spec, { type: "TEXT", value: "서가를 봤다" })).toBe(true);
    expect(matchAnswer(spec, { type: "TEXT", value: "모르겠다" })).toBe(false);
  });

  it("키워드가 비어 있으면 통과하지 못한다", () => {
    const spec: AnswerSpec = { type: "KEYWORDS", keywords: [], match: "ALL" };
    expect(matchAnswer(spec, { type: "TEXT", value: "아무거나" })).toBe(false);
  });
});
