import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { CompletionScreen } from "@/components/domains/completion-screen.tsx";
import { GuidanceScreen } from "@/components/domains/guidance-screen.tsx";
import { StepExperience, type StepExperienceState } from "@/components/domains/step-experience.tsx";
import type { PlayStepResult, SubmitAnswerResult, HintResult } from "@/application/playService.ts";
import { getApiClient } from "@/lib/api-client";
import { unwrapPlayResult } from "@/lib/play-client";
import { useWakeLock } from "@/lib/use-wake-lock";

export const Route = createFileRoute("/t/$qrToken")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const response = await client.play.steps.qr({ qrToken: params.qrToken }).get();
    return { result: unwrapPlayResult<PlayStepResult>(response) };
  },
});

function RouteComponent() {
  const { result } = Route.useLoaderData();
  const navigate = useNavigate();
  const [state, setState] = useState<StepExperienceState>({ status: "idle" });
  useWakeLock(result.kind === "ALLOWED" && state.status !== "correct");

  if (result.kind === "NOT_STARTED") {
    return <GuidanceScreen text="먼저 시작 QR을 찍어주세요." />;
  }

  if (result.kind === "OTHER_CASE") {
    return <GuidanceScreen text="이 QR은 다른 사건의 것이에요." />;
  }

  if (result.kind === "COMPLETED") {
    return <CompletionScreen closingTitle="이미 사건을 해결했어요" />;
  }

  if (result.kind === "LOCKED") {
    return (
      <GuidanceScreen
        text={`아직이에요. 지금은 ${result.stepName}을(를) 찾을 차례예요.`}
        onReturn={() => navigate({ to: "/play/$caseId", params: { caseId: result.caseId } })}
      />
    );
  }

  const { step } = result;

  return (
    <StepExperience
      step={step}
      state={state}
      onSubmit={async (submission) => {
        const client = getApiClient();
        const response = await client.play
          .steps({ id: step.id })
          ["submit-answer"].post(
            submission.type === "CHOICE"
              ? { choiceIds: submission.choiceIds }
              : { answer: submission.value },
          );
        const outcome = unwrapPlayResult<SubmitAnswerResult>(response);

        setState(
          outcome.kind === "CORRECT"
            ? { status: "correct", reveal: outcome.reveal }
            : { status: "incorrect" },
        );
      }}
      onRequestHint={async () => {
        const client = getApiClient();
        const response = await client.play.steps({ id: step.id }).hint.post();
        const outcome = unwrapPlayResult<HintResult>(response);
        return outcome.kind === "HINT" ? outcome.hint : undefined;
      }}
      onContinue={() => navigate({ to: "/play/$caseId", params: { caseId: step.caseId } })}
    />
  );
}
