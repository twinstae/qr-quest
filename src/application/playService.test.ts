import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import type { Case } from "../domain/case.ts";
import { NotExistError } from "../domain/errors.ts";
import { ANOTHER_CASE, ANOTHER_STEP, TEST_CASE, TEST_STEP } from "../domain/fixtures.ts";
import type { PlaySession } from "../domain/playSession.ts";
import { DEFAULT_CORRECT_MESSAGE, DEFAULT_WRONG_MESSAGE, type Step } from "../domain/step.ts";
import createFakeCaseRepo from "../persistence/FakeCaseRepo.ts";
import {
  createFakePlaySessionRepo,
  createFakeStepAttemptRepo,
} from "../persistence/FakePlaySessionRepo.ts";
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

function contextWith(
  input: { cases?: Record<string, Case>; steps?: Step[]; sessions?: PlaySession[] } = {},
) {
  const steps = input.steps ?? [INTRO_STEP, TEST_STEP, FINAL_STEP, CLOSING_STEP];
  const sessions = input.sessions ?? [];
  return createFakeContext({
    repo: {
      case: createFakeCaseRepo(
        input.cases ?? { [TEST_CASE.id]: TEST_CASE, [ANOTHER_CASE.id]: ANOTHER_CASE },
      ),
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

/** 세션이 이미 문제를 풀었다는 기록 — 완주·에필로그 잠금은 시도 기록으로만 판단한다. */
async function markSolved(
  ctx: ReturnType<typeof contextWith>,
  sessionId: string,
  stepId: string,
): Promise<void> {
  await ctx.repo.stepAttempt.create({
    sessionId,
    stepId,
    submitted: "",
    correct: true,
    usedHint: false,
    createdAt: new Date().toISOString(),
  });
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
      existingTokens: [existing.token],
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
      existingTokens: [completed.token],
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.completionCode).toBe("79-1-K7QP");
  });

  it("없는 시작 토큰은 NotExistError를 던진다", async () => {
    const ctx = contextWith();

    await expect(startOrResumeSession(ctx, { entryToken: "NOPE" })).rejects.toThrow(NotExistError);
  });
});

