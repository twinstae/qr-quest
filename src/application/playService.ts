import type { AppContext } from "../api/context.ts";
import type { Case } from "../domain/case.ts";
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
  type FindScreen,
  type Step,
} from "../domain/step.ts";
import {
  nextOrderAfter,
  openStep,
  planTour,
  stampProgress,
  type OpenStepResult,
  type StepStamp,
  type TourOptions,
  type TourPlan,
} from "../domain/tourFlow.ts";
import { elapsedMinutesRounded } from "../domain/tourStats.ts";
import { toStepDisplay, type StepDisplay } from "./stepService.ts";

/** 프로그램 QR(프롤로그)이 켜져 있을 때 참여를 아직 시작하지 않은 참가자에게 보여주는 안내. */
const PROLOGUE_GUIDANCE = "먼저 시작 QR을 찍어주세요.";
/** 프로그램 QR이 꺼져 있는 CASE — 문제 하나를 풀면 참여가 시작된다. */
const NO_PROLOGUE_GUIDANCE = "아직 시작 전이에요. 문제 QR을 찍어 정답을 맞히면 시작해요.";
/** 에필로그 QR을 문제보다 먼저 찍었을 때. */
const EPILOGUE_LOCK_GUIDANCE =
  "아직 문제를 다 풀지 않았어요. 남은 문제를 모두 풀면 에필로그 QR을 찍을 수 있어요.";

export type LockedResult =
  | { kind: "NOT_STARTED"; caseId: string; message: string }
  | {
      kind: "LOCKED";
      caseId: string;
      currentStepOrder: number;
      requestedOrder: number;
      stepName: string;
      message: string;
    }
  | { kind: "COMPLETED"; caseId: string };

function tourOptionsOf(caseItem: Case): TourOptions {
  return {
    freeOrder: caseItem.freeOrder,
    prologueEnabled: caseItem.prologueEnabled,
    epilogueEnabled: caseItem.epilogueEnabled,
  };
}

/**
 * 쿠키에는 CASE마다 세션 토큰이 들어 있다 — 한 기기에서도 여러 CASE를 동시에 이어서 할 수 있게.
 * 같은 CASE 토큰이 여럿이면 가장 최근에 시작한 세션을 쓴다(테스트 세션을 새로 시작한 관리자 화면 포함).
 */
async function getSessionForCase(
  ctx: AppContext,
  tokens: string[] | undefined,
  caseId: string,
): Promise<PlaySession | undefined> {
  let latest: PlaySession | undefined;
  for (const token of tokens ?? []) {
    const session = await ctx.repo.playSession.getByToken(token);
    if (!session || session.caseId !== caseId) continue;
    if (!latest || session.startedAt > latest.startedAt) latest = session;
  }
  return latest;
}

/** CASE·단계·진행 규칙·푼 문제를 한 번에 읽어 잠금과 완주를 판단할 준비를 마친다. */
type TourState = {
  caseItem: Case;
  steps: Step[];
  options: TourOptions;
  plan: TourPlan;
  session?: PlaySession | undefined;
  /** 세션이 푼 문제 — 시도 기록에서 유도한다 (순서와 무관하게 집계). */
  solved: ReadonlySet<string>;
};

async function loadTour(
  ctx: AppContext,
  caseItem: Case,
  session: PlaySession | undefined,
): Promise<TourState> {
  const steps = await ctx.repo.step.listByCaseId(caseItem.id);
  const options = tourOptionsOf(caseItem);
  const solved = new Set<string>();

  if (session) {
    const attempts = await ctx.repo.stepAttempt.listBySessionId(session.id);
    for (const attempt of attempts) {
      if (attempt.correct) solved.add(attempt.stepId);
    }
  }

  return { caseItem, steps, options, plan: planTour(steps, options), session, solved };
}

type StepGate = { kind: "ALLOWED"; tour: TourState } | LockedResult;

type NotStartedResult = { kind: "NOT_STARTED"; caseId: string; message: string };

/** 아직 참여를 시작하지 않았을 때의 안내 문구 — 프로그램 QR 유무에 따라 다르다. */
function notStartedMessage(caseItem: Case): string {
  return caseItem.prologueEnabled ? PROLOGUE_GUIDANCE : NO_PROLOGUE_GUIDANCE;
}

