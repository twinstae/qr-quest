import type { AppContext } from "../api/context.ts";
import type { Case } from "../domain/case.ts";
import { generateQrToken, generateSessionToken } from "../domain/codes.ts";
import { NotExistError } from "../domain/errors.ts";
import { requiresQrToken, type Step } from "../domain/step.ts";
import type { StartSessionResult } from "./playService.ts";
import { toStepDisplay, type StepDisplay } from "./stepService.ts";

async function getCaseOrThrow(ctx: AppContext, id: string): Promise<Case> {
  const found = await ctx.repo.case.getById(id);
  if (!found) throw new NotExistError(`Case id=${id} not found`);
  return found;
}

async function getStepOrThrow(ctx: AppContext, id: string): Promise<Step> {
  const step = await ctx.repo.step.getById(id);
  if (!step) throw new NotExistError(`Step id=${id} not found`);
  return step;
}

/**
 * CASE를 통째로 복제한다(요구 30). 단계 내용은 그대로 옮기되, id와 QR 토큰은
 * 새로 발급하고 시작 토큰(entryToken)도 새로 만든다 — 인쇄물은 CASE마다 달라야 한다.
 * 상태는 항상 DRAFT로 시작해 검토 없이 바로 운영되지 않게 한다.
 */
export async function cloneCase(ctx: AppContext, caseId: string): Promise<Case> {
  const original = await getCaseOrThrow(ctx, caseId);
  const steps = await ctx.repo.step.listByCaseId(caseId);

  const cloned = await ctx.repo.case.create({
    number: original.number,
    title: original.title,
    teaser: original.teaser,
    intro: original.intro,
    thumbnail: original.thumbnail,
    estimatedMinutes: original.estimatedMinutes,
    status: "DRAFT",
    entryToken: generateQrToken(),
    finalBookTitle: original.finalBookTitle,
    rewardNote: original.rewardNote,
  });

  for (const step of [...steps].sort((a, b) => a.order - b.order)) {
    await ctx.repo.step.create({
      caseId: cloned.id,
      order: step.order,
      kind: step.kind,
      name: step.name,
      qrToken: requiresQrToken(step.kind) ? generateQrToken() : null,
      published: step.published,
      title: step.title,
      body: step.body,
      media: step.media,
      reveal: step.reveal,
      question: step.question,
      answerSpec: step.answerSpec,
      placeholder: step.placeholder,
      hint: step.hint,
      correctMessage: step.correctMessage,
      wrongMessage: step.wrongMessage,
    });
  }

  return cloned;
}

export type LiveViolation =
  | { kind: "ORDER_GAP" }
  | { kind: "MISSING_CLOSING" }
  | { kind: "MISSING_INTRO_BODY" }
  | { kind: "MISSING_ANSWER"; stepId: string; stepName: string }
  | { kind: "MISSING_QR_TOKEN"; stepId: string; stepName: string };

/**
 * LIVE로 바꾸기 전 검사(요구 30). 위반이 하나라도 있으면 빈 배열이 아니다 —
 * 호출부는 결과가 비어 있는지로만 판단하고, 목록은 화면에 그대로 보여준다.
 */
export async function checkLiveReadiness(ctx: AppContext, caseId: string): Promise<LiveViolation[]> {
  const steps = await ctx.repo.step.listByCaseId(caseId);
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const violations: LiveViolation[] = [];

  const hasOrderGap = sorted.some((step, index) => step.order !== index);
  if (hasOrderGap) violations.push({ kind: "ORDER_GAP" });

  if (!sorted.some((step) => step.kind === "CLOSING")) {
    violations.push({ kind: "MISSING_CLOSING" });
  }

  for (const step of sorted) {
    if (requiresQrToken(step.kind)) {
      if (!step.answerSpec) {
        violations.push({ kind: "MISSING_ANSWER", stepId: step.id, stepName: step.name });
      }
      if (!step.qrToken) {
        violations.push({ kind: "MISSING_QR_TOKEN", stepId: step.id, stepName: step.name });
      }
    }
    if (step.kind === "INTRO" && step.body.trim() === "") {
      violations.push({ kind: "MISSING_INTRO_BODY" });
    }
  }

  return violations;
}

/**
 * 드래그로 바꾼 순서를 저장한다. 주어진 id 순서대로 0..n-1로 다시 매긴다.
 * 잠금(openStep)은 order 값만 보고 판단하므로 따로 마이그레이션할 게 없다 —
 * 다음 조회부터 새 순서를 그대로 따른다.
 */
export async function reorderSteps(
  ctx: AppContext,
  caseId: string,
  orderedStepIds: string[],
): Promise<Step[]> {
  const updated: Step[] = [];
  for (let index = 0; index < orderedStepIds.length; index++) {
    const stepId = orderedStepIds[index];
    if (!stepId) continue;
    const { id: _id, caseId: stepCaseId, ...rest } = await getStepOrThrow(ctx, stepId);
    if (stepCaseId !== caseId) throw new NotExistError(`Step id=${stepId} not in case=${caseId}`);
    updated.push(await ctx.repo.step.update(stepId, { ...rest, order: index }));
  }
  return updated;
}

/**
 * 관리자가 실제 참가자처럼 처음부터 끝까지 진행해 볼 때 쓴다(요구 30-8).
 * isTest=true로 표시해 통계에서 제외한다(16).
 */
export async function startTestSession(ctx: AppContext, caseId: string): Promise<StartSessionResult> {
  const steps = await ctx.repo.step.listByCaseId(caseId);
  const introStep = steps.find((step) => step.kind === "INTRO");
  const now = new Date().toISOString();

  const created = await ctx.repo.playSession.create({
    caseId,
    token: generateSessionToken(),
    status: "IN_PROGRESS",
    currentStepOrder: introStep?.order ?? 0,
    startedAt: now,
    lastSeenAt: now,
    isTest: true,
  });

  return {
    token: created.token,
    caseId: created.caseId,
    status: created.status,
    currentStepOrder: created.currentStepOrder,
    completionCode: created.completionCode,
    resumed: false,
  };
}

/** 저장하지 않은 초안도 그대로 보여준다 — 공개 여부·CASE 상태를 확인하지 않는다. */
export async function getStepForPreview(ctx: AppContext, stepId: string): Promise<StepDisplay> {
  const step = await getStepOrThrow(ctx, stepId);
  return toStepDisplay(step);
}
