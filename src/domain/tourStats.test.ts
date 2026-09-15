import { describe, expect, it } from "vitest";

import { TEST_CASE } from "./fixtures.ts";
import type { PlaySession, StepAttempt } from "./playSession.ts";
import type { Step } from "./step.ts";
import { formatPercent, periodSinceIso, startOfDayIso, summarizeCaseStats } from "./tourStats.ts";

const INTRO: Step = {
  id: "step-intro",
  caseId: TEST_CASE.id,
  order: 0,
  kind: "INTRO",
  name: "사건 소개",
  qrToken: null,
  published: true,
  title: "사건이 시작됩니다",
  body: "책방지기가 경찰에 신고하지 않았습니다.",
  reveal: {},
};

const QR_ONE: Step = {
  ...INTRO,
  id: "step-qr1",
  order: 1,
  kind: "QR",
  name: "QR 01",
  qrToken: "QRTOKEN001",
  answerSpec: { type: "SHORT_TEXT", accepted: ["정답"], match: "EXACT" },
};

const FINAL: Step = {
  ...QR_ONE,
  id: "step-final",
  order: 2,
  kind: "FINAL",
  name: "마지막 단서",
};

const CLOSING: Step = {
  ...INTRO,
  id: "step-closing",
  order: 3,
  kind: "CLOSING",
  name: "사건 종결",
};

const STEPS = [INTRO, QR_ONE, FINAL, CLOSING];

function session(overrides: Partial<PlaySession> = {}): PlaySession {
  return {
    id: "session-1",
    caseId: TEST_CASE.id,
    token: "token-1",
    status: "IN_PROGRESS",
    currentStepOrder: 0,
    startedAt: "2026-09-15T06:00:00.000Z",
    lastSeenAt: "2026-09-15T06:00:00.000Z",
    isTest: false,
    ...overrides,
  };
}

/** 시작 시각으로부터 분 단위로 완료한 세션. */
function completedAfter(id: string, minutes: number): PlaySession {
  const startedAt = "2026-09-15T06:00:00.000Z";
  return session({
    id,
    token: `token-${id}`,
    status: "COMPLETED",
    currentStepOrder: FINAL.order,
    startedAt,
    completedAt: new Date(Date.parse(startedAt) + minutes * 60_000).toISOString(),
  });
}

function attempt(
  sessionId: string,
  stepId: string,
  options: { correct: boolean; usedHint?: boolean; at: string },
): StepAttempt {
  return {
    id: `${sessionId}-${stepId}-${options.at}`,
    sessionId,
    stepId,
    submitted: "제출값",
    correct: options.correct,
    usedHint: options.usedHint ?? false,
    createdAt: options.at,
  };
}

