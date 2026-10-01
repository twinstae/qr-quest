import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CompletionScreen } from "@/components/domains/completion-screen.tsx";
import { CaseThemedScreen } from "@/components/domains/case-themed-screen.tsx";
import { GuidanceScreen } from "@/components/domains/guidance-screen.tsx";
import { ProgressDots } from "@/components/domains/progress-dots.tsx";
import { QrScanPanel } from "@/components/domains/qr-scan-panel.tsx";
import { StepMedia } from "@/components/domains/step-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import { getApiClient } from "@/lib/api-client";
import { playKeys, playProgressQueryOptions } from "@/queries/play.ts";
import { caseThemeQueryOptions } from "@/queries/themes.ts";
import { VStack } from "styled-system/jsx";

export const Route = createFileRoute("/play/$caseId")({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.query({
        ...playProgressQueryOptions(params.caseId),
        staleTime: "static",
      }),
      context.queryClient.query({ ...caseThemeQueryOptions(params.caseId), staleTime: "static" }),
    ]);
  },
});

function RouteComponent() {
  const { caseId } = Route.useParams();
  return (
    <CaseThemedScreen caseId={caseId}>
      <PlayScreen caseId={caseId} />
    </CaseThemedScreen>
  );
}

function PlayScreen({ caseId }: { caseId: string }) {
  const { data: progress } = useQuery(playProgressQueryOptions(caseId));
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!progress) return null;

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
                await queryClient.invalidateQueries({ queryKey: playKeys.progress(caseId) });
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
    <VStack minHeight="screen" justify="center" p="4" gap="6">
      <ProgressDots resolved={progress.resolved} total={progress.total} />
      <QrScanPanel
        stepName={progress.stepName}
        onScanned={(target) => {
          if (target.kind === "start") {
            navigate({ to: "/s/$entryToken", params: { entryToken: target.entryToken } });
            return;
          }
          // 카메라 앱으로 열 때처럼 매번 새로 판단한다 — 예전에 일찍 찍어 잠겼던 결과를 다시 쓰지 않는다.
          queryClient.removeQueries({ queryKey: playKeys.step(target.qrToken) });
          navigate({ to: "/t/$qrToken", params: { qrToken: target.qrToken } });
        }}
      />
    </VStack>
  );
}
