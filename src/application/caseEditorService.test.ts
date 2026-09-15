import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { openStep } from "../domain/tourFlow.ts";
import { ANOTHER_CASE, TEST_CASE, TEST_STEP } from "../domain/fixtures.ts";
import type { PlaySession } from "../domain/playSession.ts";
import type { Step } from "../domain/step.ts";
import createFakeCaseRepo from "../persistence/FakeCaseRepo.ts";
import {
  createFakePlaySessionRepo,
  createFakeStepAttemptRepo,
} from "../persistence/FakePlaySessionRepo.ts";
import createFakeStepRepo from "../persistence/FakeStepRepo.ts";
import { createStep, updateStep } from "./stepService.ts";
import { LiveReadinessError } from "../domain/errors.ts";
import {
  checkQrToken,
  cloneCase,
  checkLiveReadiness,
  getStepForPreview,
  reissueEntryToken,
  reissueStepQrToken,
  reorderSteps,
  resetTestSessionCompletion,
  startTestSession,
  stepBackTestSession,
  updateCaseStatus,
} from "./caseEditorService.ts";

function contextWith(
  input: {
    cases?: Record<string, typeof TEST_CASE>;
    steps?: Step[];
    sessions?: PlaySession[];
  } = {},
) {
  const steps = input.steps ?? [];
  const sessions = input.sessions ?? [];
  return createFakeContext({
    repo: {
      case: createFakeCaseRepo(input.cases ?? { [TEST_CASE.id]: TEST_CASE }),
      step: createFakeStepRepo(Object.fromEntries(steps.map((step) => [step.id, step]))),
      playSession: createFakePlaySessionRepo(
        Object.fromEntries(sessions.map((session) => [session.id, session])),
      ),
      stepAttempt: createFakeStepAttemptRepo(),
    },
  });
}

function testSession(overrides: Partial<PlaySession> = {}): PlaySession {
  const now = new Date().toISOString();
  return {
    id: "test-session-1",
    caseId: TEST_CASE.id,
    token: "test-session-token",
    status: "IN_PROGRESS",
    currentStepOrder: 2,
    startedAt: now,
    lastSeenAt: now,
    isTest: true,
    ...overrides,
  };
}

const INTRO: Step = {
  id: "step-intro",
  caseId: TEST_CASE.id,
  order: 0,
  kind: "INTRO",
  name: "사건 소개",
  qrToken: null,
  published: true,
  title: "사건 소개",
  body: "사건이 시작됩니다.",
  reveal: {},
};

const CLOSING: Step = {
  id: "step-closing",
  caseId: TEST_CASE.id,
  order: 5,
  kind: "CLOSING",
  name: "사건 종결",
  qrToken: null,
  published: true,
  title: "사건 종결",
  body: "",
  reveal: {},
};

function fullCaseSteps(): Step[] {
  return [
    INTRO,
    { ...TEST_STEP, id: "step-1", order: 1, name: "QR 01", qrToken: "QRTOKEN001" },
    { ...TEST_STEP, id: "step-2", order: 2, name: "QR 02", qrToken: "QRTOKEN002" },
    { ...TEST_STEP, id: "step-3", order: 3, name: "QR 03", qrToken: "QRTOKEN003" },
    {
      ...TEST_STEP,
      id: "step-final",
      order: 4,
      kind: "FINAL",
      name: "마지막 단서",
      qrToken: "QRTOKENFIN",
    },
    CLOSING,
  ];
}

describe("cloneCase", () => {
  it("단계 수·내용은 같지만 id와 QR 토큰은 새로 발급하고, 상태는 DRAFT다", async () => {
    const ctx = contextWith({ steps: fullCaseSteps() });

    const cloned = await cloneCase(ctx, TEST_CASE.id);

    expect(cloned.id).not.toBe(TEST_CASE.id);
    expect(cloned.status).toBe("DRAFT");
    expect(cloned.entryToken).not.toBe(TEST_CASE.entryToken);
    expect(cloned.title).toBe(TEST_CASE.title);

    const clonedSteps = await ctx.repo.step.listByCaseId(cloned.id);
    const originalSteps = fullCaseSteps();
    expect(clonedSteps).toHaveLength(originalSteps.length);
    expect(clonedSteps.map((step) => [step.order, step.kind, step.name, step.title])).toEqual(
      originalSteps.map((step) => [step.order, step.kind, step.name, step.title]),
    );

    const clonedIds = clonedSteps.map((step) => step.id);
    const originalIds = originalSteps.map((step) => step.id);
    expect(clonedIds.every((id) => !originalIds.includes(id))).toBe(true);

    const clonedQrTokens = clonedSteps.filter((step) => step.qrToken).map((step) => step.qrToken);
    const originalQrTokens = originalSteps
      .filter((step) => step.qrToken)
      .map((step) => step.qrToken);
    expect(clonedQrTokens.some((token) => originalQrTokens.includes(token))).toBe(false);
  });

  it("복제된 CASE의 QR을 수정해도 원본 QR 토큰은 그대로다", async () => {
    const ctx = contextWith({ steps: fullCaseSteps() });

    const cloned = await cloneCase(ctx, TEST_CASE.id);
    const clonedSteps = await ctx.repo.step.listByCaseId(cloned.id);
    const clonedQrStep = clonedSteps.find((step) => step.name === "QR 01");
    if (!clonedQrStep) throw new Error("cloned QR 01 not found");

    await updateStep(ctx, clonedQrStep.id, {
      name: clonedQrStep.name,
      kind: clonedQrStep.kind,
      title: "고친 제목",
      body: clonedQrStep.body,
      reveal: clonedQrStep.reveal,
      answerSpec: clonedQrStep.answerSpec,
    });

    const original = await ctx.repo.step.getById("step-1");
    expect(original?.qrToken).toBe("QRTOKEN001");
  });

  it("없는 CASE를 복제하면 NotExistError를 던진다", async () => {
    const ctx = contextWith({ cases: {} });

    await expect(cloneCase(ctx, "missing")).rejects.toThrow();
  });
});

