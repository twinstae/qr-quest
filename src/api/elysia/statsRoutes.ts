import { Elysia, t } from "elysia";

import { getCaseStats, getTodayOverview } from "../../application/statsService.ts";
import type { AppContext } from "../context.ts";
import { CaseStatsSchema, StatsPeriodSchema, TodayOverviewSchema } from "./schemas.ts";

/** 사장님이 보는 숫자(요구 24). 기간 필터는 세션 시작 시각 기준이다. */
export function createStatsRoutes(ctx: AppContext) {
  return new Elysia({ name: "stats-routes" })
    .get(
      "/cases/:id/stats",
      ({ params, query }) => getCaseStats(ctx, { caseId: params.id, period: query.period }),
      {
        auth: true,
        params: t.Object({ id: t.String() }),
        query: t.Object({ period: StatsPeriodSchema }),
        response: CaseStatsSchema,
      },
    )
    .get("/stats/today", () => getTodayOverview(ctx), {
      auth: true,
      response: TodayOverviewSchema,
    });
}
