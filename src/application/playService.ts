import type { AppContext } from "../api/context.ts";
import { generateCompletionCode, generateSessionToken } from "../domain/codes.ts";
import { NotExistError } from "../domain/errors.ts";
import type { PlaySession } from "../domain/playSession.ts";
import {
  describeAnswerForDebug,
  matchAnswer,
  requiresQrToken,
  resolveCorrectMessage,
  resolveWrongMessage,
  type AnswerSubmission,
  type Step,
} from "../domain/step.ts";
import { nextOrderAfter, openStep, progressOf, type OpenStepResult } from "../domain/tourFlow.ts";
import { elapsedMinutesRounded } from "../domain/tourStats.ts";
import { toStepDisplay, type StepDisplay } from "./stepService.ts";

export type LockedResult =
  | { kind: "NOT_STARTED"; caseId: string }
  | {
      kind: "LOCKED";
      caseId: string;
      currentStepOrder: number;
      requestedOrder: number;
      stepName: string;
    }
  | { kind: "COMPLETED"; caseId: string }
  | { kind: "OTHER_CASE"; caseId: string; sessionCaseId: string };

async function getStepOrThrow(ctx: AppContext, id: string): Promise<Step> {
  const step = await ctx.repo.step.getById(id);
  if (!step) throw new NotExistError(`Step id=${id} not found`);
  return step;
}

async function getSessionOf(
  ctx: AppContext,
  sessionToken: string | undefined,
): Promise<PlaySession | undefined> {
  if (!sessionToken) return undefined;
  return ctx.repo.playSession.getByToken(sessionToken);
}

/** 잠금 판단 결과를 화면에 내려줄 모양으로 바꾼다. LOCKED는 지금 열려 있는 단계 이름을 채워 넣는다. */
async function toLockedResult(
  ctx: AppContext,
  result: Exclude<OpenStepResult, { kind: "ALLOWED" }>,
  caseId: string,
): Promise<LockedResult> {
  if (result.kind !== "LOCKED") return { ...result, caseId };

  const steps = await ctx.repo.step.listByCaseId(caseId);
  const current = steps.find((step) => step.order === result.currentStepOrder);
  return {
    kind: "LOCKED",
    caseId,
    currentStepOrder: result.currentStepOrder,
    requestedOrder: result.requestedOrder,
    stepName: current?.name ?? "",
  };
}

export type StartSessionResult = {
  token: string;
  caseId: string;
  status: PlaySession["status"];
  currentStepOrder: number;
  completionCode?: string;
  resumed: boolean;
};

function toStartResult(session: PlaySession, resumed: boolean): StartSessionResult {
  return {
    token: session.token,
    caseId: session.caseId,
    status: session.status,
    currentStepOrder: session.currentStepOrder,
    completionCode: session.completionCode,
    resumed,
  };
}

/**
 * 시작 QR 진입. 같은 사건의 기존 세션이 있으면 그대로 이어가고, 없으면 새로 만든다
 * (요구 12). 개인정보는 받지 않으므로 세션을 식별하는 값은 토큰뿐이다.
 */
export async function startOrResumeSession(
  ctx: AppContext,
  input: { entryToken: string; existingToken?: string },
): Promise<StartSessionResult> {
  const found = await ctx.repo.case.getByEntryToken(input.entryToken);
  if (!found) throw new NotExistError(`Case entryToken=${input.entryToken} not found`);

  const existing = await getSessionOf(ctx, input.existingToken);
  if (existing && existing.caseId === found.id) {
    const touched = await ctx.repo.playSession.update(existing.id, {
      lastSeenAt: new Date().toISOString(),
    });
    return toStartResult(touched, true);
  }

  const steps = await ctx.repo.step.listByCaseId(found.id);
  const introStep = steps.find((step) => step.kind === "INTRO");
  const now = new Date().toISOString();

  const created = await ctx.repo.playSession.create({
    caseId: found.id,
    token: generateSessionToken(),
    status: "IN_PROGRESS",
    currentStepOrder: introStep?.order ?? 0,
    startedAt: now,
    lastSeenAt: now,
    isTest: false,
  });

  return toStartResult(created, false);
}

export type PlayStepDisplay = Omit<StepDisplay, "hint"> & {
  hasHint: boolean;
  debugAnswer?: string;
};

