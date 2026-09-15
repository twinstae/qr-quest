import { createFileRoute, useRouter } from "@tanstack/react-router";

import { CompletionScreen } from "@/components/domains/completion-screen.tsx";
import { GuidanceScreen } from "@/components/domains/guidance-screen.tsx";
import { ProgressDots } from "@/components/domains/progress-dots.tsx";
import { StepMedia } from "@/components/domains/step-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import type { PlayProgressResult } from "@/application/playService.ts";
import { getApiClient } from "@/lib/api-client";
import { unwrapPlayResult } from "@/lib/play-client";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

export const Route = createFileRoute("/play/$caseId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const response = await client.play.cases({ caseId: params.caseId }).progress.get();
    return { progress: unwrapPlayResult<PlayProgressResult>(response) };
  },
});

function RouteComponent() {
  const { progress } = Route.useLoaderData();
  const router = useRouter();

  if (progress.kind === "NOT_STARTED") {
    return <GuidanceScreen text="먼저 시작 QR을 찍어주세요." />;
  }

  if (progress.kind === "OTHER_CASE") {
    return <GuidanceScreen text="이 사건은 지금 진행 중인 사건이 아니에요." />;
  }

  if (progress.kind === "COMPLETED") {
    return (
      <CompletionScreen
        closingTitle={progress.closing?.title}
        closingBody={progress.closing?.body}
        closingMedia={progress.closing?.media}
        completionCode={progress.completionCode}
        elapsedMinutes={progress.elapsedMinutes}
        hintCount={progress.hintCount}
      />
    );
  }

  if (progress.kind === "NARRATIVE") {
    const { step } = progress;
    return (
      <VStack minHeight="screen" justify="center" p="4" gap="4">
        <Card.Root variant="elevated" width="full" maxWidth="sm">
          {step.media && <StepMedia media={step.media} />}
          <Card.Header>
            <Card.Title textStyle="xl">{step.title}</Card.Title>
            {step.body && <Card.Description>{step.body}</Card.Description>}
          </Card.Header>
          <Card.Footer>
            <Button
              size="lg"
              width="full"
              onClick={async () => {
                const client = getApiClient();
                await client.play.steps({ id: step.id }).advance.post();
                await router.invalidate();
              }}
            >
              사건 시작
            </Button>
          </Card.Footer>
        </Card.Root>
      </VStack>
    );
  }

  // WAITING: 다음 QR을 아직 찾지 못했다.
  return (
    <VStack minHeight="screen" justify="center" p="4" gap="4" textAlign="center">
      <ProgressDots resolved={progress.resolved} total={progress.total} />
      <p className={css({ textStyle: "lg", fontWeight: "medium" })}>
        {progress.stepName}을(를) 찾아주세요
      </p>
    </VStack>
  );
}
