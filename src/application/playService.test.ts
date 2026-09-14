import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { NotExistError } from "../domain/errors.ts";
import { ANOTHER_CASE, TEST_CASE, TEST_STEP } from "../domain/fixtures.ts";
import type { PlaySession } from "../domain/playSession.ts";
import { DEFAULT_CORRECT_MESSAGE, DEFAULT_WRONG_MESSAGE, type Step } from "../domain/step.ts";
import createFakeCaseRepo from "../persistence/FakeCaseRepo.ts";
import { createFakePlaySessionRepo, createFakeStepAttemptRepo } from "../persistence/FakePlaySessionRepo.ts";
import createFakeStepRepo from "../persistence/FakeStepRepo.ts";
import {
  advanceNarrativeStep,
  getPlayProgress,
  getStepForPlay,
  requestHint,
  startOrResumeSession,
  submitAnswer,
} from "./playService.ts";

const INTRO_STEP: Step = {
  id: "step-intro",
  caseId: TEST_CASE.id,
  order: 0,
  kind: "INTRO",
  name: "사건 소개",
  qrToken: null,
  published: true,
  title: "사건이 시작됩니다",
  body: "책방지기가 아침에 아끼던 책 한 권이 사라진 것을 발견했습니다.",
  reveal: {},
};

const FINAL_STEP: Step = {
  ...TEST_STEP,
  id: "step-final",
  order: 5,
  kind: "FINAL",
  name: "마지막 단서",
  qrToken: "QRTOKENFIN",
  answerSpec: { type: "SHORT_TEXT", accepted: ["헌법논증이론"], match: "EXACT" },
};

const CLOSING_STEP: Step = {
  id: "step-closing",
  caseId: TEST_CASE.id,
  order: 6,
  kind: "CLOSING",
  name: "사건 종결",
  qrToken: null,
  published: true,
  title: "사건이 종결되었습니다",
  body: "감사합니다.",
  reveal: {},
};

function contextWith(input: { steps?: Step[]; sessions?: PlaySession[] } = {}) {
  const steps = input.steps ?? [INTRO_STEP, TEST_STEP, FINAL_STEP, CLOSING_STEP];
  const sessions = input.sessions ?? [];
  return createFakeContext({
    repo: {
      case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE, [ANOTHER_CASE.id]: ANOTHER_CASE }),
      step: createFakeStepRepo(Object.fromEntries(steps.map((step) => [step.id, step]))),
      playSession: createFakePlaySessionRepo(
        Object.fromEntries(sessions.map((session) => [session.id, session])),
      ),
      stepAttempt: createFakeStepAttemptRepo(),
    },
  });
}

function activeSession(overrides: Partial<PlaySession> = {}): PlaySession {
  const now = new Date().toISOString();
  return {
    id: "session-1",
    caseId: TEST_CASE.id,
    token: "session-token",
    status: "IN_PROGRESS",
    currentStepOrder: TEST_STEP.order,
    startedAt: now,
    lastSeenAt: now,
    isTest: false,
    ...overrides,
  };
}

