import { describe, expect, it } from "vitest";

import { defaultStepTemplates, formatCaseNumber, isLastStep } from "./case.ts";
import { requiresQrToken } from "./step.ts";

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

describe("isLastStep", () => {
  it("가장 큰 순서일 때만 true", () => {
    const steps = [{ order: 0 }, { order: 2 }];
    expect(isLastStep(steps, 2)).toBe(true);
    expect(isLastStep(steps, 0)).toBe(false);
  });
});
