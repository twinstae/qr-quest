import { createFileRoute } from "@tanstack/react-router";
import { FolderPlus } from "lucide-react";

import { CreateGroupDialog } from "@/components/domains/group-form-dialog.tsx";
import { EmptyState } from "@/components/domains/empty-state.tsx";
import { GroupListItem } from "@/components/domains/group-list-item.tsx";
import { getApiClient } from "@/lib/api-client";
import { Flex, Grid, styled } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/groups/")({
  component: RouteComponent,
  loader: async () => {
    const client = getApiClient();
    const { data } = await client.groups.get();
    return { groups: data ?? [] };
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
  const { groups } = Route.useLoaderData();

  return (
    <Main>
      <Flex justify="space-between" align="center" gap="4" mb="8">
        <PageTitle>Quest 그룹</PageTitle>
        <CreateGroupDialog />
      </Flex>

      {groups.length === 0 ? (
        <EmptyState
          icon={<FolderPlus />}
          title="아직 만들어진 그룹이 없어요"
          description="그룹은 이벤트 단위로 Quest를 묶는 단위예요. 먼저 그룹을 하나 만들어보세요."
          action={<CreateGroupDialog />}
        />
      ) : (
        <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
          {groups.map((group) => (
            <GroupListItem key={group.id} group={group} />
          ))}
        </Grid>
      )}
    </Main>
  );
}
