import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { QuestEditorForm } from "@/components/domains/quest-editor-form";
import { getApiClient } from "@/lib/api-client";
import { styled } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/groups/$groupId/quests/new")({
  component: RouteComponent,
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
  const navigate = useNavigate();

  return (
    <CenterMain>
      <QuestEditorForm
        title="Quest 생성"
        submitLabel="Quest 만들기"
        defaultValues={{
          content: "",
          image: { src: "", alt: "" },
          answer: "",
          placeholder: "",
          hint: "",
          rewardText: "",
          rewardImage: undefined,
        }}
        onSubmit={async ({
          content,
          image,
          answer,
          placeholder,
          hint,
          rewardText,
          rewardImage,
        }) => {
          const client = getApiClient();
          await client.quests.post({
            groupId,
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
    </CenterMain>
  );
}
