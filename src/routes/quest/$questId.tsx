import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { styled } from "styled-system/jsx";

import { QuestCardForm } from "@/components/domains/quest-card";
import * as Card from "@/components/ui/card.tsx";
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

const VStack = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
  },
});

type Reward = { text?: string; image?: { src: string; alt: string } };

type SubmitResult =
  | { status: "idle" }
  | { status: "incorrect" }
  | { status: "correct"; reward: Reward };

function RouteComponent() {
  const { questId } = Route.useParams();
  const { quest } = Route.useLoaderData();
  const [result, setResult] = useState<SubmitResult>({ status: "idle" });

  if (result.status === "correct") {
    return (
      <VStack minHeight="screen">
        <Card.Root>
          <Card.Header>
            <Card.Title>정답입니다!</Card.Title>
          </Card.Header>
          <Card.Body>
            {result.reward.image && (
              <img src={result.reward.image.src} alt={result.reward.image.alt} />
            )}
            {result.reward.text && <p>{result.reward.text}</p>}
          </Card.Body>
        </Card.Root>
      </VStack>
    );
  }

  return (
    <VStack minHeight="screen">
      <QuestCardForm
        quest={quest}
        onSubmit={async ({ answer }) => {
          const client = getApiClient();
          const { data } = await client.quests({ id: questId })["submit-answer"].post({ answer });

          setResult(
            data?.correct ? { status: "correct", reward: data.reward } : { status: "incorrect" },
          );
        }}
      />
      {result.status === "incorrect" && <p>틀렸습니다~ 다시 시도해보세요.</p>}
    </VStack>
  );
}