describe("getStepForPlay", () => {
  it("세션 없이 단계에 들어가면 아직 시작 전이라고 안내한다", async () => {
    const ctx = contextWith();

    const result = await getStepForPlay(ctx, { qrToken: TEST_STEP.qrToken ?? "" });

    expect(result).toEqual({
      kind: "NOT_STARTED",
      caseId: TEST_CASE.id,
      message: "먼저 시작 QR을 찍어주세요.",
    });
  });

  it("에필로그를 아직 열 수 없으면 이유와 함께 LOCKED", async () => {
    const session = activeSession({ currentStepOrder: 0 });
    const ctx = contextWith({ sessions: [session] });

    const result = await getStepForPlay(ctx, {
      qrToken: FINAL_STEP.qrToken ?? "",
      sessionTokens: [session.token],
    });

    expect(result).toEqual({
      kind: "LOCKED",
      caseId: TEST_CASE.id,
      currentStepOrder: 0,
      requestedOrder: FINAL_STEP.order,
      stepName: INTRO_STEP.name,
      message: "아직 문제를 다 풀지 않았어요. 남은 문제를 모두 풀면 에필로그 QR을 찍을 수 있어요.",
    });
  });

  it("다른 CASE 세션이 있어도 이 CASE는 아직 시작 전으로 안내한다", async () => {
    const session = activeSession({ caseId: ANOTHER_CASE.id });
    const ctx = contextWith({ sessions: [session] });

    const result = await getStepForPlay(ctx, {
      qrToken: TEST_STEP.qrToken ?? "",
      sessionTokens: [session.token],
    });

    expect(result).toEqual({
      kind: "NOT_STARTED",
      caseId: TEST_CASE.id,
      message: "먼저 시작 QR을 찍어주세요.",
    });
  });

  it("허용된 단계는 정답 없는 내용을 돌려준다", async () => {
    const session = activeSession();
    const ctx = contextWith({ sessions: [session] });

    const result = await getStepForPlay(ctx, {
      qrToken: TEST_STEP.qrToken ?? "",
      sessionTokens: [session.token],
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
      sessionTokens: [session.token],
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
      sessionTokens: [session.token],
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
      sessionTokens: [session.token],
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
        sessionTokens: [session.token],
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
    // 에필로그는 문제를 모두 풀어야 열린다 — QR 문제를 풀었다는 기록이 먼저 있어야 한다.
    await markSolved(ctx, session.id, TEST_STEP.id);

    const result = await submitAnswer(ctx, {
      stepId: FINAL_STEP.id,
      sessionTokens: [session.token],
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

  it("완료 코드는 세션당 하나만 발급되고, 다시 들어와도 같은 코드다", async () => {
    const session = activeSession({ currentStepOrder: FINAL_STEP.order });
    const ctx = contextWith({ sessions: [session] });
    await markSolved(ctx, session.id, TEST_STEP.id);
    const submission = { type: "TEXT", value: "헌법논증이론" } as const;

    await submitAnswer(ctx, { stepId: FINAL_STEP.id, sessionTokens: [session.token], submission });
    const issued = (await ctx.repo.playSession.getById(session.id))?.completionCode;
    expect(issued).toEqual(expect.any(String));

    // 완료한 세션은 이미 종결된 것으로 보므로 다시 채점해 코드를 갈아치우지 않는다.
    const again = await submitAnswer(ctx, {
      stepId: FINAL_STEP.id,
      sessionTokens: [session.token],
      submission,
    });
    expect(again).toEqual({ kind: "COMPLETED", caseId: TEST_CASE.id });

    const progress = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });
    expect(progress).toMatchObject({ kind: "COMPLETED", completionCode: issued });
  });

  it("잠긴 단계에 제출하면 LOCKED를 돌려주고 아무 것도 바꾸지 않는다", async () => {
    const session = activeSession({ currentStepOrder: 0 });
    const ctx = contextWith({ sessions: [session] });

    const result = await submitAnswer(ctx, {
      stepId: FINAL_STEP.id,
      sessionTokens: [session.token],
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
    // 아직 안 푼 문제가 하나 더 있어야 완주하지 않고 오답도 다시 시도할 수 있다.
    const otherProblem: Step = {
      ...TEST_STEP,
      id: "step-other-problem",
      order: 3,
      name: "QR 03",
      qrToken: "QRTOKEN003",
      answerSpec: { type: "SHORT_TEXT", accepted: ["다른 정답"], match: "EXACT" },
    };
    const session = activeSession();
    const ctx = contextWith({ steps: [customStep, otherProblem], sessions: [session] });

    const correct = await submitAnswer(ctx, {
      stepId: customStep.id,
      sessionTokens: [session.token],
      submission: { type: "TEXT", value: "이민열, 김도균" },
    });
    expect(correct).toMatchObject({ kind: "CORRECT", message: "완벽해요!" });

    const incorrect = await submitAnswer(ctx, {
      stepId: customStep.id,
      sessionTokens: [session.token],
      submission: { type: "TEXT", value: "엉뚱한 답" },
    });
    expect(incorrect).toEqual({ kind: "INCORRECT", message: "힌트를 다시 읽어보세요." });
  });
});

describe("requestHint", () => {
  it("힌트를 요청하면 usedHint가 기록되고, 반복 요청해도 1회로 집계된다", async () => {
    const session = activeSession();
    const ctx = contextWith({ sessions: [session] });

    const first = await requestHint(ctx, { stepId: TEST_STEP.id, sessionTokens: [session.token] });
    const second = await requestHint(ctx, { stepId: TEST_STEP.id, sessionTokens: [session.token] });

    expect(first).toMatchObject({ hint: TEST_STEP.hint });
    expect(second).toMatchObject({ hint: TEST_STEP.hint });

    const attempts = await ctx.repo.stepAttempt.listBySessionId(session.id);
    expect(attempts.filter((attempt) => attempt.usedHint)).toHaveLength(1);
  });

  it("잠긴 단계의 힌트는 요청할 수 없다", async () => {
    const session = activeSession({ currentStepOrder: 0 });
    const ctx = contextWith({ sessions: [session] });

    const result = await requestHint(ctx, {
      stepId: FINAL_STEP.id,
      sessionTokens: [session.token],
    });

    expect(result.kind).toBe("LOCKED");
  });
});

describe("advanceNarrativeStep", () => {
  it("INTRO 단계를 지나면 다음 순서가 열린다", async () => {
    const session = activeSession({ currentStepOrder: INTRO_STEP.order });
    const ctx = contextWith({ sessions: [session] });

    const result = await advanceNarrativeStep(ctx, {
      stepId: INTRO_STEP.id,
      sessionTokens: [session.token],
    });

    expect(result).toEqual({ kind: "ADVANCED" });
    const updated = await ctx.repo.playSession.getById(session.id);
    expect(updated?.currentStepOrder).toBe(TEST_STEP.order);
  });
});

describe("getPlayProgress", () => {
  it("세션이 없으면 아직 시작 전이라고 안내한다", async () => {
    const ctx = contextWith();

    const result = await getPlayProgress(ctx, { caseId: TEST_CASE.id });

    expect(result).toEqual({
      kind: "NOT_STARTED",
      message: "먼저 시작 QR을 찍어주세요.",
    });
  });

  it("INTRO 단계에서는 소개 내용을 돌려준다", async () => {
    const session = activeSession({ currentStepOrder: INTRO_STEP.order });
    const ctx = contextWith({ sessions: [session] });

    const result = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });

    expect(result.kind).toBe("NARRATIVE");
    if (result.kind === "NARRATIVE") expect(result.step.id).toBe(INTRO_STEP.id);
  });

  it("문제를 찾는 중에는 스탬프판과 남은 문제 안내를 돌려준다", async () => {
    const session = activeSession({ currentStepOrder: TEST_STEP.order });
    const ctx = contextWith({ sessions: [session] });

    const result = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });

    // 자유 진행이라 어느 문제든 상관없다 — 단계 이름 대신 "아무거나" 안내를 준다.
    expect(result).toEqual({
      kind: "WAITING",
      stepName: "",
      anyOrder: true,
      stamps: [{ stepId: TEST_STEP.id, name: TEST_STEP.name, solved: false }],
      hints: [],
    });
  });

  it("문제를 다 풀면 스탬프판은 다 찍히고 에필로그 차례를 안내한다", async () => {
    const session = activeSession({ currentStepOrder: FINAL_STEP.order });
    const ctx = contextWith({ sessions: [session] });
    await markSolved(ctx, session.id, TEST_STEP.id);

    const result = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });

    expect(result).toEqual({
      kind: "WAITING",
      stepName: FINAL_STEP.name,
      anyOrder: false,
      stamps: [{ stepId: TEST_STEP.id, name: TEST_STEP.name, solved: true }],
      hints: [],
    });
  });

  it("에필로그에 찾기 화면 문구를 적어 두면 에필로그 차례에 그 문구를 함께 돌려준다", async () => {
    const session = activeSession({ currentStepOrder: FINAL_STEP.order });
    const findScreen = {
      title: "마지막 에필로그 QR은 책방79-1 책방지기에게 받아주세요.",
      guide: "큐알을 이미 받으셨다면 아래 버튼을 눌러주세요",
    };
    const ctx = contextWith({
      steps: [INTRO_STEP, TEST_STEP, { ...FINAL_STEP, findScreen }, CLOSING_STEP],
      sessions: [session],
    });
    await markSolved(ctx, session.id, TEST_STEP.id);

    const result = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });

    expect(result).toMatchObject({ kind: "WAITING", stepName: FINAL_STEP.name, findScreen });
  });

  it("순차 진행에서는 지금 찾을 문제의 찾기 화면 문구를 돌려준다", async () => {
    const session = activeSession({ currentStepOrder: TEST_STEP.order });
    const findScreen = { title: "QR 1은 계단 옆에 있어요" };
    const ctx = contextWith({
      cases: { [TEST_CASE.id]: { ...TEST_CASE, freeOrder: false } },
      steps: [INTRO_STEP, { ...TEST_STEP, findScreen }, FINAL_STEP, CLOSING_STEP],
      sessions: [session],
    });

    const result = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });

    expect(result).toMatchObject({ kind: "WAITING", stepName: TEST_STEP.name, findScreen });
  });

  it("순차 진행에서는 지금 찾을 문제의 QR 위치 힌트만 돌려준다", async () => {
    const session = activeSession({ currentStepOrder: TEST_STEP.order });
    const ctx = contextWith({
      cases: { [TEST_CASE.id]: { ...TEST_CASE, freeOrder: false } },
      steps: [
        INTRO_STEP,
        { ...TEST_STEP, findScreen: { hint: "계단 옆 서가를 보세요" } },
        { ...FINAL_STEP, findScreen: { hint: "책방지기에게 물어보세요" } },
        CLOSING_STEP,
      ],
      sessions: [session],
    });

    const result = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });

    expect(result).toMatchObject({
      kind: "WAITING",
      hints: [{ stepName: TEST_STEP.name, text: "계단 옆 서가를 보세요" }],
    });
  });

  it("자유 진행에서는 아직 못 푼 문제들의 QR 위치 힌트를 돌려준다", async () => {
    const solvedStep: Step = {
      ...TEST_STEP,
      id: "step-solved",
      order: 2,
      name: "QR 02",
      qrToken: "QRTOKEN02",
      findScreen: { hint: "이미 푼 문제" },
    };
    const session = activeSession({ currentStepOrder: TEST_STEP.order });
    const ctx = contextWith({
      steps: [
        INTRO_STEP,
        { ...TEST_STEP, findScreen: { hint: "계단 옆 서가를 보세요" } },
        solvedStep,
        FINAL_STEP,
        CLOSING_STEP,
      ],
      sessions: [session],
    });
    await markSolved(ctx, session.id, solvedStep.id);

    const result = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });

    expect(result).toMatchObject({
      kind: "WAITING",
      anyOrder: true,
      hints: [{ stepName: TEST_STEP.name, text: "계단 옆 서가를 보세요" }],
    });
  });

  it("에필로그 차례에는 에필로그의 QR 위치 힌트를 돌려준다", async () => {
    const session = activeSession({ currentStepOrder: FINAL_STEP.order });
    const ctx = contextWith({
      steps: [
        INTRO_STEP,
        { ...TEST_STEP, findScreen: { hint: "계단 옆 서가를 보세요" } },
        { ...FINAL_STEP, findScreen: { hint: "책방지기에게 물어보세요" } },
        CLOSING_STEP,
      ],
      sessions: [session],
    });
    await markSolved(ctx, session.id, TEST_STEP.id);

    const result = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });

    expect(result).toMatchObject({
      kind: "WAITING",
      hints: [{ stepName: FINAL_STEP.name, text: "책방지기에게 물어보세요" }],
    });
  });

  it("완료 후에는 완료 코드와 종결 내용을 돌려준다", async () => {
    const session = activeSession({
      status: "COMPLETED",
      completionCode: "79-1-K7QP",
      currentStepOrder: CLOSING_STEP.order,
      startedAt: "2026-09-15T06:00:00.000Z",
      completedAt: "2026-09-15T06:20:00.000Z",
    });
    const ctx = contextWith({ sessions: [session] });

    const result = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });

    expect(result).toEqual({
      kind: "COMPLETED",
      completionCode: "79-1-K7QP",
      elapsedMinutes: 20,
      hintCount: 0,
      closing: expect.objectContaining({ id: CLOSING_STEP.id }),
    });
  });

  it("완료 화면용으로 소요 시간과 힌트 횟수를 함께 돌려준다", async () => {
    const session = activeSession({
      status: "COMPLETED",
      completionCode: "79-1-K7QP",
      currentStepOrder: CLOSING_STEP.order,
      startedAt: "2026-09-15T06:00:00.000Z",
      completedAt: "2026-09-15T06:17:30.000Z",
    });
    const ctx = contextWith({ sessions: [session] });
    await ctx.repo.stepAttempt.create({
      sessionId: session.id,
      stepId: TEST_STEP.id,
      submitted: "",
      correct: false,
      usedHint: true,
      createdAt: "2026-09-15T06:05:00.000Z",
    });
    await ctx.repo.stepAttempt.create({
      sessionId: session.id,
      stepId: FINAL_STEP.id,
      submitted: "",
      correct: true,
      usedHint: false,
      createdAt: "2026-09-15T06:16:00.000Z",
    });

    const result = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [session.token],
    });

    expect(result).toMatchObject({ kind: "COMPLETED", elapsedMinutes: 18, hintCount: 1 });
  });
});

