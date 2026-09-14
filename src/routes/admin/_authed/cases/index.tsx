import { createFileRoute } from "@tanstack/react-router";
import { FolderPlus } from "lucide-react";

import { CaseListItem } from "@/components/domains/case-list-item.tsx";
import { CreateCaseDialog } from "@/components/domains/case-form-dialog.tsx";
import { EmptyState } from "@/components/domains/empty-state.tsx";
import { getApiClient } from "@/lib/api-client";
import { Flex, Grid, styled } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/cases/")({
  component: RouteComponent,
  loader: async () => {
    const client = getApiClient();
    const { data } = await client.cases.get();
    return { cases: data ?? [] };
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
  const { cases } = Route.useLoaderData();

  return (
    <Main>
      <Flex justify="space-between" align="center" gap="4" mb="8">
        <PageTitle>CASE 목록</PageTitle>
        <CreateCaseDialog />
      </Flex>

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