function notStartedResult(caseItem: Case): NotStartedResult {
  return {
    kind: "NOT_STARTED",
    caseId: caseItem.id,
    message: notStartedMessage(caseItem),
  };
}

function toLockedResult(
  result: Exclude<OpenStepResult, { kind: "ALLOWED" | "OTHER_CASE" }>,
  tour: TourState,
): LockedResult {
  const caseId = tour.caseItem.id;
  if (result.kind === "NOT_STARTED") return notStartedResult(tour.caseItem);
  if (result.kind === "COMPLETED") return { kind: "COMPLETED", caseId };

  const current = tour.steps.find((step) => step.order === result.currentStepOrder);
  const stepName = current?.name ?? "";
  return {
    kind: "LOCKED",
    caseId,
    currentStepOrder: result.currentStepOrder,
    requestedOrder: result.requestedOrder,
    stepName,
    message:
      result.reason === "EPILOGUE"
        ? EPILOGUE_LOCK_GUIDANCE
        : `아직이에요. 지금은 ${stepName}을(를) 찾을 차례예요.`,
  };
}

/**
 * 단계 하나를 열어도 되는가 판단한다. 서버가 CASE·세션·푼 문제를 모두 읽고 나서만 열리므로
 * URL을 직접 입력해도 건너뛸 수 없다.
 *
 * 프로그램 QR이 꺼져 있는 CASE는 세션이 없어도 문제 단계는 열어준다 —
 * 정답을 맞힌 순간 참여가 시작되기 때문이다.
 */
async function gateStep(
  ctx: AppContext,
  step: Step,
  sessionTokens: string[] | undefined,
): Promise<StepGate> {
  const caseItem = await ctx.repo.case.getById(step.caseId);
  if (!caseItem) throw new NotExistError(`Case id=${step.caseId} not found`);

  const session = await getSessionForCase(ctx, sessionTokens, step.caseId);
  const tour = await loadTour(ctx, caseItem, session);

  if (!session) {
    const isProblem = tour.plan.problems.some((problem) => problem.id === step.id);
    if (!tour.options.prologueEnabled && isProblem) return { kind: "ALLOWED", tour };
    return notStartedResult(caseItem);
  }

  const lock = openStep({
    session,
    step,
    steps: tour.steps,
    options: tour.options,
    solvedStepIds: tour.solved,
  });
  if (lock.kind === "ALLOWED") return { kind: "ALLOWED", tour };
  // 세션을 caseId로 고르므로 사실상 일어나지 않는다 — 화면에는 시작 안내로 풀어준다.
  if (lock.kind === "OTHER_CASE") return notStartedResult(caseItem);
  return toLockedResult(lock, tour);
}