describe("checkLiveReadiness", () => {
  it("완전한 CASE는 위반이 없다", async () => {
    const ctx = contextWith({ steps: fullCaseSteps() });

    expect(await checkLiveReadiness(ctx, TEST_CASE.id)).toEqual([]);
  });

  it("정답 없는 QR/FINAL 단계를 위반으로 잡는다", async () => {
    const steps = fullCaseSteps().map((step) =>
      step.name === "QR 01" ? { ...step, answerSpec: undefined } : step,
    );
    const ctx = contextWith({ steps });

    const violations = await checkLiveReadiness(ctx, TEST_CASE.id);

    expect(violations).toContainEqual(
      expect.objectContaining({ kind: "MISSING_ANSWER", stepId: "step-1" }),
    );
  });

  it("QR 단계에 토큰이 없으면 위반으로 잡는다", async () => {
    const steps = fullCaseSteps().map((step) =>
      step.name === "QR 01" ? { ...step, qrToken: null } : step,
    );
    const ctx = contextWith({ steps });

    const violations = await checkLiveReadiness(ctx, TEST_CASE.id);

    expect(violations).toContainEqual(
      expect.objectContaining({ kind: "MISSING_QR_TOKEN", stepId: "step-1" }),
    );
  });

  it("순서에 구멍이 있으면 위반으로 잡는다", async () => {
    const steps = fullCaseSteps().map((step) => (step.order === 3 ? { ...step, order: 9 } : step));
    const ctx = contextWith({ steps });

    const violations = await checkLiveReadiness(ctx, TEST_CASE.id);

    expect(violations).toContainEqual(expect.objectContaining({ kind: "ORDER_GAP" }));
  });

  it("INTRO 본문이 비어 있으면 위반으로 잡는다", async () => {
    const steps = fullCaseSteps().map((step) =>
      step.kind === "INTRO" ? { ...step, body: "" } : step,
    );
    const ctx = contextWith({ steps });

    const violations = await checkLiveReadiness(ctx, TEST_CASE.id);

    expect(violations).toContainEqual(expect.objectContaining({ kind: "MISSING_INTRO_BODY" }));
  });

  it("CLOSING 단계가 없으면 위반으로 잡는다", async () => {
    const steps = fullCaseSteps().filter((step) => step.kind !== "CLOSING");
    const ctx = contextWith({ steps });

    const violations = await checkLiveReadiness(ctx, TEST_CASE.id);

    expect(violations).toContainEqual(expect.objectContaining({ kind: "MISSING_CLOSING" }));
  });
});

describe("updateCaseStatus", () => {
  it("완전한 CASE는 LIVE로 바뀐다", async () => {
    const ctx = contextWith({ steps: fullCaseSteps() });

    const updated = await updateCaseStatus(ctx, TEST_CASE.id, "LIVE");

    expect(updated.status).toBe("LIVE");
  });

  it("위반이 있으면 LIVE 전환을 거부하고 위반 목록을 담아 던진다", async () => {
    const steps = fullCaseSteps().map((step) =>
      step.name === "QR 01" ? { ...step, answerSpec: undefined } : step,
    );
    const ctx = contextWith({ steps });

    await expect(updateCaseStatus(ctx, TEST_CASE.id, "LIVE")).rejects.toThrow(LiveReadinessError);

    const stillDraft = await ctx.repo.case.getById(TEST_CASE.id);
    expect(stillDraft?.status).toBe("DRAFT");
  });

  it("LIVE가 아닌 상태로는 검사 없이 바뀐다", async () => {
    const ctx = contextWith();

    const updated = await updateCaseStatus(ctx, TEST_CASE.id, "CLOSED");

    expect(updated.status).toBe("CLOSED");
  });
});

