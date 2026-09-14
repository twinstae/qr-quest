import { useEffect } from "react";
import { MessageCircleQuestion } from "lucide-react";

import { SoundToggle } from "@/components/domains/sound-toggle.tsx";
import { StepCardForm, StepMedia, type StepCardData } from "@/components/domains/step-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import type { AnswerSubmission, Media, RevealPreset, SoundKey } from "@/domain/step.ts";
import { playSound } from "@/lib/sound-effects";
import { useSoundPreference } from "@/lib/use-sound-preference";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";
import { revealAnimation } from "styled-system/recipes";

export type Reveal = { text?: string; media?: Media; preset?: RevealPreset; sound?: SoundKey };

export type StepExperienceState =
  | { status: "idle" }
  | { status: "incorrect"; message: string }
  | { status: "correct"; reveal: Reveal; message: string };

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
  const [soundEnabled, setSoundEnabled] = useSoundPreference();

  // 첫 사용자 제스처(정답 제출) 뒤에 열린 이 화면에서만 재생한다 — 자동재생 정책을 지킨다.
  useEffect(() => {
    if (state.status === "correct" && soundEnabled && state.reveal.sound) {
      playSound(state.reveal.sound);
    }
    // state.reveal은 매 렌더 새 객체라 status로만 가둔다 — 정답 화면에 처음 들어올 때 한 번만 재생한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const soundCorner = (
    <div className={css({ position: "fixed", top: "4", right: "4", zIndex: "1" })}>
      <SoundToggle enabled={soundEnabled} onToggle={setSoundEnabled} />
    </div>
  );

  if (state.status === "correct") {
    return (
      <VStack minHeight="screen" justify="center" p="4" gap="4">
        {soundCorner}
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
              {state.reveal.text || state.message}
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
      {soundCorner}
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
          {state.message}
        </p>
      )}
    </VStack>
  );
}
