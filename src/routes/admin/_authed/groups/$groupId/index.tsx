import { createFileRoute, Link } from "@tanstack/react-router";
import { button } from "styled-system/recipes";

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
                {/* "수정"(ticket 05), "QR 다운로드"(ticket 01) 버튼은 각 티켓에서 추가한다 */}
              </li>
            ))}
          </ul>
        )}
      </Card.Body>
    </Card.Root>
  );
}