describe("reorderSteps", () => {
  it("주어진 순서대로 0..n-1로 정규화하고, 잠금 판단도 새 순서를 따른다", async () => {
    const steps = fullCaseSteps();
    const ctx = contextWith({ steps });

    // INTRO, QR03, QR01, QR02, FINAL, CLOSING 순서로 바꾼다.
    const reordered = await reorderSteps(ctx, TEST_CASE.id, [
      "step-intro",
      "step-3",
      "step-1",
      "step-2",
      "step-final",
      "step-closing",
    ]);

    expect(reordered.map((step) => [step.id, step.order])).toEqual([
      ["step-intro", 0],
      ["step-3", 1],
      ["step-1", 2],
      ["step-2", 3],
      ["step-final", 4],
      ["step-closing", 5],
    ]);

    // currentStepOrder=1인 세션: 예전엔 QR03(주문 3)이 잠겨 있었지만, 이제 순서상 1번이라 열린다.
    const step3 = await ctx.repo.step.getById("step-3");
    const step1 = await ctx.repo.step.getById("step-1");
    if (!step3 || !step1) throw new Error("steps not found");

    const session = {
      caseId: TEST_CASE.id,
      status: "IN_PROGRESS" as const,
      currentStepOrder: 1,
      isTest: false,
    };
    expect(openStep({ session, step: step3 }).kind).toBe("ALLOWED");
    expect(openStep({ session, step: step1 }).kind).toBe("LOCKED");
  });
});

describe("startTestSession", () => {
  it("isTest=true인 세션을 만들고 첫 단계부터 시작한다", async () => {
    const ctx = contextWith({ steps: fullCaseSteps() });

    const result = await startTestSession(ctx, TEST_CASE.id);

    expect(result.currentStepOrder).toBe(INTRO.order);
    const session = await ctx.repo.playSession.getByToken(result.token);
    expect(session?.isTest).toBe(true);
  });
});

describe("stepBackTestSession", () => {
  it("진행 중인 테스트 세션을 한 단계 앞으로 되돌린다", async () => {
    const session = testSession({ currentStepOrder: 2 });
    const ctx = contextWith({ steps: fullCaseSteps(), sessions: [session] });

    const result = await stepBackTestSession(ctx, TEST_CASE.id);

    expect(result?.currentStepOrder).toBe(1);
  });

  it("첫 단계보다 앞으로는 되돌리지 않는다", async () => {
    const session = testSession({ currentStepOrder: INTRO.order });
    const ctx = contextWith({ steps: fullCaseSteps(), sessions: [session] });

    const result = await stepBackTestSession(ctx, TEST_CASE.id);

    expect(result?.currentStepOrder).toBe(INTRO.order);
  });

  it("진행 중인 테스트 세션이 없으면 아무 일도 하지 않는다", async () => {
    const ctx = contextWith({ steps: fullCaseSteps() });

    const result = await stepBackTestSession(ctx, TEST_CASE.id);

    expect(result).toBeUndefined();
  });
});

describe("resetTestSessionCompletion", () => {
  it("완료된 테스트 세션을 FINAL 단계로 되돌려 다시 완료해볼 수 있게 한다", async () => {
    const finalStep = fullCaseSteps().find((step) => step.kind === "FINAL");
    const session = testSession({
      status: "COMPLETED",
      currentStepOrder: CLOSING.order,
      completionCode: "79-1-ABCD",
    });
    const ctx = contextWith({ steps: fullCaseSteps(), sessions: [session] });

    const result = await resetTestSessionCompletion(ctx, TEST_CASE.id);

    expect(result?.status).toBe("IN_PROGRESS");
    expect(result?.currentStepOrder).toBe(finalStep?.order);
  });

  it("완료되지 않은 세션은 그대로 둔다", async () => {
    const session = testSession({ status: "IN_PROGRESS", currentStepOrder: 2 });
    const ctx = contextWith({ steps: fullCaseSteps(), sessions: [session] });

    const result = await resetTestSessionCompletion(ctx, TEST_CASE.id);

    expect(result).toEqual(session);
  });
});

describe("getStepForPreview", () => {
  it("공개되지 않은 단계도 초안을 그대로 보여준다", async () => {
    const ctx = contextWith();
    const created = await createStep(ctx, TEST_CASE.id, {
      name: "QR 05",
      kind: "QR",
      title: "초안 제목",
      body: "",
      reveal: {},
      answerSpec: { type: "SHORT_TEXT", accepted: ["정답"], match: "EXACT" },
    });
    await ctx.repo.step.update(created.id, { ...created, published: false });

    const preview = await getStepForPreview(ctx, created.id);

    expect(preview.title).toBe("초안 제목");
    expect(JSON.stringify(preview)).not.toContain("accepted");
  });
});

