import { createFileRoute, Link } from "@tanstack/react-router";
import { button } from "styled-system/recipes";

import { QuestQrCodeDownload } from "@/components/domains/quest-qr-code.tsx";
import * as Card from "@/components/ui/card.tsx";
import { getApiClient } from "@/lib/api-client";
import { styled } from "styled-system/jsx";
import { css } from "styled-system/css";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/_authed/groups/$groupId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const { data } = await client.groups({ id: params.groupId }).quests.get();
    return { quests: data ?? [] };
  },
});

const CenterMain = styled("main", {
  base: {
    minHeight: "screen",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    justifyContent: "center",
    alignItems: "center",
  },
});

function RouteComponent() {
  const { groupId } = Route.useParams();
  const { quests } = Route.useLoaderData();

  return (
    <CenterMain>
      <Card.Root minWidth="400px" maxWidth="screen">
        <Card.Header>
          <Card.Title>그룹의 Quest 목록</Card.Title>
        </Card.Header>
        <Card.Body>
          {quests.length === 0 ? (
            <p>아직 이 그룹에 Quest가 없습니다.</p>
          ) : (
            <ul className={css({ display: "flex", flexDirection: "column", gap: "16px" })}>
              {quests.map((quest) => (
                <li
                  key={quest.id}
                  className={css({ display: "flex", flexDirection: "column", gap: "16px" })}
                >
                  <img src={quest.image.src} alt={quest.image.alt} width={48} height={48} />
                  질문 : {quest.content}
                  정답 : {quest.answer}
                  <Link
                    to="/admin/groups/$groupId/quests/$questId/edit"
                    params={{ groupId, questId: quest.id }}
                    className={button({ variant: "solid", size: "sm" })}
                  >
                    수정
                  </Link>
                  <QuestQrCodeDownload questId={quest.id} />
                </li>
              ))}
              <li>
                <Link
                  to="/admin/groups/$groupId/quests/new"
                  params={{ groupId }}
                  className={cn(button(), css({ width: "full" }))}
                >
                  Quest 만들기
                </Link>
              </li>
            </ul>
          )}
        </Card.Body>
      </Card.Root>
    </CenterMain>
  );
}
