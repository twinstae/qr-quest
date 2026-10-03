import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { CaseThemedScreen } from "@/components/domains/case-themed-screen.tsx";
import { CompletionScreen } from "@/components/domains/completion-screen.tsx";
import { GuidanceScreen } from "@/components/domains/guidance-screen.tsx";
import { StepExperience, type StepExperienceState } from "@/components/domains/step-experience.tsx";
import type { HintResult, PlayStepResult, SubmitAnswerResult } from "@/application/playService.ts";
import { getApiClient } from "@/lib/api-client";
import { unwrapPlayResult } from "@/lib/play-client";
import { useWakeLock } from "@/lib/use-wake-lock";
import { playStepQueryOptions } from "@/queries/play.ts";
import { caseThemeQueryOptions } from "@/queries/themes.ts";

export const Route = createFileRoute("/t/$qrToken")({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const result = await context.queryClient.query({
      ...playStepQueryOptions(params.qrToken),
      staleTime: "static",
    });
    const caseId = result && caseIdOf(result);
    if (caseId) {
      await context.queryClient.query({ ...caseThemeQueryOptions(caseId), staleTime: "static" });
    }
  },
});

function caseIdOf(result: PlayStepResult): string {
  return result.kind === "ALLOWED" ? result.step.caseId : result.caseId;
}

function RouteComponent() {
  const { qrToken } = Route.useParams();
  const { data: result } = useQuery(playStepQueryOptions(qrToken));
  if (!result) return null;

  return (
    <CaseThemedScreen caseId={caseIdOf(result)}>
      <StepScreen qrToken={qrToken} />
    </CaseThemedScreen>
  );
}

function StepScreen({ qrToken }: { qrToken: string }) {
  const { data: result } = useQuery(playStepQueryOptions(qrToken));
  const navigate = useNavigate();
  const [state, setState] = useState<StepExperienceState>({ status: "idle" });
  useWakeLock(result?.kind === "ALLOWED" && state.status !== "correct");

  if (!result) return null;

  if (result.kind === "NOT_STARTED") {
    return <GuidanceScreen text={result.message} />;
  }

  if (result.kind === "COMPLETED") {
    return <CompletionScreen closingTitle="이미 사건을 해결했어요" />;
  }

  if (result.kind === "LOCKED") {
    return (
      <GuidanceScreen
        text={result.message}
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
            ? { status: "correct", reveal: outcome.reveal, message: outcome.message }
            : {
                status: "incorrect",
                message: outcome.kind === "INCORRECT" ? outcome.message : "다시 시도해주세요.",
              },
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
