import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { NotExistError } from "../domain/errors.ts";
import { TEST_CASE } from "../domain/fixtures.ts";
import type { PlaySession } from "../domain/playSession.ts";
import type { Step } from "../domain/step.ts";
import createFakeCaseRepo from "../persistence/FakeCaseRepo.ts";
import {
  createFakePlaySessionRepo,
  createFakeStepAttemptRepo,
} from "../persistence/FakePlaySessionRepo.ts";
import createFakeStepRepo from "../persistence/FakeStepRepo.ts";
import { getCaseStats, getTodayOverview } from "./statsService.ts";

// KST로 9월 15일 오후 3시 30분.
const NOW = new Date("2026-09-15T06:30:00.000Z");
const TODAY = "2026-09-15T05:00:00.000Z";
const THREE_DAYS_AGO = "2026-09-12T05:00:00.000Z";
const TWENTY_DAYS_AGO = "2026-08-26T05:00:00.000Z";

const INTRO: Step = {
  id: "step-intro",
  caseId: TEST_CASE.id,
  order: 0,
  kind: "INTRO",
  name: "사건 소개",
  qrToken: null,
  published: true,
  title: "사건이 시작됩니다",
  body: "책방지기는 경찰에 신고하지 않았습니다.",
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

const FINAL: Step = { ...QR_ONE, id: "step-final", order: 2, kind: "FINAL", name: "마지막 단서" };

function session(overrides: Partial<PlaySession> = {}): PlaySession {
  return {
    id: "session-1",
    caseId: TEST_CASE.id,
    token: "token-1",
    status: "IN_PROGRESS",
    currentStepOrder: QR_ONE.order,
    startedAt: TODAY,
    lastSeenAt: TODAY,
    isTest: false,
    ...overrides,
  };
}

function contextWith(sessions: PlaySession[]) {
  return createFakeContext({
    repo: {
      case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE }),
      step: createFakeStepRepo(
        Object.fromEntries([INTRO, QR_ONE, FINAL].map((step) => [step.id, step])),
      ),
      playSession: createFakePlaySessionRepo(
        Object.fromEntries(sessions.map((item) => [item.id, item])),
      ),
      stepAttempt: createFakeStepAttemptRepo(),
    },
  });
}

describe("getCaseStats", () => {
  it("기간을 세션의 시작 시각으로 나누고, 테스트 세션은 언제나 뺀다", async () => {
    const ctx = contextWith([
      session({ id: "today", token: "token-today" }),
      session({ id: "week", token: "token-week", startedAt: THREE_DAYS_AGO }),
      session({ id: "old", token: "token-old", startedAt: TWENTY_DAYS_AGO }),
      session({ id: "test", token: "token-test", isTest: true }),
    ]);

    const today = await getCaseStats(ctx, { caseId: TEST_CASE.id, period: "today", now: NOW });
    const week = await getCaseStats(ctx, { caseId: TEST_CASE.id, period: "week", now: NOW });
    const all = await getCaseStats(ctx, { caseId: TEST_CASE.id, period: "all", now: NOW });

    expect([today.started, week.started, all.started]).toEqual([1, 2, 3]);
    expect(today.started).toBe(1);
    expect(all).toMatchObject({
      caseId: TEST_CASE.id,
      caseNumber: TEST_CASE.number,
      caseTitle: TEST_CASE.title,
      period: "all",
    });
  });

  it("완료율·평균 시간·단계별 지표를 세션과 시도에서 계산한다", async () => {
    const completed = session({
      id: "done",
      token: "token-done",
      status: "COMPLETED",
      currentStepOrder: FINAL.order,
      completedAt: "2026-09-15T05:20:00.000Z",
    });
    const ctx = contextWith([completed, session({ id: "stuck", token: "token-stuck" })]);
    await ctx.repo.stepAttempt.create({
      sessionId: "stuck",
      stepId: QR_ONE.id,
      submitted: "오답",
      correct: false,
      usedHint: true,
      createdAt: "2026-09-15T05:10:00.000Z",
    });

    const stats = await getCaseStats(ctx, { caseId: TEST_CASE.id, period: "all", now: NOW });

    expect(stats).toMatchObject({
      started: 2,
      completed: 1,
      completionRate: 0.5,
      averageMinutes: 20,
    });
    const qrOne = stats.steps.find((step) => step.stepId === QR_ONE.id);
    expect(qrOne).toMatchObject({ reached: 2, dropped: 1, hintCount: 1, firstTryCorrectRate: 0 });
    expect(stats.hardestStep).toEqual({
      stepId: QR_ONE.id,
      name: "QR 01",
      firstTryCorrectRate: 0,
    });
  });

  it("세션이 없으면 완료율 0으로 표시할 수 있는 값을 돌려준다", async () => {
    const ctx = contextWith([]);

    const stats = await getCaseStats(ctx, { caseId: TEST_CASE.id, period: "today", now: NOW });

    expect(stats).toMatchObject({
      started: 0,
      completed: 0,
      completionRate: 0,
      averageMinutes: undefined,
      hardestStep: undefined,
    });
  });

  it("없는 CASE는 NotExistError를 던진다", async () => {
    const ctx = contextWith([]);

    await expect(getCaseStats(ctx, { caseId: "nope", period: "all", now: NOW })).rejects.toThrow(
      NotExistError,
    );
  });
});

describe("getTodayOverview", () => {
  it("오늘 시작과 오늘 완료를 센다", async () => {
    const ctx = contextWith([
      session({ id: "a", token: "token-a" }),
      session({ id: "b", token: "token-b" }),
      session({
        id: "c",
        token: "token-c",
        status: "COMPLETED",
        completedAt: "2026-09-15T05:30:00.000Z",
      }),
      // 어제 시작해 어제 끝난 세션은 오늘 숫자에 들어가지 않는다.
      session({ id: "d", token: "token-d", startedAt: THREE_DAYS_AGO }),
      session({ id: "test", token: "token-test", isTest: true }),
    ]);

    expect(await getTodayOverview(ctx, { now: NOW })).toEqual({ started: 3, completed: 1 });
  });
});
