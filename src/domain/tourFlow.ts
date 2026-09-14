import type { PlaySession } from "./playSession.ts";
import type { Step } from "./step.ts";

/** 사건 진행 상태를 클라이언트가 아니라 서버가 판단한 결과. */
export type OpenStepResult =
  | { kind: "ALLOWED" }
  /** 아직 시작 QR을 찍지 않았다. */
  | { kind: "NOT_STARTED" }
  /** 앞 단계를 통과하지 않았다. URL을 직접 입력해도 여기서 막힌다. */
  | { kind: "LOCKED"; currentStepOrder: number; requestedOrder: number }
  /** 이미 완주한 세션. 완료 인증 화면을 다시 보여준다. */
  | { kind: "COMPLETED" }
  /** 다른 사건의 QR을 찍었다. */
  | { kind: "OTHER_CASE"; sessionCaseId: string };

type SessionState = Pick<PlaySession, "caseId" | "status" | "currentStepOrder">;
type StepLocation = Pick<Step, "caseId" | "order">;

/**
 * 이 단계를 지금 열어도 되는가 (요구 11).
 *
 * 잠금을 클라이언트에 맡기면 URL을 직접 입력해 건너뛸 수 있다.
 * 판단은 여기서만 하고, 화면은 결과를 표시만 한다.
 */
export function openStep(input: {
  session?: SessionState | undefined;
  step: StepLocation;
}): OpenStepResult {
  const { session, step } = input;

  if (!session) return { kind: "NOT_STARTED" };
  if (session.caseId !== step.caseId) {
    return { kind: "OTHER_CASE", sessionCaseId: session.caseId };
  }
  if (session.status === "COMPLETED") return { kind: "COMPLETED" };
  if (step.order > session.currentStepOrder) {
    return {
      kind: "LOCKED",
      currentStepOrder: session.currentStepOrder,
      requestedOrder: step.order,
    };
  }

  return { kind: "ALLOWED" };
}

/**
 * 정답을 맞힌 단계 다음에 열리는 순서.
 * 마지막 단계면 undefined — 그때는 세션을 완료로 바꾼다.
 */
export function nextOrderAfter(steps: StepLocation[], order: number): number | undefined {
  const orders = steps.map((step) => step.order).sort((left, right) => left - right);
  const next = orders.find((candidate) => candidate > order);
  return next;
}

/** 참가자에게 보여줄 진행 상황. 미스터리의 긴장을 해치지 않게 숫자만 돌려준다. */
export function progressOf(
  steps: Pick<Step, "order" | "kind">[],
  currentStepOrder: number,
): { resolved: number; total: number } {
  const qrSteps = steps.filter((step) => step.kind === "QR" || step.kind === "FINAL");
  const resolved = qrSteps.filter((step) => step.order <= currentStepOrder).length;
  return { resolved, total: qrSteps.length };
}
