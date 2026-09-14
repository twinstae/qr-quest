import type { Media, StepKind } from "./step.ts";

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
