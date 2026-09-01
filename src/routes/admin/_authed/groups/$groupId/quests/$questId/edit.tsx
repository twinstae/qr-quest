import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { QuestEditorForm } from "@/components/domains/quest-editor-form";
import { getApiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/_authed/groups/$groupId/quests/$questId/edit")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const { data } = await client.quests({ id: params.questId }).edit.get();
    return { quest: data };
  },
});

function RouteComponent() {
  const { groupId, questId } = Route.useParams();
  const { quest } = Route.useLoaderData();
  const navigate = useNavigate();

  if (!quest) return <p>퀘스트를 찾을 수 없습니다.</p>;

  return (
    <QuestEditorForm
      title="Quest 수정"
      submitLabel="저장"
      defaultValues={{
        __brand: "ValidData",
        content: quest.content,
        image: quest.image,
        answer: quest.answer,
        placeholder: quest.placeholder,
        hint: quest.hint,
        rewardText: quest.reward.text ?? "",
        rewardImage: quest.reward.image,
      }}
      onSubmit={async ({ content, image, answer, placeholder, hint, rewardText, rewardImage }) => {
        const client = getApiClient();
        await client.quests({ id: questId }).patch({
          content,
          image,
          answer,
          placeholder,
          hint,
          rewardText: rewardText || undefined,
          rewardImage,
        });
        await navigate({ to: "/admin/groups/$groupId", params: { groupId } });
      }}
    />
  );
}
