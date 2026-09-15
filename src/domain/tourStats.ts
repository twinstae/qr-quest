import type { PlaySession, StepAttempt } from "./playSession.ts";
import type { Step, StepKind } from "./step.ts";

/**
 * 사장님이 난이도를 조정할 수 있게 참가 세션을 집계한다(요구 24).
 *
 * 집계는 여기서만 한다 — 저장소는 원자료(세션·시도)만 돌려주고, 계산 규칙은
 * 순수 함수로 두어 테스트를 싸게 유지한다(AGENTS.md: domain → application → repo).
 * 세션 수가 CASE당 수백 건 규모라 SQL 집계보다 이쪽이 단순하고 검증하기 쉽다.
 */

/** 영업 시간의 기준. 책방은 한 곳(서울)에서만 돌아간다. */
export const BOOKSHOP_TIME_ZONE = "Asia/Seoul";

// 한국은 서머타임이 없어 고정 오프셋(+09:00)으로 계산해도 안전하다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 중간에 그만둔 세션이 평균 시간을 왜곡하지 않게 24시간을 넘긴 세션은 뺀다. */
export const LONG_SESSION_MINUTES = 24 * 60;

export type StatsPeriod = "today" | "week" | "all";

/** 책방 기준(KST) 오늘 0시. 서버가 UTC로 돌아도 "오늘"이 흔들리지 않는다. */
export function startOfDayIso(now: Date): string {
  const shifted = new Date(now.getTime() + KST_OFFSET_MS);
  const dayStartShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  return new Date(dayStartShifted - KST_OFFSET_MS).toISOString();
}

/** 기간 필터의 시작 시각. `all`이면 undefined(전체). */
export function periodSinceIso(period: StatsPeriod, now: Date): string | undefined {
  if (period === "all") return undefined;
  if (period === "today") return startOfDayIso(now);

  const shifted = new Date(now.getTime() + KST_OFFSET_MS);
  const weekStartShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() - 6,
  );
  return new Date(weekStartShifted - KST_OFFSET_MS).toISOString();
}

export type StepStats = {
  stepId: string;
  name: string;
  order: number;
  kind: StepKind;
  /** 이 단계까지 온 세션 수. */
  reached: number;
  /** 왔지만 다음으로 넘어가지 못한 세션 수. */
  dropped: number;
  /** dropped / reached. 도달이 없으면 0. */
  dropRate: number;
  /** 문제가 있는 단계만: 이 단계에 답을 제출한 세션 수. */
  attemptedSessions?: number;
  /** 첫 시도에 맞힌 세션 / 시도한 세션. "몇 명이 여기서 막히는가". */
  firstTryCorrectRate?: number;
  /** 맞은 시도 / 전체 시도. "계속 틀리는가". */
  attemptCorrectRate?: number;
  /** 힌트를 본 세션 수(세션당 1회로 기록되므로 곧 사용 횟수). */
  hintCount: number;
  hasAnswer: boolean;
  /** 사장님이 다음에 무엇을 하면 되는지 한 줄. */
  advice: string;
};

export type CaseStats = {
  started: number;
  completed: number;
  inProgress: number;
  /** completed / started. 시작이 없으면 0. */
  completionRate: number;
  /** 완료 세션의 평균 플레이 시간(분). 완료가 없으면 undefined. */
  averageMinutes?: number;
  /** 평균에서 뺀 24시간 초과 세션 수. */
  excludedLongSessions: number;
  steps: StepStats[];
  /** 첫 시도 정답률이 가장 낮은 단계. */
  hardestStep?: { stepId: string; name: string; firstTryCorrectRate: number };
  /** 힌트를 가장 많이 쓴 단계. */
  mostHintedStep?: { stepId: string; name: string; hintCount: number };
};

function ratio(part: number, total: number): number {
  return total === 0 ? 0 : part / total;
}

/** 소수점 한 자리까지만 — 사장님이 보는 숫자에 소수점이 길면 읽지 않는다. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * 이 단계의 숫자를 보고 무엇을 하면 되는지. 숫자만 있으면 사장님은 조정할 수 없다.
 */
export function adviseForStep(step: StepStats): string {
  if (!step.hasAnswer) {
    return step.dropRate >= 0.3 ? "안내 문구를 더 짧게 바꿔보세요." : "잘 지나가고 있어요.";
  }
  if ((step.attemptedSessions ?? 0) === 0) {
    return "아직 아무도 여기까지 오지 않았어요.";
  }
  if ((step.firstTryCorrectRate ?? 0) < 0.5) {
    return "힌트를 조금 더 친절하게 바꿔보세요.";
  }
  if (step.reached > 0 && step.hintCount / step.reached >= 0.5) {
    return "질문을 더 구체적으로 바꿔보세요.";
  }
  return "지금 난이도가 적당해요.";
}

function firstAttemptBySession(attempts: StepAttempt[]): Map<string, StepAttempt> {
  const first = new Map<string, StepAttempt>();
  for (const attempt of attempts) {
    const current = first.get(attempt.sessionId);
    if (!current || attempt.createdAt < current.createdAt) first.set(attempt.sessionId, attempt);
  }
  return first;
}