async function getStepOrThrow(ctx: AppContext, id: string): Promise<Step> {
  const step = await ctx.repo.step.getById(id);
  if (!step) throw new NotExistError(`Step id=${id} not found`);
  return step;
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

async function createSession(
  ctx: AppContext,
  caseItem: Case,
  currentStepOrder: number,
): Promise<PlaySession> {
  const now = new Date().toISOString();
  return ctx.repo.playSession.create({
    caseId: caseItem.id,
    token: generateSessionToken(),
    status: "IN_PROGRESS",
    currentStepOrder,
    startedAt: now,
    lastSeenAt: now,
    isTest: false,
  });
}

/**
 * 시작 QR(프롤로그) 진입. 같은 사건의 기존 세션이 있으면 그대로 이어가고, 없으면 새로 만든다
 * (요구 12). 개인정보는 받지 않으므로 세션을 식별하는 값은 토큰뿐이다.
 * 쿠키의 다른 CASE 세션은 남겨 두므로 여러 CASE를 동시에 진행할 수 있다.
 */
export async function startOrResumeSession(
  ctx: AppContext,
  input: { entryToken: string; existingTokens?: string[] },
): Promise<StartSessionResult> {
  const found = await ctx.repo.case.getByEntryToken(input.entryToken);
  if (!found) throw new NotExistError(`Case entryToken=${input.entryToken} not found`);

  const existing = await getSessionForCase(ctx, input.existingTokens, found.id);
  if (existing) {
    const touched = await ctx.repo.playSession.update(existing.id, {
      lastSeenAt: new Date().toISOString(),
    });
    return toStartResult(touched, true);
  }

  const steps = await ctx.repo.step.listByCaseId(found.id);
  const introStep = steps.find((step) => step.kind === "INTRO");
  const created = await createSession(ctx, found, introStep?.order ?? 0);

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
  input: { qrToken: string; sessionTokens?: string[] },
): Promise<PlayStepResult> {
  const step = await ctx.repo.step.getByQrToken(input.qrToken);
  if (!step) throw new NotExistError(`Step qrToken=${input.qrToken} not found`);

  const gate = await gateStep(ctx, step, input.sessionTokens);
  if (gate.kind !== "ALLOWED") return gate;

  return { kind: "ALLOWED", step: toPlayStepDisplay(step, gate.tour.session?.isTest === true) };
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
 *
 * 완주 조건은 CASE 설정에 따라 다르다(요청: 스탬프 투어).
 * - 에필로그 ON : 문제를 다 풀고 마지막 단서(에필로그)를 맞혀야 완주.
 * - 에필로그 OFF: 문제를 다 풀면 바로 완주.
 * 프로그램 QR이 꺼져 있으면 정답을 맞힌 순간 세션이 만들어지며 참여가 시작된다.
 */
export async function submitAnswer(
  ctx: AppContext,
  input: { stepId: string; sessionTokens?: string[]; submission: AnswerSubmission },
): Promise<SubmitAnswerResult> {
  const step = await getStepOrThrow(ctx, input.stepId);
  const gate = await gateStep(ctx, step, input.sessionTokens);
  if (gate.kind !== "ALLOWED") return gate;

  const tour = gate.tour;
  const correct = step.answerSpec ? matchAnswer(step.answerSpec, input.submission) : false;
  const isProblem = tour.plan.problems.some((problem) => problem.id === step.id);
  // 프로그램 QR이 꺼진 CASE — 정답을 맞히는 순간 참여가 시작된다.
  const startedNow = tour.session === undefined;

  let activeSession = tour.session;
  if (!activeSession) {
    // 프로그램 QR이 없는 CASE는 시도를 남길 세션이 아직 없다 — 정답일 때만 참여를 시작한다.
    if (!correct || !isProblem) return { kind: "INCORRECT", message: resolveWrongMessage(step) };
    // 시작하자마자 사건 소개(있다면)부터 보여준다 — 프롤로그 없이도 이야기는 빠뜨리지 않는다.
    const intro = tour.steps.find((item) => item.kind === "INTRO");
    activeSession = await createSession(ctx, tour.caseItem, intro?.order ?? step.order);
  }

  await ctx.repo.stepAttempt.create({
    sessionId: activeSession.id,
    stepId: step.id,
    submitted: submissionToText(input.submission),
    correct,
    usedHint: false,
    createdAt: new Date().toISOString(),
  });

  if (!correct) return { kind: "INCORRECT", message: resolveWrongMessage(step) };

  const solved = new Set([...tour.solved, step.id]);
  const allProblemsSolved = tour.plan.problems.every((problem) => solved.has(problem.id));
  const epiloguePending =
    allProblemsSolved && tour.plan.epilogue && !solved.has(tour.plan.epilogue.id);
  // 테스트 세션은 관리자가 완료 화면을 바로 확인해야 하므로 마지막 단서만 맞혀도 완주로 본다(요구 30-8).
  const completed =
    (allProblemsSolved && !epiloguePending) || (activeSession.isTest && step.kind === "FINAL");

  if (completed) {
    const completionCode = activeSession.completionCode ?? generateCompletionCode();
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

  // 아직 완주 전 — 자유 진행에서는 순서가 없으므로 currentStepOrder는 안내용으로만 쓴다.
  // 세션을 방금 만들었다면 사건 소개(INTRO)부터 보여주기 위해 순서는 그대로 둔다.
  const next = startedNow
    ? activeSession.currentStepOrder
    : (nextOrderAfter(tour.steps, step.order) ?? step.order);
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
  input: { stepId: string; sessionTokens?: string[] },
): Promise<HintResult> {
  const step = await getStepOrThrow(ctx, input.stepId);
  const gate = await gateStep(ctx, step, input.sessionTokens);
  if (gate.kind !== "ALLOWED") return gate;

  const session = gate.tour.session;
  // 프로그램 QR이 꺼진 CASE는 아직 세션이 없을 수 있다 — 힌트는 보여주되 집계에 남기지 않는다.
  if (!session) return { kind: "HINT", hint: step.hint };

  const attempts = await ctx.repo.stepAttempt.listBySessionId(session.id);
  const alreadyUsed = attempts.some((attempt) => attempt.stepId === step.id && attempt.usedHint);

  if (!alreadyUsed) {
    await ctx.repo.stepAttempt.create({
      sessionId: session.id,
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
  input: { stepId: string; sessionTokens?: string[] },
): Promise<AdvanceNarrativeResult> {
  const step = await getStepOrThrow(ctx, input.stepId);
  const gate = await gateStep(ctx, step, input.sessionTokens);
  if (gate.kind !== "ALLOWED") return gate;

  const session = gate.tour.session;
  if (!session) return notStartedResult(gate.tour.caseItem);

  const next = nextOrderAfter(gate.tour.steps, step.order) ?? step.order;
  await ctx.repo.playSession.update(session.id, {
    currentStepOrder: next,
    lastSeenAt: new Date().toISOString(),
  });

  return { kind: "ADVANCED" };
}

export type PlayProgressResult =
  | { kind: "NOT_STARTED"; message: string }
  | {
      kind: "COMPLETED";
      completionCode?: string;
      /** 완주 화면이 보여줄 소요 시간(분)과 힌트 사용 횟수 (요구 14). */
      elapsedMinutes?: number;
      hintCount: number;
      closing?: PlayStepDisplay;
    }
  | { kind: "NARRATIVE"; step: PlayStepDisplay }
  /**
   * 다음 QR을 기다리는 중. `stamps`는 스탬프판 동그라미 칸 — 푼 문제에만 도장이 찍혀 있고,
   * `anyOrder`가 true면 남은 문제 QR을 아무 순서로나 찍으면 된다.
   * `findScreen`은 지금 찾을 단계에 관리자가 적어 둔 안내 문구(자유 진행에서는 없다).
   */
  | {
      kind: "WAITING";
      stepName: string;
      anyOrder: boolean;
      stamps: StepStamp[];
      findScreen?: FindScreen;
    };

/** `/play/$caseId` 화면이 지금 무엇을 보여줘야 하는지 판단한다. */
export async function getPlayProgress(
  ctx: AppContext,
  input: { caseId: string; sessionTokens?: string[] },
): Promise<PlayProgressResult> {
  const caseItem = await ctx.repo.case.getById(input.caseId);
  if (!caseItem) throw new NotExistError(`Case id=${input.caseId} not found`);

  const session = await getSessionForCase(ctx, input.sessionTokens, input.caseId);
  if (!session) return { kind: "NOT_STARTED", message: notStartedMessage(caseItem) };

  const tour = await loadTour(ctx, caseItem, session);

  if (session.status === "COMPLETED") {
    const closing = tour.steps.find((step) => step.kind === "CLOSING");
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

  const { stamps } = stampProgress(tour.plan, tour.solved);
  const current = tour.steps.find((step) => step.order === session.currentStepOrder);

  // 사건 소개·종결 화면은 문제 없이 지나가는 화면이다. 종결은 완주했을 때만 보여준다.
  if (current && !requiresQrToken(current.kind) && current.kind !== "CLOSING") {
    return { kind: "NARRATIVE", step: toPlayStepDisplay(current) };
  }

  const epilogue = tour.plan.epilogue;
  const allProblemsSolved = tour.plan.problems.every((problem) => tour.solved.has(problem.id));
  if (epilogue && allProblemsSolved && !tour.solved.has(epilogue.id)) {
    return {
      kind: "WAITING",
      stepName: epilogue.name,
      anyOrder: false,
      stamps,
      findScreen: epilogue.findScreen,
    };
  }

  if (tour.options.freeOrder) return { kind: "WAITING", stepName: "", anyOrder: true, stamps };

  return {
    kind: "WAITING",
    stepName: current?.name ?? "",
    anyOrder: false,
    stamps,
    findScreen: current?.findScreen,
  };
}
