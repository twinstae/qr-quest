import { XCircle } from "lucide-react";

import { QuestCardForm, type Quest } from "@/components/domains/quest-card.tsx";
import * as Card from "@/components/ui/card.tsx";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

export type Reward = { text?: string; image?: { src: string; alt: string } };

export type QuestExperienceState =
  | { status: "idle" }
  | { status: "incorrect" }
  | { status: "correct"; reward: Reward };

export function QuestExperience({
  quest,
  state,
  onSubmit,
}: {
  quest: Quest;
  state: QuestExperienceState;
  onSubmit: (result: { answer: string }) => Promise<void>;
}) {
  if (state.status === "correct") {
    return (
      <VStack minHeight="screen" justify="center" p="4">
        <Card.Root
          variant="elevated"
          colorPalette="green"
          width="full"
          maxWidth="sm"
          alignItems="center"
          textAlign="center"
        >
          {state.reward.image && (
            <img
              src={state.reward.image.src}
              alt={state.reward.image.alt}
              className={css({ width: "full", aspectRatio: "16 / 10", objectFit: "cover" })}
            />
          )}
          <Card.Header alignItems="center">
            <Card.Title textStyle="xl">{state.reward.text ?? "정답입니다!"}</Card.Title>
          </Card.Header>
        </Card.Root>
      </VStack>
    );
  }

  return (
    <VStack minHeight="screen" justify="center" gap="4" p="4">
      <QuestCardForm quest={quest} onSubmit={onSubmit} />
      {state.status === "incorrect" && (
        <p className={css({ display: "flex", alignItems: "center", gap: "1.5", color: "error" })}>
          <XCircle className={css({ boxSize: "4" })} />
          아쉬워요, 다시 시도해보세요.
        </p>
      )}
    </VStack>
  );
}