describe("startOrResumeSession", () => {
  it("시작 QR을 찍으면 세션을 만들고 currentStepOrder는 INTRO 순서다", async () => {
    const ctx = contextWith();

    const result = await startOrResumeSession(ctx, { entryToken: TEST_CASE.entryToken });

    expect(result.caseId).toBe(TEST_CASE.id);
    expect(result.currentStepOrder).toBe(INTRO_STEP.order);
    expect(result.status).toBe("IN_PROGRESS");
    expect(result.resumed).toBe(false);
    expect(result.token).toEqual(expect.any(String));
  });

  it("같은 시작 QR을 다시 스캔하면 기존 세션을 이어간다", async () => {
    const existing = activeSession({ currentStepOrder: 3 });
    const ctx = contextWith({ sessions: [existing] });

    const result = await startOrResumeSession(ctx, {
      entryToken: TEST_CASE.entryToken,
      existingToken: existing.token,
    });

    expect(result.token).toBe(existing.token);
    expect(result.currentStepOrder).toBe(3);
    expect(result.resumed).toBe(true);

    const sessions = await ctx.repo.playSession.listByCaseId(TEST_CASE.id);
    expect(sessions).toHaveLength(1);
  });

  it("이미 완료한 세션이면 완료 화면용 데이터를 돌려준다", async () => {
    const completed = activeSession({
      status: "COMPLETED",
      completionCode: "79-1-K7QP",
      currentStepOrder: FINAL_STEP.order,
    });
    const ctx = contextWith({ sessions: [completed] });

    const result = await startOrResumeSession(ctx, {
      entryToken: TEST_CASE.entryToken,
      existingToken: completed.token,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.completionCode).toBe("79-1-K7QP");
  });

  it("없는 시작 토큰은 NotExistError를 던진다", async () => {
    const ctx = contextWith();

    await expect(startOrResumeSession(ctx, { entryToken: "NOPE" })).rejects.toThrow(
      NotExistError,
    );
  });
});

describe("getStepForPlay", () => {
  it("세션 없이 단계에 들어가면 NOT_STARTED", async () => {
    const ctx = contextWith();

    const result = await getStepForPlay(ctx, { qrToken: TEST_STEP.qrToken ?? "" });

    expect(result).toEqual({ kind: "NOT_STARTED", caseId: TEST_CASE.id });
  });

  it("순서를 건너뛰면 LOCKED와 현재 단계 이름을 함께 돌려준다", async () => {
    const session = activeSession({ currentStepOrder: 0 });
    const ctx = contextWith({ sessions: [session] });

    const result = await getStepForPlay(ctx, {
      qrToken: FINAL_STEP.qrToken ?? "",
      sessionToken: session.token,
    });

    expect(result).toEqual({
      kind: "LOCKED",
      caseId: TEST_CASE.id,
      currentStepOrder: 0,
      requestedOrder: FINAL_STEP.order,
      stepName: INTRO_STEP.name,
    });
  });

  it("다른 CASE의 QR을 찍으면 OTHER_CASE", async () => {
    const session = activeSession({ caseId: ANOTHER_CASE.id });
    const ctx = contextWith({ sessions: [session] });

    const result = await getStepForPlay(ctx, {
      qrToken: TEST_STEP.qrToken ?? "",
      sessionToken: session.token,
    });

    expect(result).toEqual({
      kind: "OTHER_CASE",
      caseId: TEST_CASE.id,
      sessionCaseId: ANOTHER_CASE.id,
    });
  });

  it("허용된 단계는 정답 없는 내용을 돌려준다", async () => {
    const session = activeSession();
    const ctx = contextWith({ sessions: [session] });

    const result = await getStepForPlay(ctx, {
      qrToken: TEST_STEP.qrToken ?? "",
      sessionToken: session.token,
    });

    expect(result.kind).toBe("ALLOWED");
    if (result.kind === "ALLOWED") {
      expect(result.step.id).toBe(TEST_STEP.id);
      expect(JSON.stringify(result.step)).not.toContain("accepted");
      // 힌트 글자는 별도 엔드포인트로만 받는다 — 있는지 여부만 이 응답에 담는다.
      expect(result.step).not.toHaveProperty("hint");
      expect(result.step.hasHint).toBe(true);
    }
  });

  it("일반 세션에는 정답 요약(debugAnswer)을 담지 않는다", async () => {
    const session = activeSession();
    const ctx = contextWith({ sessions: [session] });

    const result = await getStepForPlay(ctx, {
      qrToken: TEST_STEP.qrToken ?? "",
      sessionToken: session.token,
    });

    expect(result.kind).toBe("ALLOWED");
    if (result.kind === "ALLOWED") {
      expect(result.step.debugAnswer).toBeUndefined();
    }
  });

  it("테스트 세션에는 관리자용 정답 요약(debugAnswer)을 담는다", async () => {
    const session = activeSession({ isTest: true });
    const ctx = contextWith({ sessions: [session] });

    const result = await getStepForPlay(ctx, {
      qrToken: TEST_STEP.qrToken ?? "",
      sessionToken: session.token,
    });

    expect(result.kind).toBe("ALLOWED");
    if (result.kind === "ALLOWED") {
      expect(result.step.debugAnswer).toBe("이민열, 김도균");
    }
  });

  it("없는 QR 토큰은 NotExistError를 던진다", async () => {
    const ctx = contextWith();

    await expect(getStepForPlay(ctx, { qrToken: "NOPE" })).rejects.toThrow(NotExistError);
  });
});

describe("submitAnswer", () => {
  it("정답을 맞히면 currentStepOrder가 전진하고 시도가 기록된다", async () => {
    const session = activeSession();
    const ctx = contextWith({ sessions: [session] });

    const result = await submitAnswer(ctx, {
      stepId: TEST_STEP.id,
      sessionToken: session.token,
      submission: { type: "TEXT", value: "이민열, 김도균" },
    });

    expect(result).toEqual({
      kind: "CORRECT",
      reveal: TEST_STEP.reveal,
      message: DEFAULT_CORRECT_MESSAGE,
    });

    const updated = await ctx.repo.playSession.getById(session.id);
    expect(updated?.currentStepOrder).toBe(FINAL_STEP.order);

    const attempts = await ctx.repo.stepAttempt.listBySessionId(session.id);
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ stepId: TEST_STEP.id, correct: true });
  });

  it("오답이면 전진하지 않고, 시도는 기록되며, 횟수 제한이 없다", async () => {
    const session = activeSession();
    const ctx = contextWith({ sessions: [session] });

    for (let i = 0; i < 3; i++) {
      const result = await submitAnswer(ctx, {
        stepId: TEST_STEP.id,
        sessionToken: session.token,
        submission: { type: "TEXT", value: "엉뚱한 답" },
      });
      expect(result).toEqual({ kind: "INCORRECT", message: DEFAULT_WRONG_MESSAGE });
    }

    const updated = await ctx.repo.playSession.getById(session.id);
    expect(updated?.currentStepOrder).toBe(TEST_STEP.order);

    const attempts = await ctx.repo.stepAttempt.listBySessionId(session.id);
    expect(attempts).toHaveLength(3);
    expect(attempts.every((attempt) => !attempt.correct)).toBe(true);
  });

  it("FINAL 정답을 맞히면 세션이 COMPLETED되고 완료 코드가 발급된다", async () => {
    const session = activeSession({ currentStepOrder: FINAL_STEP.order });
    const ctx = contextWith({ sessions: [session] });

    const result = await submitAnswer(ctx, {
      stepId: FINAL_STEP.id,
      sessionToken: session.token,
      submission: { type: "TEXT", value: "헌법논증이론" },
    });

    expect(result.kind).toBe("CORRECT");
    if (result.kind === "CORRECT") {
      expect(result.completionCode).toEqual(expect.any(String));
    }

    const updated = await ctx.repo.playSession.getById(session.id);
    expect(updated?.status).toBe("COMPLETED");
    expect(updated?.completionCode).toEqual(expect.any(String));
  });

  it("잠긴 단계에 제출하면 LOCKED를 돌려주고 아무 것도 바꾸지 않는다", async () => {
    const session = activeSession({ currentStepOrder: 0 });
    const ctx = contextWith({ sessions: [session] });

    const result = await submitAnswer(ctx, {
      stepId: FINAL_STEP.id,
      sessionToken: session.token,
      submission: { type: "TEXT", value: "헌법논증이론" },
    });

    expect(result.kind).toBe("LOCKED");
    const attempts = await ctx.repo.stepAttempt.listBySessionId(session.id);
    expect(attempts).toHaveLength(0);
  });

  it("단계에 커스텀 정답/오답 메시지가 있으면 그대로 내려준다", async () => {
    const customStep: Step = {
      ...TEST_STEP,
      correctMessage: "완벽해요!",
      wrongMessage: "힌트를 다시 읽어보세요.",
    };
    const session = activeSession();
    const ctx = contextWith({ steps: [customStep], sessions: [session] });

    const correct = await submitAnswer(ctx, {
      stepId: customStep.id,
      sessionToken: session.token,
      submission: { type: "TEXT", value: "이민열, 김도균" },
    });
    expect(correct).toMatchObject({ kind: "CORRECT", message: "완벽해요!" });

    const incorrect = await submitAnswer(ctx, {
      stepId: customStep.id,
      sessionToken: session.token,
      submission: { type: "TEXT", value: "엉뚱한 답" },
    });
    expect(incorrect).toEqual({ kind: "INCORRECT", message: "힌트를 다시 읽어보세요." });
  });
});

