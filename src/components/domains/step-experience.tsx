import { MessageCircleQuestion } from "lucide-react";

import { StepCardForm, StepMedia, type StepCardData } from "@/components/domains/step-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import type { AnswerSubmission, Media, RevealPreset } from "@/domain/step.ts";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";
import { revealAnimation } from "styled-system/recipes";

export type Reveal = { text?: string; media?: Media; preset?: RevealPreset };

export type StepExperienceState =
  | { status: "idle" }
  | { status: "incorrect" }
  | { status: "correct"; reveal: Reveal };

export function StepExperience({
  step,
  state,
  onSubmit,
  onRequestHint,
  onContinue,
}: {
  step: StepCardData;
  state: StepExperienceState;
  onSubmit: (submission: AnswerSubmission) => Promise<void>;
  onRequestHint: () => Promise<string | undefined>;
  /** 정답 화면에서 "다음 단서 찾기"를 눌렀을 때. */
  onContinue: () => void;
}) {
  if (state.status === "correct") {
    return (
      <VStack minHeight="screen" justify="center" p="4" gap="4">
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
            <Card.Title
              textStyle="xl"
              className={revealAnimation({ preset: state.reveal.preset ?? "FADE_UP" })}
            >
              {state.reveal.text ?? "정답입니다. 새로운 단서가 발견되었습니다."}
            </Card.Title>
          </Card.Header>
        </Card.Root>
        <Button size="lg" width="full" maxWidth="sm" onClick={onContinue}>
          다음 단서 찾기
        </Button>
      </VStack>
    );
  }

  return (
    <VStack minHeight="screen" justify="center" gap="4" p="4">
      <StepCardForm step={step} onSubmit={onSubmit} onRequestHint={onRequestHint} />
      {state.status === "incorrect" && (
        // role="status"(공손한 알림)를 쓴다 — role="alert"는 오류로 읽혀 좌절을 준다(요구 8).
        <p
          role="status"
          aria-label="안내"
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "1.5",
            // 오답은 실패가 아니라 다시 시도하면 되는 것이라, 경고색(error)을 쓰지 않는다.
            color: "fg.muted",
            maxWidth: "sm",
          })}
        >
          <MessageCircleQuestion className={css({ boxSize: "4", flexShrink: "0" })} />
          아직 사건의 핵심에 도달하지 못했어요. 문장을 다시 살펴보세요.
        </p>
      )}
    </VStack>
  );
}