describe("qrToken 불변식 (요구 23)", () => {
  it("단계 콘텐츠를 수정해도 qrToken이 그대로다", async () => {
    const ctx = contextWith({ steps: [TEST_STEP] });

    const updated = await updateStep(ctx, TEST_STEP.id, {
      name: TEST_STEP.name,
      kind: TEST_STEP.kind,
      title: "완전히 다른 제목",
      body: "완전히 다른 본문",
      reveal: { text: "다른 단서" },
      answerSpec: { type: "SHORT_TEXT", accepted: ["다른 정답"], match: "EXACT" },
    });

    expect(updated.qrToken).toBe(TEST_STEP.qrToken);
  });

  it("복제된 CASE의 단계는 원본과 다른 qrToken을 가진다", async () => {
    const ctx = contextWith({ steps: [TEST_STEP] });

    const cloned = await cloneCase(ctx, TEST_CASE.id);
    const clonedSteps = await ctx.repo.step.listByCaseId(cloned.id);

    expect(clonedSteps[0]?.qrToken).not.toBe(TEST_STEP.qrToken);
    expect(clonedSteps[0]?.qrToken).toEqual(expect.any(String));
  });
});

describe("checkQrToken", () => {
  function ctxWithTwoCases() {
    return createFakeContext({
      repo: {
        case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE, [ANOTHER_CASE.id]: ANOTHER_CASE }),
        step: createFakeStepRepo({ [TEST_STEP.id]: TEST_STEP }),
        playSession: createFakePlaySessionRepo(),
        stepAttempt: createFakeStepAttemptRepo(),
      },
    });
  }

  it("이 CASE의 시작 토큰이면 준비 완료로 본다", async () => {
    const ctx = ctxWithTwoCases();

    const result = await checkQrToken(ctx, TEST_CASE.id, TEST_CASE.entryToken);

    expect(result).toEqual({ kind: "READY", label: "시작 QR", title: TEST_CASE.title });
  });

  it("이 CASE의 단계 토큰이면 단계 이름과 현재 제목을 알려준다", async () => {
    const ctx = ctxWithTwoCases();

    const result = await checkQrToken(ctx, TEST_CASE.id, TEST_STEP.qrToken ?? "");

    expect(result).toEqual({ kind: "READY", label: TEST_STEP.name, title: TEST_STEP.title });
  });

  it("다른 CASE의 단계 토큰이면 그 CASE 번호를 알려준다", async () => {
    const ctx = ctxWithTwoCases();

    const result = await checkQrToken(ctx, ANOTHER_CASE.id, TEST_STEP.qrToken ?? "");

    expect(result).toEqual({ kind: "OTHER_CASE", caseNumber: TEST_CASE.number });
  });

  it("다른 CASE의 시작 토큰이면 그 CASE 번호를 알려준다", async () => {
    const ctx = ctxWithTwoCases();

    const result = await checkQrToken(ctx, ANOTHER_CASE.id, TEST_CASE.entryToken);

    expect(result).toEqual({ kind: "OTHER_CASE", caseNumber: TEST_CASE.number });
  });

  it("아무 CASE에도 없는 토큰이면 미발급으로 본다", async () => {
    const ctx = ctxWithTwoCases();

    const result = await checkQrToken(ctx, TEST_CASE.id, "NOPE");

    expect(result).toEqual({ kind: "UNKNOWN" });
  });
});

describe("토큰 재발급 (기존 인쇄물 무효화, 요구 22)", () => {
  it("단계 QR 토큰을 재발급하면 새 값으로 바뀐다", async () => {
    const ctx = contextWith({ steps: [TEST_STEP] });

    const reissued = await reissueStepQrToken(ctx, TEST_STEP.id);

    expect(reissued.qrToken).not.toBe(TEST_STEP.qrToken);
    expect(reissued.qrToken).toEqual(expect.any(String));
    expect(reissued.title).toBe(TEST_STEP.title);
  });

  it("QR이 없는 단계(INTRO 등)는 재발급할 수 없다", async () => {
    const ctx = contextWith({ steps: [INTRO] });

    await expect(reissueStepQrToken(ctx, INTRO.id)).rejects.toThrow();
  });

  it("CASE 시작 토큰을 재발급하면 새 값으로 바뀐다", async () => {
    const ctx = contextWith();

    const reissued = await reissueEntryToken(ctx, TEST_CASE.id);

    expect(reissued.entryToken).not.toBe(TEST_CASE.entryToken);
    expect(reissued.entryToken).toEqual(expect.any(String));
    expect(reissued.title).toBe(TEST_CASE.title);
  });
});
