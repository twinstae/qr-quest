import { describe, expect, it } from "vitest";

import type { PlaySession } from "./playSession.ts";
import type { Step, StepKind } from "./step.ts";
import { nextOrderAfter, openStep, planTour, stampProgress, type TourOptions } from "./tourFlow.ts";

const CASE_ID = "case-1";

/** 사건 소개 → 문제 3개 → 마지막 단서(에필로그) → 사건 종결 뼈대. */
const STEPS: Step[] = [
  step(0, "intro", "INTRO"),
  step(1, "qr1", "QR"),
  step(2, "qr2", "QR"),
  step(3, "qr3", "QR"),
  step(4, "final", "FINAL"),
  step(5, "closing", "CLOSING"),
];

const ALL_OPTIONS: TourOptions = { freeOrder: true, prologueEnabled: true, epilogueEnabled: true };

function step(order: number, id: string, kind: StepKind, caseId = CASE_ID): Step {
  return {
    id,
    caseId,
    order,
    kind,
    name: id,
    qrToken: kind === "QR" || kind === "FINAL" ? `QR-${id}` : null,
    published: true,
    title: id,
    body: "",
    reveal: {},
  };
}

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

function open(
  input: Partial<Parameters<typeof openStep>[0]> & { step: Step },
): ReturnType<typeof openStep> {
  return openStep({
    steps: STEPS,
    options: ALL_OPTIONS,
    ...input,
  });
}

describe("planTour", () => {
  it("에필로그가 켜져 있으면 문제는 QR 단계만, 마지막 단서는 에필로그가 된다", () => {
    const plan = planTour(STEPS, { epilogueEnabled: true });

    expect(plan.problems.map((problem) => problem.id)).toEqual(["qr1", "qr2", "qr3"]);
    expect(plan.epilogue?.id).toBe("final");
  });

  it("에필로그를 끄면 마지막 단서는 투어에서 빠진다 — 문제(QR)만 풀면 완주한다", () => {
    const plan = planTour(STEPS, { epilogueEnabled: false });

    expect(plan.problems.map((problem) => problem.id)).toEqual(["qr1", "qr2", "qr3"]);
    expect(plan.epilogue).toBeUndefined();
  });

  it("마지막 단서가 없는 CASE는 에필로그가 없다 — 문제를 다 풀면 완주한다", () => {
    const plan = planTour(
      STEPS.filter((item) => item.kind !== "FINAL"),
      {
        epilogueEnabled: true,
      },
    );

    expect(plan.epilogue).toBeUndefined();
    expect(plan.problems).toHaveLength(3);
  });
});

describe("stampProgress", () => {
  it("푼 문제에만 스탬프가 찍힌다", () => {
    const plan = planTour(STEPS, { epilogueEnabled: true });

    const progress = stampProgress(plan, new Set(["qr2"]));

    expect(progress).toEqual({
      stamps: [
        { stepId: "qr1", name: "qr1", solved: false },
        { stepId: "qr2", name: "qr2", solved: true },
        { stepId: "qr3", name: "qr3", solved: false },
      ],
      resolved: 1,
      total: 3,
    });
  });

  it("아무것도 안 풀었으면 0/총 문제 수", () => {
    const progress = stampProgress(planTour(STEPS, { epilogueEnabled: true }), new Set());

    expect(progress.resolved).toBe(0);
    expect(progress.total).toBe(3);
  });
});

describe("openStep > 시작·완료·다른 사건", () => {
  it("세션이 없으면 아직 시작하지 않았다", () => {
    expect(open({ step: STEPS[1]! })).toEqual({ kind: "NOT_STARTED" });
  });

  it("다른 사건의 세션이면OTHER_CASE로 남긴다 (화면은 시작 안내로 풀어준다)", () => {
    expect(open({ session: session({ caseId: "case-2" }), step: STEPS[1]! })).toEqual({
      kind: "OTHER_CASE",
      sessionCaseId: "case-2",
    });
  });

  it("이미 완주한 세션은 완료로 본다", () => {
    expect(open({ session: session({ status: "COMPLETED" }), step: STEPS[1]! })).toEqual({
      kind: "COMPLETED",
    });
  });
});

