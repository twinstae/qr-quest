import type { AppContext } from "../api/context.ts";
import {
  checkCaseLiveReadiness,
  type Case,
  type CaseStatus,
  type LiveViolation,
} from "../domain/case.ts";
import { generateQrToken, generateSessionToken } from "../domain/codes.ts";
import { LiveReadinessError, NotExistError } from "../domain/errors.ts";
import type { PlaySession } from "../domain/playSession.ts";
import { requiresQrToken, type Step } from "../domain/step.ts";
import type { StartSessionResult } from "./playService.ts";
import { toStepDisplay, type StepDisplay } from "./stepService.ts";

export type { LiveViolation };

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

/**
 * LIVE로 바꾸기 전 검사(요구 30). 위반이 하나라도 있으면 빈 배열이 아니다 —
 * 호출부는 결과가 비어 있는지로만 판단하고, 목록은 화면에 그대로 보여준다.
 */
export async function checkLiveReadiness(
  ctx: AppContext,
  caseId: string,
): Promise<LiveViolation[]> {
  const steps = await ctx.repo.step.listByCaseId(caseId);
  return checkCaseLiveReadiness(steps);
}

/** LIVE로 바꾸려는데 위반이 있으면 거부한다. 그 외 상태 변경은 그대로 저장한다. */
export async function updateCaseStatus(
  ctx: AppContext,
  caseId: string,
  status: CaseStatus,
): Promise<Case> {
  if (status === "LIVE") {
    const violations = await checkLiveReadiness(ctx, caseId);
    if (violations.length > 0) {
      throw new LiveReadinessError("이 CASE는 아직 LIVE로 바꿀 수 없어요.", violations);
    }
  }

  const existing = await getCaseOrThrow(ctx, caseId);
  return ctx.repo.case.update(caseId, { ...existing, status });
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
export async function startTestSession(
  ctx: AppContext,
  caseId: string,
): Promise<StartSessionResult> {
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

/** 가장 최근에 시작한 테스트 세션. 여러 개 있어도 가장 최근 것 하나만 다룬다. */
async function findActiveTestSession(
  ctx: AppContext,
  caseId: string,
): Promise<PlaySession | undefined> {
  const sessions = await ctx.repo.playSession.listByCaseId(caseId);
  return sessions
    .filter((session) => session.isTest)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}

/**
 * 방금 지난 단계를 다시 시험해보고 싶을 때 쓴다(요구 30-8). 같은 세션을 그대로 쓰므로
 * 브라우저의 테스트 쿠키를 새로 받을 필요가 없다 — "테스트 모드 시작"과 달리 처음부터
 * 다시 걷지 않아도 된다.
 */
export async function stepBackTestSession(
  ctx: AppContext,
  caseId: string,
): Promise<PlaySession | undefined> {
  const session = await findActiveTestSession(ctx, caseId);
  if (!session) return undefined;

  const steps = await ctx.repo.step.listByCaseId(caseId);
  const introOrder = steps.find((step) => step.kind === "INTRO")?.order ?? 0;
  const target = Math.max(introOrder, session.currentStepOrder - 1);
  if (target === session.currentStepOrder) return session;

  return ctx.repo.playSession.update(session.id, { currentStepOrder: target });
}

/**
 * 완료 화면을 다시 확인하고 싶을 때 쓴다. FINAL 단계로 되돌려 다시 제출하면
 * 새 완료 코드를 받을 수 있다 — QR 단계들을 처음부터 다시 찍을 필요가 없다.
 */
export async function resetTestSessionCompletion(
  ctx: AppContext,
  caseId: string,
): Promise<PlaySession | undefined> {
  const session = await findActiveTestSession(ctx, caseId);
  if (!session || session.status !== "COMPLETED") return session;

  const steps = await ctx.repo.step.listByCaseId(caseId);
  const finalOrder = steps.find((step) => step.kind === "FINAL")?.order ?? session.currentStepOrder;

  return ctx.repo.playSession.update(session.id, {
    status: "IN_PROGRESS",
    currentStepOrder: finalOrder,
  });
}

/** 저장하지 않은 초안도 그대로 보여준다 — 공개 여부·CASE 상태를 확인하지 않는다. */
export async function getStepForPreview(ctx: AppContext, stepId: string): Promise<StepDisplay> {
  const step = await getStepOrThrow(ctx, stepId);
  return toStepDisplay(step);
}

export type QrCheckResult =
  | { kind: "READY"; label: string; title: string }
  | { kind: "OTHER_CASE"; caseNumber: number }
  | { kind: "UNKNOWN" };

/**
 * 설치 점검(요구 22)에서 QR 하나를 스캔했을 때 무슨 QR인지 판정한다.
 * 참가자 잠금과는 무관하다 — 순서와 상관없이 자유롭게 스캔해서 설치를 확인해야 한다.
 */
export async function checkQrToken(
  ctx: AppContext,
  caseId: string,
  token: string,
): Promise<QrCheckResult> {
  const currentCase = await getCaseOrThrow(ctx, caseId);

  if (token === currentCase.entryToken) {
    return { kind: "READY", label: "시작 QR", title: currentCase.title };
  }

  const step = await ctx.repo.step.getByQrToken(token);
  if (step) {
    if (step.caseId !== caseId) {
      const otherCase = await ctx.repo.case.getById(step.caseId);
      return { kind: "OTHER_CASE", caseNumber: otherCase?.number ?? 0 };
    }
    return { kind: "READY", label: step.name, title: step.title };
  }

  const otherCaseByEntry = await ctx.repo.case.getByEntryToken(token);
  if (otherCaseByEntry && otherCaseByEntry.id !== caseId) {
    return { kind: "OTHER_CASE", caseNumber: otherCaseByEntry.number };
  }

  return { kind: "UNKNOWN" };
}

/**
 * QR 토큰을 새로 발급한다 — 기존 인쇄물이 즉시 무효가 되므로, 호출부(화면)가
 * 반드시 경고를 띄운 뒤에만 불러야 한다(요구 22).
 */
export async function reissueStepQrToken(ctx: AppContext, stepId: string): Promise<Step> {
  const { id: _id, caseId: _caseId, ...rest } = await getStepOrThrow(ctx, stepId);
  if (!requiresQrToken(rest.kind)) {
    throw new Error(`Step id=${stepId} has no QR token to reissue`);
  }
  return ctx.repo.step.update(stepId, { ...rest, qrToken: generateQrToken() });
}

/** 시작 QR 토큰을 새로 발급한다 — 기존 인쇄물이 즉시 무효가 된다. */
export async function reissueEntryToken(ctx: AppContext, caseId: string): Promise<Case> {
  const { id: _id, ...rest } = await getCaseOrThrow(ctx, caseId);
  return ctx.repo.case.update(caseId, { ...rest, entryToken: generateQrToken() });
}
