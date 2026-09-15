import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { CaseStatsPanel } from "@/components/domains/case-stats-panel.tsx";
import { formatCaseNumber } from "@/domain/case.ts";
import type { StatsPeriod } from "@/domain/tourStats.ts";
import { caseQueryOptions, caseStatsQueryOptions } from "@/queries/cases.ts";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

const PERIODS: StatsPeriod[] = ["today", "week", "all"];

function toPeriod(value: unknown): StatsPeriod {
  return PERIODS.includes(value as StatsPeriod) ? (value as StatsPeriod) : "today";
}

export const Route = createFileRoute("/admin/_authed/cases/$caseId/stats")({
  component: RouteComponent,
  // 기간을 주소에 담는다 — 링크를 그대로 공유할 수 있고, 뒤로 가기도 자연스럽다.
  validateSearch: (search: Record<string, unknown>): { period: StatsPeriod } => ({
    period: toPeriod(search.period),
  }),
  loaderDeps: ({ search }) => ({ period: search.period }),
  loader: async ({ params, deps, context }) => {
    await Promise.all([
      context.queryClient.query({ ...caseQueryOptions(params.caseId), staleTime: "static" }),
      context.queryClient.query({
        ...caseStatsQueryOptions(params.caseId, deps.period),
        staleTime: "static",
      }),
    ]);
  },
});

const Main = styled("main", {
  base: {
    maxWidth: "5xl",
    marginX: "auto",
    width: "full",
    px: "6",
    py: "10",
  },
});

// styled(Link)로 감싸면 Link의 제네릭(파라미터·검색어 타입)이 사라진다 — 스타일만 입힌다.
const backLinkStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  color: "fg.muted",
  textStyle: "sm",
  mb: "3",
  _hover: { color: "fg.default" },
});

const PageTitle = styled("h1", {
  base: {
    textStyle: "2xl",
    fontWeight: "bold",
  },
});

function RouteComponent() {
  const { period } = Route.useSearch();
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const { data: caseItem } = useQuery(caseQueryOptions(caseId));
  const { data: stats } = useQuery(caseStatsQueryOptions(caseId, period));
  if (!caseItem || !stats) return null;

  return (
    <Main>
      <Link to="/admin/cases/$caseId" params={{ caseId }} className={backLinkStyle}>
        <ArrowLeft className={css({ boxSize: "4" })} /> 단계 목록
      </Link>

      <PageTitle className={css({ mb: "8" })}>
        {formatCaseNumber(caseItem.number)} {caseItem.title} 통계
      </PageTitle>

      <CaseStatsPanel
        stats={stats}
        period={period}
        onPeriodChange={(next) =>
          navigate({
            to: "/admin/cases/$caseId/stats",
            params: { caseId },
            search: { period: next },
          })
        }
      />
    </Main>
  );
}
