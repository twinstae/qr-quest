import type { PlaySession } from "./playSession.ts";
import type { Step } from "./step.ts";

/** 잠금 이유 — 화면 안내 문구를 고르는 데만 쓴다. */
export type LockReason = "ORDER" | "EPILOGUE";

/**
 * CASE가 정한 진행 방식 (요구 11 + 스탬프 투어 요청).
 *
 * - `freeOrder`      : 문제를 아무 순서로나 푼다(스탬프 투어). 꺼두면 기존처럼 순차 진행.
 * - `prologueEnabled`: 프로그램 QR을 찍어야 참여가 시작된다. 꺼두면 문제 하나를 풀면 시작.
 * - `epilogueEnabled`: 마지막 단서(에필로그)를 풀어야 완주된다. 꺼두면 문제를 다 풀면 완주.
 */
export type TourOptions = {
  freeOrder: boolean;
  prologueEnabled: boolean;
  epilogueEnabled: boolean;
};

/** 스탬프판 동그라미 칸 한 개. 푼 문제에만 도장이 찍힌다. */
export type StepStamp = {
  stepId: string;
  name: string;
  solved: boolean;
};

/** CASE의 단계를 "무엇을 다 풀어야 하는가" 기준으로 가른 결과. */
export type TourPlan = {
  /** 참가자가 풀어야 하는 문제(QR 단계) — 스탬프판 칸이 곧 이 목록이다. */
  problems: Step[];
  /** 완주까지 남은 마지막 문지기(FINAL). 없으면 문제를 다 풀면 바로 완주한다. */
  epilogue?: Step;
};

/**
 * 문제와 에필로그를 가른다. 순서·시작 여부와 무관하게 "무엇을 다 풀어야 하는가"만 정한다 —
 * 스탬프판 칸 수, 완주 판정, 에필로그 잠금이 모두 여기서 정해진다.
 *
 * 에필로그를 끄면 마지막 단서는 투어에서 빠진다 — 문제를 다 풀면 완주하므로 그 단계는
 * 더 이상 요구되지 않는다(요청: "에필로그 비활성화 시 문제를 다 풀면 완료").
 */
export function planTour(steps: Step[], options: Pick<TourOptions, "epilogueEnabled">): TourPlan {
  const sorted = [...steps].sort((left, right) => left.order - right.order);
  const epilogue = options.epilogueEnabled
    ? sorted.find((step) => step.kind === "FINAL")
    : undefined;
  const problems = sorted.filter((step) => step.kind === "QR");

  return epilogue ? { problems, epilogue } : { problems };
}

/**
 * 참가자에게 보여줄 스탬프판. 미스터리의 긴장을 해치지 않게 칸과 도장만 돌려준다.
 * 순서와 무관하게 "푼 문제"로만 세므로 자유 진행에서도 진행률이 흔들리지 않는다.
 */
export function stampProgress(
  plan: TourPlan,
  solvedStepIds: ReadonlySet<string>,
): { stamps: StepStamp[]; resolved: number; total: number } {
  const stamps = plan.problems.map((problem) => ({
    stepId: problem.id,
    name: problem.name,
    solved: solvedStepIds.has(problem.id),
  }));

  return {
    stamps,
    resolved: stamps.filter((stamp) => stamp.solved).length,
    total: stamps.length,
  };
}

/** 사건 진행 상태를 클라이언트가 아니라 서버가 판단한 결과. */
export type OpenStepResult =
  | { kind: "ALLOWED" }
  /** 아직 시작 QR(프로그램 QR)을 찍지 않았다. */
  | { kind: "NOT_STARTED" }
  /** 앞 단계를 통과하지 않았거나 에필로그를 아직 열 수 없다. URL을 직접 입력해도 여기서 막힌다. */
  | { kind: "LOCKED"; currentStepOrder: number; requestedOrder: number; reason: LockReason }
  /** 이미 완주한 세션. 완료 인증 화면을 다시 보여준다. */
  | { kind: "COMPLETED" }
  /** 다른 사건의 세션. 화면에서는 시작 안내로 풀어준다. */
  | { kind: "OTHER_CASE"; sessionCaseId: string };

type SessionState = Pick<PlaySession, "caseId" | "status" | "currentStepOrder" | "isTest">;

/**
 * 이 단계를 지금 열어도 되는가 (요구 11).
 *
 * 잠금을 클라이언트에 맡기면 URL을 직접 입력해 건너뛸 수 있다.
 * 판단은 여기서만 하고, 화면은 결과를 표시만 한다.
 */
export function openStep(input: {
  session?: SessionState | undefined;
  step: Step;
  /** 같은 CASE의 단계 전체 — 문제/에필로그 가르기에 쓴다. */
  steps: Step[];
  options: TourOptions;
  /** 세션이 이미 푼 문제. 없으면 아무것도 풀지 않은 것으로 본다. */
  solvedStepIds?: ReadonlySet<string>;
}): OpenStepResult {
  const { session, step, steps, options } = input;
  const solved = input.solvedStepIds ?? new Set<string>();

  if (!session) return { kind: "NOT_STARTED" };
  if (session.caseId !== step.caseId) {
    return { kind: "OTHER_CASE", sessionCaseId: session.caseId };
  }
  if (session.status === "COMPLETED") return { kind: "COMPLETED" };
  // 테스트 모드(요구 30-8)는 관리자가 순서·완주 조건을 신경 쓰지 않고 모든 단계를 확인해야 한다.
  if (session.isTest) return { kind: "ALLOWED" };

  const plan = planTour(steps, options);

  // 에필로그는 마지막 문지기 — 문제를 모두 풀어야 연다(순서와 무관하게).
  if (plan.epilogue?.id === step.id) {
    const remaining = plan.problems.some((problem) => !solved.has(problem.id));
    if (remaining) {
      return {
        kind: "LOCKED",
        currentStepOrder: session.currentStepOrder,
        requestedOrder: step.order,
        reason: "EPILOGUE",
      };
    }
    return { kind: "ALLOWED" };
  }

  // 자유 진행 — 스탬프 투어는 문제를 아무 순서로나 찍는다.
  if (options.freeOrder) return { kind: "ALLOWED" };

  if (step.order > session.currentStepOrder) {
    return {
      kind: "LOCKED",
      currentStepOrder: session.currentStepOrder,
      requestedOrder: step.order,
      reason: "ORDER",
    };
  }

  return { kind: "ALLOWED" };
}

/** 정답을 맞힌 단계 다음에 열리는 순서. 자유 진행에서는 안내용으로만 쓴다. */
export function nextOrderAfter(steps: Pick<Step, "order">[], order: number): number | undefined {
  const orders = steps.map((step) => step.order).sort((left, right) => left - right);
  const next = orders.find((candidate) => candidate > order);
  return next;
}