describe("여러 CASE 동시 진행", () => {
  it("한 기기에 남은 두 CASE 세션을 각각 이어서 쓴다", async () => {
    const caseOne = activeSession();
    const caseTwo = activeSession({
      id: "session-2",
      caseId: ANOTHER_CASE.id,
      token: "session-token-2",
      currentStepOrder: ANOTHER_STEP.order,
    });
    const ctx = contextWith({
      steps: [INTRO_STEP, TEST_STEP, FINAL_STEP, CLOSING_STEP, ANOTHER_STEP],
      sessions: [caseOne, caseTwo],
    });
    // 쿠키에는 CASE마다 토큰이 하나씩 들어 있다 — 한쪽을 시작해도 다른 쪽은 남는다.
    const tokens = [caseOne.token, caseTwo.token];

    const one = await getStepForPlay(ctx, {
      qrToken: TEST_STEP.qrToken ?? "",
      sessionTokens: tokens,
    });
    const two = await getStepForPlay(ctx, {
      qrToken: ANOTHER_STEP.qrToken ?? "",
      sessionTokens: tokens,
    });

    expect(one.kind).toBe("ALLOWED");
    expect(two.kind).toBe("ALLOWED");

    const progressOne = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: tokens,
    });
    const progressTwo = await getPlayProgress(ctx, {
      caseId: ANOTHER_CASE.id,
      sessionTokens: tokens,
    });

    expect(progressOne.kind).not.toBe("NOT_STARTED");
    expect(progressTwo.kind).not.toBe("NOT_STARTED");
  });
});

