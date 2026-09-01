import { createFileRoute } from "@tanstack/react-router";

import * as Card from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { getApiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/_authed/groups/$groupId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const { data } = await client.groups({ id: params.groupId }).quests.get();
    return { quests: data ?? [] };
  },
});

function RouteComponent() {
  const { quests } = Route.useLoaderData();

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>그룹의 Quest 목록</Card.Title>
      </Card.Header>
      <Card.Body>
        {/* "Quest 만들기"는 ticket 04에서 실제 폼으로 연결한다 */}
        <Button type="button" color="primary" disabled className="mt-2">
          Quest 만들기
        </Button>

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
