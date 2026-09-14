import { XCircle } from "lucide-react";

import { StepCardForm, StepMedia, type StepCardData } from "@/components/domains/step-card.tsx";
import * as Card from "@/components/ui/card.tsx";
import type { AnswerSubmission, Media } from "@/domain/step.ts";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

export type Reveal = { text?: string; media?: Media };

export type StepExperienceState =
  | { status: "idle" }
  | { status: "incorrect" }
  | { status: "correct"; reveal: Reveal };

export function StepExperience({
  step,
  state,
  onSubmit,
}: {
  step: StepCardData;
  state: StepExperienceState;
  onSubmit: (submission: AnswerSubmission) => Promise<void>;
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
          {state.reveal.media && <StepMedia media={state.reveal.media} />}
          <Card.Header alignItems="center">
            <Card.Title textStyle="xl">
              {state.reveal.text ?? "정답입니다. 새로운 단서가 발견되었습니다."}
            </Card.Title>
          </Card.Header>
        </Card.Root>
      </VStack>
    );
  }

  return (
    <VStack minHeight="screen" justify="center" gap="4" p="4">
      <StepCardForm step={step} onSubmit={onSubmit} />
      {state.status === "incorrect" && (
        <p
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "1.5",
            color: "error",
            maxWidth: "sm",
          })}
        >
          <XCircle className={css({ boxSize: "4", flexShrink: "0" })} />
          아직 사건의 핵심에 도달하지 못했어요. 문장을 다시 살펴보세요.
        </p>
      )}
    </VStack>
  );
}
