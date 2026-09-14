import { describe, expect, it } from "vitest";

import type { PlaySession } from "./playSession.ts";
import type { Step } from "./step.ts";
import { nextOrderAfter, openStep, progressOf } from "./tourFlow.ts";

const CASE_ID = "case-1";

function session(overrides: Partial<PlaySession> = {}): PlaySession {
  return {
    id: "session-1",
    caseId: CASE_ID,
    token: "token",
    status: "IN_PROGRESS",
    currentStepOrder: 1,
    startedAt: "2026-09-14T10:00:00.000Z",
    lastSeenAt: "2026-09-14T10:05:00.000Z",
    isTest: false,
    ...overrides,
  };
}

describe("openStep > 테스트 세션(요구 30-8)", () => {
  it("잠금을 건너뛰고 모든 단계에 들어갈 수 있다", () => {
    expect(
      openStep({ session: session({ isTest: true, currentStepOrder: 0 }), step: step(5) }),
    ).toEqual({ kind: "ALLOWED" });
  });

  it("다른 사건의 QR은 여전히 막는다", () => {
    expect(
      openStep({ session: session({ isTest: true }), step: step(1, "case-2") }).kind,
    ).toBe("OTHER_CASE");
  });

  it("완료된 테스트 세션은 여전히 완료로 본다", () => {
    expect(
      openStep({
        session: session({ isTest: true, status: "COMPLETED", currentStepOrder: 5 }),
        step: step(2),
      }).kind,
    ).toBe("COMPLETED");
  });
});

function step(order: number, caseId = CASE_ID) {
  return { caseId, order };
}

describe("openStep", () => {
  it("세션이 없으면 시작 QR을 안내한다", () => {
    expect(openStep({ step: step(1) })).toEqual({ kind: "NOT_STARTED" });
  });

  it("지나온 단계와 현재 단계는 열 수 있다", () => {
    expect(openStep({ session: session(), step: step(0) })).toEqual({ kind: "ALLOWED" });
    expect(openStep({ session: session(), step: step(1) })).toEqual({ kind: "ALLOWED" });
  });

  it("앞 단계를 통과하지 않은 단계는 잠긴다", () => {
    expect(openStep({ session: session(), step: step(3) })).toEqual({
      kind: "LOCKED",
      currentStepOrder: 1,
      requestedOrder: 3,
    });
  });

  it("URL을 직접 입력해도 같은 판단을 한다", () => {
    // 화면은 세션을 보지 않고 이 함수의 결과만 표시한다.
    const locked = openStep({ session: session({ currentStepOrder: 0 }), step: step(4) });
    expect(locked.kind).toBe("LOCKED");
  });

  it("이미 완주한 세션은 완료로 본다", () => {
    expect(
      openStep({ session: session({ status: "COMPLETED", currentStepOrder: 5 }), step: step(2) }),
    ).toEqual({ kind: "COMPLETED" });
  });

  it("다른 사건의 QR을 찍으면 알려준다", () => {
    expect(openStep({ session: session(), step: step(1, "case-2") })).toEqual({
      kind: "OTHER_CASE",
      sessionCaseId: CASE_ID,
    });
  });
});

describe("nextOrderAfter", () => {
  const steps = [step(0), step(1), step(2), step(5)];

  it("다음 순서를 돌려준다", () => {
    expect(nextOrderAfter(steps, 1)).toBe(2);
  });

  it("마지막 단계면 undefined", () => {
    expect(nextOrderAfter(steps, 5)).toBeUndefined();
  });
});

describe("progressOf", () => {
  const steps: Pick<Step, "order" | "kind">[] = [
    { order: 0, kind: "INTRO" },
    { order: 1, kind: "QR" },
    { order: 2, kind: "QR" },
    { order: 3, kind: "QR" },
    { order: 4, kind: "QR" },
    { order: 5, kind: "FINAL" },
    { order: 6, kind: "CLOSING" },
  ];

  it("QR 단계만 세고, 소개/완료 화면은 세지 않는다", () => {
    expect(progressOf(steps, 0)).toEqual({ resolved: 0, total: 5 });
    expect(progressOf(steps, 2)).toEqual({ resolved: 2, total: 5 });
    expect(progressOf(steps, 6)).toEqual({ resolved: 5, total: 5 });
  });
});
