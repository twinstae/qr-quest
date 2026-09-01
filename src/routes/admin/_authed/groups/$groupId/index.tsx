import { createFileRoute, Link } from "@tanstack/react-router";
import { button } from "styled-system/recipes";

import { QuestQrCodeDownload } from "@/components/domains/quest-qr-code.tsx";
import * as Card from "@/components/ui/card.tsx";
import { getApiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/_authed/groups/$groupId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const { data } = await client.groups({ id: params.groupId }).quests.get();
    return { quests: data ?? [] };
  },
});

function RouteComponent() {
  const { groupId } = Route.useParams();
  const { quests } = Route.useLoaderData();

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>그룹의 Quest 목록</Card.Title>
      </Card.Header>
      <Card.Body>
        <Link to="/admin/groups/$groupId/quests/new" params={{ groupId }} className={button()}>
          Quest 만들기
        </Link>

        {quests.length === 0 ? (
          <p>아직 이 그룹에 Quest가 없습니다.</p>
        ) : (
          <ul>
            {quests.map((quest) => (
              <li key={quest.id}>
                <img src={quest.image.src} alt={quest.image.alt} width={48} height={48} />
                {quest.content}
                <Link
                  to="/admin/groups/$groupId/quests/$questId/edit"
                  params={{ groupId, questId: quest.id }}
                >
                  수정
                </Link>
                <QuestQrCodeDownload questId={quest.id} />
              </li>
            ))}
          </ul>
        )}
      </Card.Body>
    </Card.Root>
  );
}
