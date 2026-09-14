import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { openStep } from "../domain/tourFlow.ts";
import { TEST_CASE, TEST_STEP } from "../domain/fixtures.ts";
import type { Step } from "../domain/step.ts";
import createFakeCaseRepo from "../persistence/FakeCaseRepo.ts";
import { createFakePlaySessionRepo, createFakeStepAttemptRepo } from "../persistence/FakePlaySessionRepo.ts";
import createFakeStepRepo from "../persistence/FakeStepRepo.ts";
import { createStep, updateStep } from "./stepService.ts";
import {
  cloneCase,
  checkLiveReadiness,
  getStepForPreview,
  reorderSteps,
  startTestSession,
} from "./caseEditorService.ts";

function contextWith(input: { cases?: Record<string, typeof TEST_CASE>; steps?: Step[] } = {}) {
  const steps = input.steps ?? [];
  return createFakeContext({
    repo: {
      case: createFakeCaseRepo(input.cases ?? { [TEST_CASE.id]: TEST_CASE }),
      step: createFakeStepRepo(Object.fromEntries(steps.map((step) => [step.id, step]))),
      playSession: createFakePlaySessionRepo(),
      stepAttempt: createFakeStepAttemptRepo(),
    },
  });
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
    { ...TEST_STEP, id: "step-final", order: 4, kind: "FINAL", name: "마지막 단서", qrToken: "QRTOKENFIN" },
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
    const originalQrTokens = originalSteps.filter((step) => step.qrToken).map((step) => step.qrToken);
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
    const steps = fullCaseSteps().map((step) => (step.kind === "INTRO" ? { ...step, body: "" } : step));
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

    const session = { caseId: TEST_CASE.id, status: "IN_PROGRESS" as const, currentStepOrder: 1 };
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