function sessionReaches(session: PlaySession, order: number): boolean {
  // 완료한 세션은 종결 화면까지 본 것으로 본다.
  if (session.status === "COMPLETED") return true;
  return session.currentStepOrder >= order;
}

function sessionPasses(session: PlaySession, order: number): boolean {
  if (session.status === "COMPLETED") return true;
  return session.currentStepOrder > order;
}

/** 완료한 세션의 플레이 시간(분). 아직 완료하지 않았으면 undefined. */
export function elapsedMinutes(session: PlaySession): number | undefined {
  if (!session.completedAt) return undefined;
  const elapsed = Date.parse(session.completedAt) - Date.parse(session.startedAt);
  if (Number.isNaN(elapsed)) return undefined;
  return elapsed / 60_000;
}

/** 완주 화면에 보여줄 소요 시간. 1분 안에 끝내도 "0분"이 아니라 "1분"으로 둔다. */
export function elapsedMinutesRounded(session: PlaySession): number | undefined {
  const minutes = elapsedMinutes(session);
  return minutes === undefined ? undefined : Math.max(1, Math.round(minutes));
}

export function summarizeCaseStats(input: {
  steps: Step[];
  /** 테스트 세션과 기간 밖 세션은 미리 걸러서 넘긴다. */
  sessions: PlaySession[];
  attempts: StepAttempt[];
}): CaseStats {
  const { steps, sessions } = input;
  // 종결 화면은 통과 단계가 없어 이탈률이 의미 없다 — 단계 표에서 뺀다.
  const countedSteps = steps
    .filter((step) => step.kind !== "CLOSING")
    .sort((left, right) => left.order - right.order);

  const durationSamples: number[] = [];
  let excludedLongSessions = 0;
  for (const session of sessions) {
    const minutes = elapsedMinutes(session);
    if (minutes === undefined) continue;
    if (minutes > LONG_SESSION_MINUTES) excludedLongSessions++;
    else durationSamples.push(minutes);
  }

  const averageMinutes =
    durationSamples.length === 0
      ? undefined
      : round1(durationSamples.reduce((sum, value) => sum + value, 0) / durationSamples.length);

  const stepStats = countedSteps.map((step): StepStats => {
    const stepAttempts = input.attempts.filter((attempt) => attempt.stepId === step.id);
    const hasAnswer = step.answerSpec !== undefined;

    const reached = sessions.filter((session) => sessionReaches(session, step.order)).length;
    const passed = sessions.filter((session) => sessionPasses(session, step.order)).length;

    const attemptedSessions = new Set(stepAttempts.map((attempt) => attempt.sessionId)).size;
    const firstAttempts = [...firstAttemptBySession(stepAttempts).values()];
    const firstTryCorrect = firstAttempts.filter((attempt) => attempt.correct).length;
    const correctAttempts = stepAttempts.filter((attempt) => attempt.correct).length;

    const stats: StepStats = {
      stepId: step.id,
      name: step.name,
      order: step.order,
      kind: step.kind,
      reached,
      dropped: Math.max(0, reached - passed),
      dropRate: ratio(Math.max(0, reached - passed), reached),
      hintCount: stepAttempts.filter((attempt) => attempt.usedHint).length,
      hasAnswer,
      advice: "",
    };

    if (hasAnswer) {
      stats.attemptedSessions = attemptedSessions;
      stats.firstTryCorrectRate = ratio(firstTryCorrect, attemptedSessions);
      stats.attemptCorrectRate = ratio(correctAttempts, stepAttempts.length);
    }

    return { ...stats, advice: adviseForStep(stats) };
  });

  const puzzleSteps = stepStats.filter((step) => (step.attemptedSessions ?? 0) > 0);
  const hardest = puzzleSteps.reduce<StepStats | undefined>(
    (worst, step) =>
      !worst || (step.firstTryCorrectRate ?? 0) < (worst.firstTryCorrectRate ?? 0) ? step : worst,
    undefined,
  );
  const mostHinted = stepStats
    .filter((step) => step.hintCount > 0)
    .reduce<StepStats | undefined>(
      (most, step) => (!most || step.hintCount > most.hintCount ? step : most),
      undefined,
    );

  const completed = sessions.filter((session) => session.status === "COMPLETED").length;

  return {
    started: sessions.length,
    completed,
    inProgress: sessions.length - completed,
    completionRate: ratio(completed, sessions.length),
    averageMinutes,
    excludedLongSessions,
    steps: stepStats,
    hardestStep:
      hardest && hardest.firstTryCorrectRate !== undefined
        ? {
            stepId: hardest.stepId,
            name: hardest.name,
            firstTryCorrectRate: hardest.firstTryCorrectRate,
          }
        : undefined,
    mostHintedStep: mostHinted
      ? { stepId: mostHinted.stepId, name: mostHinted.name, hintCount: mostHinted.hintCount }
      : undefined,
  };
}