describe("requestHint", () => {
  it("힌트를 요청하면 usedHint가 기록되고, 반복 요청해도 1회로 집계된다", async () => {
    const session = activeSession();
    const ctx = contextWith({ sessions: [session] });

    const first = await requestHint(ctx, { stepId: TEST_STEP.id, sessionToken: session.token });
    const second = await requestHint(ctx, { stepId: TEST_STEP.id, sessionToken: session.token });

    expect(first).toMatchObject({ hint: TEST_STEP.hint });
    expect(second).toMatchObject({ hint: TEST_STEP.hint });

    const attempts = await ctx.repo.stepAttempt.listBySessionId(session.id);
    expect(attempts.filter((attempt) => attempt.usedHint)).toHaveLength(1);
  });

  it("잠긴 단계의 힌트는 요청할 수 없다", async () => {
    const session = activeSession({ currentStepOrder: 0 });
    const ctx = contextWith({ sessions: [session] });

    const result = await requestHint(ctx, { stepId: FINAL_STEP.id, sessionToken: session.token });

    expect(result.kind).toBe("LOCKED");
  });
});

describe("advanceNarrativeStep", () => {
  it("INTRO 단계를 지나면 다음 순서가 열린다", async () => {
    const session = activeSession({ currentStepOrder: INTRO_STEP.order });
    const ctx = contextWith({ sessions: [session] });

    const result = await advanceNarrativeStep(ctx, {
      stepId: INTRO_STEP.id,
      sessionToken: session.token,
    });

    expect(result).toEqual({ kind: "ADVANCED" });
    const updated = await ctx.repo.playSession.getById(session.id);
    expect(updated?.currentStepOrder).toBe(TEST_STEP.order);
  });
});