describe("자유 진행을 꺼둔 CASE (순차 진행)", () => {
  it("앞 단계를 건너뛰면 순서 안내와 함께 LOCKED", async () => {
    const session = activeSession({ currentStepOrder: INTRO_STEP.order });
    const ctx = contextWith({
      cases: { [TEST_CASE.id]: { ...TEST_CASE, freeOrder: false } },
      sessions: [session],
    });

    const result = await getStepForPlay(ctx, {
      qrToken: TEST_STEP.qrToken ?? "",
      sessionTokens: [session.token],
    });

    expect(result).toEqual({
      kind: "LOCKED",
      caseId: TEST_CASE.id,
      currentStepOrder: INTRO_STEP.order,
      requestedOrder: TEST_STEP.order,
      stepName: INTRO_STEP.name,
      message: `아직이에요. 지금은 ${INTRO_STEP.name}을(를) 찾을 차례예요.`,
    });
  });
});

describe("프롤로그(프로그램 QR)가 꺼진 CASE", () => {
  function noPrologueContext(input: { steps?: Step[]; sessions?: PlaySession[] } = {}) {
    return contextWith({
      ...input,
      cases: { [TEST_CASE.id]: { ...TEST_CASE, prologueEnabled: false } },
    });
  }

  it("세션 없이도 문제 단계를 볼 수 있고, 정답을 맞히는 순간 참여가 시작된다", async () => {
    const ctx = noPrologueContext();

    const view = await getStepForPlay(ctx, { qrToken: TEST_STEP.qrToken ?? "" });
    expect(view.kind).toBe("ALLOWED");

    // 아직 참여 전이라 오답은 시도 기록도 남기지 않는다.
    const wrong = await submitAnswer(ctx, {
      stepId: TEST_STEP.id,
      submission: { type: "TEXT", value: "엉뚱한 답" },
    });
    expect(wrong).toEqual({ kind: "INCORRECT", message: DEFAULT_WRONG_MESSAGE });
    expect(await ctx.repo.playSession.listByCaseId(TEST_CASE.id)).toHaveLength(0);

    const right = await submitAnswer(ctx, {
      stepId: TEST_STEP.id,
      submission: { type: "TEXT", value: "이민열, 김도균" },
    });
    expect(right.kind).toBe("CORRECT");

    const [started] = await ctx.repo.playSession.listByCaseId(TEST_CASE.id);
    if (!started) throw new Error("session not started");

    // 시작하자마자 사건 소개부터 보여준다 — 프롤로그 없이도 이야기는 빠뜨리지 않는다.
    const progress = await getPlayProgress(ctx, {
      caseId: TEST_CASE.id,
      sessionTokens: [started.token],
    });
    expect(progress).toMatchObject({ kind: "NARRATIVE", step: { id: INTRO_STEP.id } });
  });

  it("문제를 아직 안 풀었으면 진행 화면은 시작 안내를 보여준다", async () => {
    const ctx = noPrologueContext();

    const result = await getPlayProgress(ctx, { caseId: TEST_CASE.id });

    expect(result).toEqual({
      kind: "NOT_STARTED",
      message: "아직 시작 전이에요. 문제 QR을 찍어 정답을 맞히면 시작해요.",
    });
  });
});