describe("openStep > 자유 진행", () => {
  it("앞 단계를 건너뛰어도 문제는 열린다", () => {
    const result = open({ session: session({ currentStepOrder: 1 }), step: STEPS[3]! });

    expect(result).toEqual({ kind: "ALLOWED" });
  });

  it("이미 푼 문제를 다시 열어도 막지 않는다", () => {
    const result = open({ session: session({ currentStepOrder: 1 }), step: STEPS[1]! });

    expect(result).toEqual({ kind: "ALLOWED" });
  });

  it("에필로그는 문제를 모두 풀어야 연다", () => {
    const result = open({
      session: session({ currentStepOrder: 4 }),
      step: STEPS[4]!,
      solvedStepIds: new Set(["qr1", "qr2"]),
    });

    expect(result).toEqual({
      kind: "LOCKED",
      currentStepOrder: 4,
      requestedOrder: 4,
      reason: "EPILOGUE",
    });
  });

  it("문제를 모두 풀면 에필로그가 열린다", () => {
    const result = open({
      session: session({ currentStepOrder: 4 }),
      step: STEPS[4]!,
      solvedStepIds: new Set(["qr1", "qr2", "qr3"]),
    });

    expect(result).toEqual({ kind: "ALLOWED" });
  });

  it("에필로그가 꺼진 CASE의 마지막 단서는 잠기지 않는다 — 완주 조건이 아니기 때문이다", () => {
    const result = open({
      session: session({ currentStepOrder: 1 }),
      step: STEPS[4]!,
      options: { ...ALL_OPTIONS, epilogueEnabled: false },
    });

    expect(result).toEqual({ kind: "ALLOWED" });
  });
});

describe("openStep > 순차 진행 (자유 진행 꺼두었을 때)", () => {
  const sequential: TourOptions = { ...ALL_OPTIONS, freeOrder: false };

  it("지나온 단계와 현재 단계는 열 수 있다", () => {
    expect(
      open({ session: session({ currentStepOrder: 1 }), step: STEPS[1]!, options: sequential }),
    ).toEqual({
      kind: "ALLOWED",
    });
    expect(
      open({ session: session({ currentStepOrder: 2 }), step: STEPS[1]!, options: sequential }),
    ).toEqual({
      kind: "ALLOWED",
    });
  });

  it("앞 단계를 통과하지 않은 단계는 순서 이유와 함께 잠긴다", () => {
    expect(
      open({ session: session({ currentStepOrder: 1 }), step: STEPS[3]!, options: sequential }),
    ).toEqual({
      kind: "LOCKED",
      currentStepOrder: 1,
      requestedOrder: 3,
      reason: "ORDER",
    });
  });

  it("URL을 직접 입력해도 같은 판단을 한다", () => {
    const locked = open({
      session: session({ currentStepOrder: 0 }),
      step: STEPS[2]!,
      options: sequential,
    });
    expect(locked.kind).toBe("LOCKED");
  });
});

describe("openStep > 테스트 세션(요구 30-8)", () => {
  it("자유 진행을 꺼둔 CASE도 테스트 세션은 순서·에필로그 잠금을 건너뛴다", () => {
    const result = open({
      session: session({ isTest: true, currentStepOrder: 0 }),
      step: STEPS[4]!,
      options: { freeOrder: false, prologueEnabled: true, epilogueEnabled: true },
    });

    expect(result).toEqual({ kind: "ALLOWED" });
  });

  it("다른 사건의 QR은 여전히 막는다", () => {
    expect(
      open({ session: session({ isTest: true, caseId: "case-2" }), step: STEPS[1]! }).kind,
    ).toBe("OTHER_CASE");
  });

  it("완료된 테스트 세션은 여전히 완료로 본다", () => {
    expect(
      open({ session: session({ isTest: true, status: "COMPLETED" }), step: STEPS[1]! }).kind,
    ).toBe("COMPLETED");
  });
});

describe("nextOrderAfter", () => {
  const steps = [
    step(0, "a", "INTRO"),
    step(1, "b", "QR"),
    step(2, "c", "QR"),
    step(5, "d", "FINAL"),
  ];

  it("다음 순서를 돌려준다", () => {
    expect(nextOrderAfter(steps, 1)).toBe(2);
  });

  it("마지막 단계면 undefined", () => {
    expect(nextOrderAfter(steps, 5)).toBeUndefined();
  });
});