/**
 * 힌트 글자는 참가자 응답에 절대 담지 않는다 — 여기서 함께 내려주면 "사용했는지"를
 * 알 수 없어 힌트 통계(16)가 불가능해진다. 있는지 여부만 알려주고, 글자는
 * requestHint를 거쳐야 받을 수 있다.
 *
 * debugAnswer(정답 요약)는 관리자 테스트 세션([정답 보기] 토글)에서만 담는다 —
 * 실제 참가자에게는 절대 나가지 않는다.
 */
function toPlayStepDisplay(step: Step, includeDebugAnswer = false): PlayStepDisplay {
  const { hint, ...display } = toStepDisplay(step);
  return {
    ...display,
    hasHint: Boolean(hint),
    debugAnswer:
      includeDebugAnswer && step.answerSpec ? describeAnswerForDebug(step.answerSpec) : undefined,
  };
}

export type PlayStepResult = { kind: "ALLOWED"; step: PlayStepDisplay } | LockedResult;

/** QR을 찍어 단계에 들어갈 때 쓴다. 정답은 절대 담지 않는다(테스트 세션의 정답 요약은 예외). */
export async function getStepForPlay(
  ctx: AppContext,
  input: { qrToken: string; sessionToken?: string },
): Promise<PlayStepResult> {
  const step = await ctx.repo.step.getByQrToken(input.qrToken);
  if (!step) throw new NotExistError(`Step qrToken=${input.qrToken} not found`);

  const session = await getSessionOf(ctx, input.sessionToken);
  const lock = openStep({ session, step });
  if (lock.kind !== "ALLOWED") return toLockedResult(ctx, lock, step.caseId);

  return { kind: "ALLOWED", step: toPlayStepDisplay(step, session?.isTest === true) };
}

function submissionToText(submission: AnswerSubmission): string {
  return submission.type === "CHOICE" ? submission.choiceIds.join(",") : submission.value;
}

export type SubmitAnswerResult =
  | { kind: "INCORRECT"; message: string }
  | { kind: "CORRECT"; reveal: Step["reveal"]; message: string; completionCode?: string }
  | LockedResult;

/**
 * 정답 제출. 오답은 실패 처리가 아니라 횟수 제한 없이 다시 시도할 수 있다(요구 8).
 * FINAL을 맞히면 세션을 완료로 바꾸고 인증번호를 발급한다(요구 14).
 */
export async function submitAnswer(
  ctx: AppContext,
  input: { stepId: string; sessionToken?: string; submission: AnswerSubmission },
): Promise<SubmitAnswerResult> {
  const step = await getStepOrThrow(ctx, input.stepId);
  const session = await getSessionOf(ctx, input.sessionToken);
  const lock = openStep({ session, step });
  if (lock.kind !== "ALLOWED") return toLockedResult(ctx, lock, step.caseId);

  // openStep이 ALLOWED를 돌려줬다는 건 session이 존재한다는 뜻이다 (NOT_STARTED가 아니므로).
  const activeSession = session as PlaySession;
  const correct = step.answerSpec ? matchAnswer(step.answerSpec, input.submission) : false;

  await ctx.repo.stepAttempt.create({
    sessionId: activeSession.id,
    stepId: step.id,
    submitted: submissionToText(input.submission),
    correct,
    usedHint: false,
    createdAt: new Date().toISOString(),
  });

  if (!correct) return { kind: "INCORRECT", message: resolveWrongMessage(step) };

  if (step.kind === "FINAL") {
    const completionCode = generateCompletionCode();
    await ctx.repo.playSession.update(activeSession.id, {
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
      completionCode,
      currentStepOrder: step.order,
    });
    return {
      kind: "CORRECT",
      reveal: step.reveal,
      message: resolveCorrectMessage(step),
      completionCode,
    };
  }

  const steps = await ctx.repo.step.listByCaseId(step.caseId);
  const next = nextOrderAfter(steps, step.order) ?? step.order;
  await ctx.repo.playSession.update(activeSession.id, {
    currentStepOrder: next,
    lastSeenAt: new Date().toISOString(),
  });

  return { kind: "CORRECT", reveal: step.reveal, message: resolveCorrectMessage(step) };
}

export type HintResult = { kind: "HINT"; hint?: string } | LockedResult;

