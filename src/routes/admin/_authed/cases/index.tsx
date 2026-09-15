import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderPlus, ScanLine } from "lucide-react";

import { CaseListItem } from "@/components/domains/case-list-item.tsx";
import { CreateCaseDialog } from "@/components/domains/case-form-dialog.tsx";
import { DashboardSummary } from "@/components/domains/dashboard-summary.tsx";
import { EmptyState } from "@/components/domains/empty-state.tsx";
import { Button } from "@/components/ui/button.tsx";
import { summarizeCaseStatuses } from "@/domain/case.ts";
import { getApiClient } from "@/lib/api-client";
import { css } from "styled-system/css";
import { Flex, Grid, styled } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/cases/")({
  component: RouteComponent,
  loader: async () => {
    const client = getApiClient();
    const [{ data }, { data: today }] = await Promise.all([
      client.cases.get(),
      client.stats.today.get(),
    ]);
    return { cases: data ?? [], today };
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

const PageTitle = styled("h1", {
  base: {
    textStyle: "2xl",
    fontWeight: "bold",
  },
});

function RouteComponent() {
  const { cases, today } = Route.useLoaderData();
  const { liveCount, totalCount } = summarizeCaseStatuses(cases);

  return (
    <Main>
      <Flex justify="space-between" align="center" gap="4" mb="6">
        <PageTitle>CASE 목록</PageTitle>
        <Flex align="center" gap="2">
          {/* 매장에서 리워드를 건넬 때 여는 화면. 한 번에 닿을 수 있게 목록 상단에 둔다. */}
          <Link to="/admin/redeem" className={css({ display: "inline-flex" })}>
            <Button variant="outline">
              <ScanLine /> 리워드 확인
            </Button>
          </Link>
          <CreateCaseDialog />
        </Flex>
      </Flex>

      <DashboardSummary
        liveCount={liveCount}
        totalCount={totalCount}
        startedToday={today?.started}
        completedToday={today?.completed}
      />

      {cases.length === 0 ? (
        <EmptyState
          icon={<FolderPlus />}
          title="아직 만들어진 CASE가 없어요"
          description="CASE는 사건 하나를 통째로 담는 단위예요. 먼저 CASE를 하나 만들어보세요."
          action={<CreateCaseDialog />}
        />
      ) : (
        <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
          {cases.map((item) => (
            <CaseListItem
              key={item.id}
              item={{
                id: item.id,
                number: item.number,
                title: item.title,
                teaser: item.teaser,
                status: item.status,
              }}
            />
          ))}
        </Grid>
      )}
    </Main>
  );
}