describe("에필로그가 꺼진 CASE", () => {
  it("문제를 다 풀면 마지막 단서 없이 바로 완주하고 인증번호를 받는다", async () => {
    const session = activeSession({ currentStepOrder: TEST_STEP.order });
    const ctx = contextWith({
      cases: { [TEST_CASE.id]: { ...TEST_CASE, epilogueEnabled: false } },
      sessions: [session],
    });

    const result = await submitAnswer(ctx, {
      stepId: TEST_STEP.id,
      sessionTokens: [session.token],
      submission: { type: "TEXT", value: "이민열, 김도균" },
    });

    expect(result.kind).toBe("CORRECT");
    if (result.kind === "CORRECT") {
      expect(result.completionCode).toEqual(expect.any(String));
    }

    const updated = await ctx.repo.playSession.getById(session.id);
    expect(updated?.status).toBe("COMPLETED");
    expect(updated?.completionCode).toEqual(expect.any(String));
  });

  it("문제를 다 안 풀었으면 마지막 단서를 맞혀도 완주하지 않는다", async () => {
    const otherProblem: Step = {
      ...TEST_STEP,
      id: "step-other-problem",
      order: 3,
      name: "QR 03",
      qrToken: "QRTOKEN003",
      answerSpec: { type: "SHORT_TEXT", accepted: ["다른 정답"], match: "EXACT" },
    };
    const session = activeSession({ currentStepOrder: FINAL_STEP.order });
    const ctx = contextWith({
      cases: { [TEST_CASE.id]: { ...TEST_CASE, epilogueEnabled: false } },
      steps: [INTRO_STEP, TEST_STEP, otherProblem, FINAL_STEP, CLOSING_STEP],
      sessions: [session],
    });

    const result = await submitAnswer(ctx, {
      stepId: FINAL_STEP.id,
      sessionTokens: [session.token],
      submission: { type: "TEXT", value: "헌법논증이론" },
    });

    expect(result).toMatchObject({ kind: "CORRECT" });
    expect(result).not.toHaveProperty("completionCode");

    const updated = await ctx.repo.playSession.getById(session.id);
    expect(updated?.status).toBe("IN_PROGRESS");
  });
});