describe("summarizeCaseStats", () => {
  it("완료율과 평균 시간을 내고, 24시간을 넘긴 세션은 평균에서 뺀다", () => {
    const sessions = [
      completedAfter("a", 15),
      completedAfter("b", 20),
      completedAfter("c", 25),
      completedAfter("long", 30 * 60),
      session({ id: "d", token: "token-d", currentStepOrder: QR_ONE.order }),
    ];

    const stats = summarizeCaseStats({ steps: STEPS, sessions, attempts: [] });

    expect(stats.started).toBe(5);
    expect(stats.completed).toBe(4);
    expect(stats.inProgress).toBe(1);
    expect(stats.completionRate).toBe(0.8);
    expect(stats.averageMinutes).toBe(20);
    expect(stats.excludedLongSessions).toBe(1);
  });

  it("단계별 도달·이탈을 세고, 종결 화면은 표에서 뺀다", () => {
    const sessions = [
      completedAfter("a", 15),
      session({ id: "b", token: "token-b", currentStepOrder: QR_ONE.order }),
      session({ id: "c", token: "token-c", currentStepOrder: FINAL.order }),
    ];

    const stats = summarizeCaseStats({ steps: STEPS, sessions, attempts: [] });

    expect(stats.steps.map((step) => step.stepId)).toEqual([INTRO.id, QR_ONE.id, FINAL.id]);

    const qrOne = stats.steps.find((step) => step.stepId === QR_ONE.id);
    expect(qrOne).toMatchObject({ reached: 3, dropped: 1 });
    expect(qrOne?.dropRate).toBeCloseTo(1 / 3);

    const intro = stats.steps.find((step) => step.stepId === INTRO.id);
    expect(intro).toMatchObject({ reached: 3, dropped: 0 });
  });

  it("첫 시도 정답률과 총 시도 정답률을 구분한다", () => {
    const attempts = [
      attempt("a", QR_ONE.id, { correct: false, at: "2026-09-15T06:01:00.000Z" }),
      attempt("a", QR_ONE.id, { correct: true, at: "2026-09-15T06:02:00.000Z" }),
      attempt("b", QR_ONE.id, { correct: true, at: "2026-09-15T06:03:00.000Z" }),
    ];
    const sessions = [
      completedAfter("a", 15),
      session({ id: "b", token: "token-b", currentStepOrder: FINAL.order }),
    ];

    const stats = summarizeCaseStats({ steps: STEPS, sessions, attempts });
    const qrOne = stats.steps.find((step) => step.stepId === QR_ONE.id);

    expect(qrOne?.attemptedSessions).toBe(2);
    expect(qrOne?.firstTryCorrectRate).toBe(0.5);
    expect(qrOne?.attemptCorrectRate).toBeCloseTo(2 / 3);
  });

  it("힌트 사용 횟수와 가장 어려운 단계·힌트를 많이 쓴 단계를 찾는다", () => {
    const attempts = [
      attempt("a", QR_ONE.id, { correct: false, usedHint: true, at: "2026-09-15T06:01:00.000Z" }),
      attempt("a", QR_ONE.id, { correct: true, at: "2026-09-15T06:02:00.000Z" }),
      attempt("b", FINAL.id, { correct: true, usedHint: true, at: "2026-09-15T06:03:00.000Z" }),
      attempt("c", FINAL.id, { correct: true, usedHint: true, at: "2026-09-15T06:04:00.000Z" }),
    ];
    const sessions = [
      completedAfter("a", 15),
      completedAfter("b", 20),
      session({ id: "c", token: "token-c", currentStepOrder: FINAL.order }),
    ];

    const stats = summarizeCaseStats({ steps: STEPS, sessions, attempts });

    expect(stats.steps.find((step) => step.stepId === FINAL.id)?.hintCount).toBe(2);
    expect(stats.hardestStep).toEqual({
      stepId: QR_ONE.id,
      name: "QR 01",
      firstTryCorrectRate: 0,
    });
    expect(stats.mostHintedStep).toEqual({
      stepId: FINAL.id,
      name: "마지막 단서",
      hintCount: 2,
    });
  });

  it("세션이 없으면 0으로 나누지 않고 표시할 수 있는 값을 돌려준다", () => {
    const stats = summarizeCaseStats({ steps: STEPS, sessions: [], attempts: [] });

    expect(stats).toMatchObject({
      started: 0,
      completed: 0,
      inProgress: 0,
      completionRate: 0,
      averageMinutes: undefined,
      excludedLongSessions: 0,
      hardestStep: undefined,
      mostHintedStep: undefined,
    });
    expect(stats.steps.every((step) => step.reached === 0 && step.dropRate === 0)).toBe(true);
    expect(formatPercent(stats.completionRate)).toBe("0%");
  });

  it("단계마다 다음에 무엇을 하면 되는지 한 줄을 붙인다", () => {
    const attempts = [
      attempt("a", QR_ONE.id, { correct: false, at: "2026-09-15T06:01:00.000Z" }),
      attempt("b", QR_ONE.id, { correct: false, at: "2026-09-15T06:02:00.000Z" }),
      attempt("c", QR_ONE.id, { correct: true, at: "2026-09-15T06:03:00.000Z" }),
    ];
    const sessions = [completedAfter("a", 15), completedAfter("b", 20), completedAfter("c", 25)];

    const stats = summarizeCaseStats({ steps: STEPS, sessions, attempts });

    // 첫 시도 정답률 33% → 힌트를 손보라고 안내한다.
    expect(stats.steps.find((step) => step.stepId === QR_ONE.id)?.advice).toBe(
      "힌트를 조금 더 친절하게 바꿔보세요.",
    );
    // FINAL은 접근 자체가 없었다.
    expect(stats.steps.find((step) => step.stepId === FINAL.id)?.advice).toBe(
      "아직 아무도 여기까지 오지 않았어요.",
    );
    expect(stats.steps.find((step) => step.stepId === INTRO.id)?.advice).toBe(
      "잘 지나가고 있어요.",
    );

    // 모두 첫 시도에 맞혔으면 손대지 말라고 안내한다.
    const easy = summarizeCaseStats({
      steps: STEPS,
      sessions,
      attempts: [attempt("a", QR_ONE.id, { correct: true, at: "2026-09-15T06:01:00.000Z" })],
    });
    expect(easy.steps.find((step) => step.stepId === QR_ONE.id)?.advice).toBe(
      "지금 난이도가 적당해요.",
    );
  });
});

describe("startOfDayIso / periodSinceIso", () => {
  it("책방 기준(KST) 하루의 시작을 돌려준다", () => {
    // KST로 9월 15일 23:30.
    const now = new Date("2026-09-15T14:30:00.000Z");

    expect(startOfDayIso(now)).toBe("2026-09-14T15:00:00.000Z");
    expect(periodSinceIso("today", now)).toBe("2026-09-14T15:00:00.000Z");
    expect(periodSinceIso("week", now)).toBe("2026-09-08T15:00:00.000Z");
    expect(periodSinceIso("all", now)).toBeUndefined();
  });

  it("자정 직후에도 오늘은 오늘이다", () => {
    const now = new Date("2026-09-15T15:05:00.000Z");

    const since = periodSinceIso("today", now);
    expect(since).toBe("2026-09-15T15:00:00.000Z");
    // KST 9월 16일 00:00에 시작한 세션은 오늘 안에 들어온다.
    expect(Date.parse("2026-09-15T15:01:00.000Z")).toBeGreaterThanOrEqual(Date.parse(since!));
    // KST 9월 15일 23:59에 시작한 세션은 어제다.
    expect(Date.parse("2026-09-15T14:59:00.000Z")).toBeLessThan(Date.parse(since!));
  });
});
