import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MapPinPlus } from "lucide-react";

import { CreateQuestDialog } from "@/components/domains/quest-form-dialog.tsx";
import { EmptyState } from "@/components/domains/empty-state.tsx";
import { QuestListItem } from "@/components/domains/quest-list-item.tsx";
import { getApiClient } from "@/lib/api-client";
import { css } from "styled-system/css";
import { Flex, Grid, styled } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/groups/$groupId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const { data } = await client.groups({ id: params.groupId }).quests.get();
    return { quests: data ?? [] };
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

const BackLink = styled(Link, {
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    color: "fg.muted",
    textStyle: "sm",
    mb: "3",
    _hover: { color: "fg.default" },
  },
});

const PageTitle = styled("h1", {
  base: {
    textStyle: "2xl",
    fontWeight: "bold",
  },
});

function RouteComponent() {
  const { groupId } = Route.useParams();
  const { quests } = Route.useLoaderData();

  return (
    <Main>
      <BackLink to="/admin/groups">
        <ArrowLeft className={css({ boxSize: "4" })} /> 그룹 목록
      </BackLink>

      <Flex justify="space-between" align="center" gap="4" mb="8">
        <PageTitle>Quest 목록</PageTitle>
        <CreateQuestDialog groupId={groupId} />
      </Flex>

      {quests.length === 0 ? (
        <EmptyState
          icon={<MapPinPlus />}
          title="아직 이 그룹에 Quest가 없어요"
          description="Quest를 추가하면 QR 코드를 내려받아 현장에 배치할 수 있어요."
          action={<CreateQuestDialog groupId={groupId} />}
        />
      ) : (
        <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
          {quests.map((quest) => (
            <QuestListItem key={quest.id} quest={quest} />
          ))}
        </Grid>
      )}
    </Main>
  );
}
