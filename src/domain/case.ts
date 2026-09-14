import { requiresQrToken, type Media, type Step, type StepKind } from "./step.ts";

export type CaseStatus = "DRAFT" | "TEST" | "LIVE" | "CLOSED";

export type Case = {
  id: string;
  /** 화면에 보이는 CASE 번호. 1 → "CASE 01". */
  number: number;
  title: string;
  /** 시작 화면의 한 줄 소개. */
  teaser: string;
  /** 사건 배경 본문. INTRO 단계의 기본값으로 쓴다. */
  intro: string;
  thumbnail?: Media;
  estimatedMinutes: number;
  status: CaseStatus;
  /** 시작 QR의 URL 토큰. /s/{entryToken} */
  entryToken: string;
  /** 최종 미션에서 찾아야 하는 책. */
  finalBookTitle?: string;
  /** 완주 기념품 안내 문구. */
  rewardNote?: string;
};

export function formatCaseNumber(value: number): string {
  return `CASE ${String(value).padStart(2, "0")}`;
}

export function summarizeCaseStatuses(
  cases: readonly { status: CaseStatus }[],
): { liveCount: number; totalCount: number } {
  return {
    liveCount: cases.filter((item) => item.status === "LIVE").length,
    totalCount: cases.length,
  };
}

/** 새 CASE를 만들면 이 뼈대가 자동으로 생긴다 — 관리자가 빈 화면을 마주하지 않게. */
export type StepTemplate = {
  order: number;
  kind: StepKind;
  name: string;
};

export const DEFAULT_QR_STEP_COUNT = 4;

export function defaultStepTemplates(qrStepCount: number = DEFAULT_QR_STEP_COUNT): StepTemplate[] {
  const templates: StepTemplate[] = [{ order: 0, kind: "INTRO", name: "사건 소개" }];

  for (let index = 1; index <= qrStepCount; index++) {
    templates.push({
      order: index,
      kind: "QR",
      name: `QR ${String(index).padStart(2, "0")}`,
    });
  }

  templates.push({ order: qrStepCount + 1, kind: "FINAL", name: "마지막 단서" });
  templates.push({ order: qrStepCount + 2, kind: "CLOSING", name: "사건 종결" });

  return templates;
}

/** 완주 화면이 이 단계 다음에 온다. */
export function isLastStep(steps: { order: number }[], order: number): boolean {
  return Math.max(...steps.map((step) => step.order)) === order;
}

export type LiveViolation =
  | { kind: "ORDER_GAP" }
  | { kind: "MISSING_CLOSING" }
  | { kind: "MISSING_INTRO_BODY" }
  | { kind: "MISSING_ANSWER"; stepId: string; stepName: string }
  | { kind: "MISSING_QR_TOKEN"; stepId: string; stepName: string };

/**
 * LIVE로 바꾸기 전 검사(요구 30). 순수 함수라 테스트가 가장 싸다 — 저장소 없이
 * 이미 가져온 단계 목록만으로 판단한다.
 */
export function checkCaseLiveReadiness(steps: Step[]): LiveViolation[] {
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

/** 위반을 관리자 화면에 그대로 보여줄 한 줄 문구로 바꾼다. */
export function describeLiveViolation(violation: LiveViolation): string {
  switch (violation.kind) {
    case "ORDER_GAP":
      return "단계 순서에 빈 자리가 있어요.";
    case "MISSING_CLOSING":
      return "사건 종결 화면이 없어요.";
    case "MISSING_INTRO_BODY":
      return "사건 소개 본문이 비어 있어요.";
    case "MISSING_ANSWER":
      return `${violation.stepName} 단계에 정답이 없어요.`;
    case "MISSING_QR_TOKEN":
      return `${violation.stepName} 단계에 QR 코드가 없어요.`;
  }
}