/**
 * 힌트는 조회와 분리된 엔드포인트로 받는다 — 단계 조회에 힌트를 함께 내려주면
 * "사용했는지"를 알 수 없어 통계(16)가 불가능해진다. 반복 요청해도 1회로 집계한다.
 */
export async function requestHint(
  ctx: AppContext,
  input: { stepId: string; sessionToken?: string },
): Promise<HintResult> {
  const step = await getStepOrThrow(ctx, input.stepId);
  const session = await getSessionOf(ctx, input.sessionToken);
  const lock = openStep({ session, step });
  if (lock.kind !== "ALLOWED") return toLockedResult(ctx, lock, step.caseId);

  const activeSession = session as PlaySession;
  const attempts = await ctx.repo.stepAttempt.listBySessionId(activeSession.id);
  const alreadyUsed = attempts.some((attempt) => attempt.stepId === step.id && attempt.usedHint);

  if (!alreadyUsed) {
    await ctx.repo.stepAttempt.create({
      sessionId: activeSession.id,
      stepId: step.id,
      submitted: "",
      correct: false,
      usedHint: true,
      createdAt: new Date().toISOString(),
    });
  }

  return { kind: "HINT", hint: step.hint };
}

export type AdvanceNarrativeResult = { kind: "ADVANCED" } | LockedResult;

/** INTRO처럼 문제가 없는 단계를 지나갈 때 쓴다. 정답 판정이 없으므로 시도는 남기지 않는다. */
export async function advanceNarrativeStep(
  ctx: AppContext,
  input: { stepId: string; sessionToken?: string },
): Promise<AdvanceNarrativeResult> {
  const step = await getStepOrThrow(ctx, input.stepId);
  const session = await getSessionOf(ctx, input.sessionToken);
  const lock = openStep({ session, step });
  if (lock.kind !== "ALLOWED") return toLockedResult(ctx, lock, step.caseId);

  const activeSession = session as PlaySession;
  const steps = await ctx.repo.step.listByCaseId(step.caseId);
  const next = nextOrderAfter(steps, step.order) ?? step.order;

  await ctx.repo.playSession.update(activeSession.id, {
    currentStepOrder: next,
    lastSeenAt: new Date().toISOString(),
  });

  return { kind: "ADVANCED" };
}

export type PlayProgressResult =
  | { kind: "NOT_STARTED" }
  | { kind: "OTHER_CASE" }
  | {
      kind: "COMPLETED";
      completionCode?: string;
      /** 완주 화면이 보여줄 소요 시간(분)과 힌트 사용 횟수 (요구 14). */
      elapsedMinutes?: number;
      hintCount: number;
      closing?: PlayStepDisplay;
    }
  | { kind: "NARRATIVE"; step: PlayStepDisplay }
  | { kind: "WAITING"; stepName: string; resolved: number; total: number };

/** `/play/$caseId` 화면이 지금 무엇을 보여줘야 하는지 판단한다. */
export async function getPlayProgress(
  ctx: AppContext,
  input: { caseId: string; sessionToken?: string },
): Promise<PlayProgressResult> {
  const session = await getSessionOf(ctx, input.sessionToken);
  if (!session) return { kind: "NOT_STARTED" };
  if (session.caseId !== input.caseId) return { kind: "OTHER_CASE" };

  const steps = await ctx.repo.step.listByCaseId(input.caseId);

  if (session.status === "COMPLETED") {
    const closing = steps.find((step) => step.kind === "CLOSING");
    // 힌트는 세션당 1회로 기록되므로 행 수가 곧 사용 횟수다.
    const attempts = await ctx.repo.stepAttempt.listBySessionId(session.id);
    return {
      kind: "COMPLETED",
      completionCode: session.completionCode,
      elapsedMinutes: elapsedMinutesRounded(session),
      hintCount: attempts.filter((attempt) => attempt.usedHint).length,
      closing: closing ? toPlayStepDisplay(closing) : undefined,
    };
  }

  const current = steps.find((step) => step.order === session.currentStepOrder);
  if (current && !requiresQrToken(current.kind)) {
    return { kind: "NARRATIVE", step: toPlayStepDisplay(current) };
  }

  const { resolved, total } = progressOf(steps, session.currentStepOrder);
  return { kind: "WAITING", stepName: current?.name ?? "", resolved, total };
}
