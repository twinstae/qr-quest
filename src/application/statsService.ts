import type { AppContext } from "../api/context.ts";
import { NotExistError } from "../domain/errors.ts";
import {
  periodSinceIso,
  startOfDayIso,
  summarizeCaseStats,
  type CaseStats,
  type StatsPeriod,
} from "../domain/tourStats.ts";

export type CaseStatsResult = CaseStats & {
  caseId: string;
  caseNumber: number;
  caseTitle: string;
  period: StatsPeriod;
};

/**
 * 사장님이 CASE별 난이도를 조정할 수 있게 통계를 모은다(요구 24).
 *
 * 기간은 세션의 **시작 시각** 기준이다 — "9월 10일에 시작한 사람들 중 몇 명이 끝냈나"가
 * 사장님이 알고 싶은 것이고, 완료 시각으로 나누면 같은 사람이 두 기간에 걸친다.
 * 테스트 모드 세션은 항상 뺀다(요구 30-8) — 관리자가 누른 횟수가 난이도를 흐린다.
 */
export async function getCaseStats(
  ctx: AppContext,
  input: { caseId: string; period: StatsPeriod; now?: Date },
): Promise<CaseStatsResult> {
  const caseItem = await ctx.repo.case.getById(input.caseId);
  if (!caseItem) throw new NotExistError(`Case id=${input.caseId} not found`);

  const now = input.now ?? new Date();
  const since = periodSinceIso(input.period, now);

  const [steps, sessions] = await Promise.all([
    ctx.repo.step.listByCaseId(input.caseId),
    ctx.repo.playSession.listByCaseId(input.caseId),
  ]);

  const cohort = sessions.filter(
    (session) => !session.isTest && (since === undefined || session.startedAt >= since),
  );
  const attempts = await ctx.repo.stepAttempt.listBySessionIds(cohort.map((session) => session.id));

  return {
    caseId: caseItem.id,
    caseNumber: caseItem.number,
    caseTitle: caseItem.title,
    period: input.period,
    ...summarizeCaseStats({ steps, sessions: cohort, attempts }),
  };
}

export type TodayOverview = { started: number; completed: number };

/** 관리자 첫 화면의 "오늘 참가 / 오늘 완료". CASE 하나가 아니라 전체 합계다. */
export async function getTodayOverview(
  ctx: AppContext,
  input: { now?: Date } = {},
): Promise<TodayOverview> {
  const since = startOfDayIso(input.now ?? new Date());
  const [started, completed] = await Promise.all([
    ctx.repo.playSession.countStartedSince(since),
    ctx.repo.playSession.countCompletedSince(since),
  ]);
  return { started, completed };
}