describe("getPlayProgress", () => {
  it("세션이 없으면 NOT_STARTED", async () => {
    const ctx = contextWith();

    const result = await getPlayProgress(ctx, { caseId: TEST_CASE.id });

    expect(result).toEqual({ kind: "NOT_STARTED" });
  });

  it("INTRO 단계에서는 소개 내용을 돌려준다", async () => {
    const session = activeSession({ currentStepOrder: INTRO_STEP.order });
    const ctx = contextWith({ sessions: [session] });

    const result = await getPlayProgress(ctx, { caseId: TEST_CASE.id, sessionToken: session.token });

    expect(result.kind).toBe("NARRATIVE");
    if (result.kind === "NARRATIVE") expect(result.step.id).toBe(INTRO_STEP.id);
  });

  it("QR 단계를 찾는 중에는 진행 상황을 돌려준다", async () => {
    const session = activeSession({ currentStepOrder: TEST_STEP.order });
    const ctx = contextWith({ sessions: [session] });

    const result = await getPlayProgress(ctx, { caseId: TEST_CASE.id, sessionToken: session.token });

    expect(result).toEqual({
      kind: "WAITING",
      stepName: TEST_STEP.name,
      resolved: 1,
      total: 2,
    });
  });

  it("완료 후에는 완료 코드와 종결 내용을 돌려준다", async () => {
    const session = activeSession({
      status: "COMPLETED",
      completionCode: "79-1-K7QP",
      currentStepOrder: CLOSING_STEP.order,
    });
    const ctx = contextWith({ sessions: [session] });

    const result = await getPlayProgress(ctx, { caseId: TEST_CASE.id, sessionToken: session.token });

    expect(result).toEqual({
      kind: "COMPLETED",
      completionCode: "79-1-K7QP",
      closing: expect.objectContaining({ id: CLOSING_STEP.id }),
    });
  });
});
