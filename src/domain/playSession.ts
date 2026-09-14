/**
 * 참가 세션 (요구 12). 개인정보는 수집하지 않는다 — 무엇을 언제 풀었는지만 남겨
 * 진행·재개·통계에 쓴다.
 */
export type PlaySession = {
  id: string;
  caseId: string;
  /** httpOnly 쿠키로 내려보내는 추측 불가 토큰. */
  token: string;
  status: "IN_PROGRESS" | "COMPLETED";
  /** 이 순서까지 열 수 있다. 단계를 통과할 때마다 전진한다. */
  currentStepOrder: number;
  startedAt: string;
  lastSeenAt: string;
  completedAt?: string;
  /** 완주 인증번호. 세션당 하나만 발급한다. */
  completionCode?: string;
  /** 직원이 리워드를 건네준 시각. 한 번만 쓸 수 있다. */
  redeemedAt?: string;
  /** 관리자 테스트 모드 세션은 통계에서 제외한다. */
  isTest: boolean;
};

export type StepAttempt = {
  id: string;
  sessionId: string;
  stepId: string;
  /** 제출한 값. 보기 유형이면 고른 보기 id를 이어 붙인 값. */
  submitted: string;
  correct: boolean;
  usedHint: boolean;
  createdAt: string;
};

export type CompletionCodeStatus =
  | { kind: "VALID"; code: string }
  | { kind: "ALREADY_REDEEMED"; code: string; redeemedAt: string }
  | { kind: "TEST_SESSION" }
  | { kind: "UNKNOWN" };
