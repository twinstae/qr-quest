import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { StepExperience, type StepExperienceState } from "@/components/domains/step-experience.tsx";
import { getApiClient } from "@/lib/api-client";

export const Route = createFileRoute("/t/$qrToken")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const { data: step } = await client.steps.qr({ qrToken: params.qrToken }).get();
    if (!step) throw notFound();
    return { step };
  },
});

function RouteComponent() {
  const { step } = Route.useLoaderData();
  const [state, setState] = useState<StepExperienceState>({ status: "idle" });

  return (
    <StepExperience
      step={step}
      state={state}
      onSubmit={async (submission) => {
        const client = getApiClient();
        const { data } = await client
          .steps({ id: step.id })
          ["submit-answer"].post(
            submission.type === "CHOICE"
              ? { choiceIds: submission.choiceIds }
              : { answer: submission.value },
          );

        setState(
          data && data.correct
            ? { status: "correct", reveal: data.reveal }
            : { status: "incorrect" },
        );
      }}
    />
  );
}
