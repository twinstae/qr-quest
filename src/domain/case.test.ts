import { describe, expect, it } from "vitest";

import {
  checkCaseLiveReadiness,
  defaultStepTemplates,
  describeLiveViolation,
  formatCaseNumber,
  isLastStep,
  type LiveViolation,
} from "./case.ts";
import { requiresQrToken, type Step } from "./step.ts";

describe("formatCaseNumber", () => {
  it("두 자리로 맞춘다", () => {
    expect(formatCaseNumber(1)).toBe("CASE 01");
    expect(formatCaseNumber(12)).toBe("CASE 12");
  });
});

describe("defaultStepTemplates", () => {
  const templates = defaultStepTemplates();

  it("사건 소개 → QR 4개 → 마지막 단서 → 사건 종결 순서로 만든다", () => {
    expect(templates.map((template) => template.name)).toEqual([
      "사건 소개",
      "QR 01",
      "QR 02",
      "QR 03",
      "QR 04",
      "마지막 단서",
      "사건 종결",
    ]);
  });

  it("순서는 0부터 빈틈없이 이어진다", () => {
    expect(templates.map((template) => template.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("QR 단계와 마지막 단서만 QR 토큰이 필요하다", () => {
    const needsToken = templates.filter((template) => requiresQrToken(template.kind));
    expect(needsToken.map((template) => template.name)).toEqual([
      "QR 01",
      "QR 02",
      "QR 03",
      "QR 04",
      "마지막 단서",
    ]);
  });

  it("QR 단계 수를 바꿀 수 있다", () => {
    const twoQr = defaultStepTemplates(2);
    expect(twoQr.map((template) => template.name)).toEqual([
      "사건 소개",
      "QR 01",
      "QR 02",
      "마지막 단서",
      "사건 종결",
    ]);
  });
});

describe("checkCaseLiveReadiness", () => {
  const baseStep: Step = {
    id: "step-1",
    caseId: "case-1",
    order: 0,
    kind: "QR",
    name: "QR 01",
    qrToken: "QRTOKEN001",
    published: true,
    title: "제목",
    body: "",
    reveal: {},
    answerSpec: { type: "SHORT_TEXT", accepted: ["정답"], match: "EXACT" },
  };

  it("완전한 CASE는 위반이 없다", () => {
    const steps: Step[] = [
      { ...baseStep, id: "intro", order: 0, kind: "INTRO", qrToken: null, body: "소개", answerSpec: undefined },
      { ...baseStep, id: "qr1", order: 1 },
      { ...baseStep, id: "final", order: 2, kind: "FINAL" },
      { ...baseStep, id: "closing", order: 3, kind: "CLOSING", qrToken: null, answerSpec: undefined },
    ];

    expect(checkCaseLiveReadiness(steps)).toEqual([]);
  });
});

describe("describeLiveViolation", () => {
  it("각 위반을 사람이 읽을 문구로 바꾼다", () => {
    const cases: [LiveViolation, string][] = [
      [{ kind: "ORDER_GAP" }, "단계 순서에 빈 자리가 있어요."],
      [{ kind: "MISSING_CLOSING" }, "사건 종결 화면이 없어요."],
      [{ kind: "MISSING_INTRO_BODY" }, "사건 소개 본문이 비어 있어요."],
      [
        { kind: "MISSING_ANSWER", stepId: "s1", stepName: "QR 02" },
        "QR 02 단계에 정답이 없어요.",
      ],
      [
        { kind: "MISSING_QR_TOKEN", stepId: "s1", stepName: "QR 02" },
        "QR 02 단계에 QR 코드가 없어요.",
      ],
    ];

    for (const [violation, expected] of cases) {
      expect(describeLiveViolation(violation)).toBe(expected);
    }
  });
});

describe("isLastStep", () => {
  it("가장 큰 순서일 때만 true", () => {
    const steps = [{ order: 0 }, { order: 2 }];
    expect(isLastStep(steps, 2)).toBe(true);
    expect(isLastStep(steps, 0)).toBe(false);
  });
});
