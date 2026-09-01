import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { QuestExperience, type QuestExperienceState } from "@/components/domains/quest-experience";
import { getApiClient } from "@/lib/api-client";

export const Route = createFileRoute("/quest/$questId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const { data: quest } = await client.quests({ id: params.questId }).get();
    if (!quest) throw notFound();
    return { quest };
  },
});

function RouteComponent() {
  const { questId } = Route.useParams();
  const { quest } = Route.useLoaderData();
  const [state, setState] = useState<QuestExperienceState>({ status: "idle" });

  return (
    <QuestExperience
      quest={quest}
      state={state}
      onSubmit={async ({ answer }) => {
        const client = getApiClient();
        const { data } = await client.quests({ id: questId })["submit-answer"].post({ answer });

        setState(
          data?.correct ? { status: "correct", reward: data.reward } : { status: "incorrect" },
        );
      }}
    />
  );
}
