import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CompletionScreen } from "@/components/domains/completion-screen.tsx";
import { CaseThemedScreen } from "@/components/domains/case-themed-screen.tsx";
import { GuidanceScreen } from "@/components/domains/guidance-screen.tsx";
import { QrScanPanel } from "@/components/domains/qr-scan-panel.tsx";
import { StampBoard } from "@/components/domains/stamp-board.tsx";
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
      // "static"을 쓰지 않는다 — 정답·시작 때 무효화한 진행은 다시 받아야 한다(static은 무효화도 무시한다).
      context.queryClient.query(playProgressQueryOptions(params.caseId)),
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
    return <GuidanceScreen text={progress.message} />;
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
            {step.body && <Card.Description whiteSpace="pre-line">{step.body}</Card.Description>}
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

  // WAITING: 남은 문제(또는 에필로그) QR을 아직 찾지 못했다.
  return (
    <VStack minHeight="screen" justify="center" p="4" gap="6">
      <StampBoard stamps={progress.stamps} />
      <QrScanPanel
        stepName={progress.stepName}
        anyOrder={progress.anyOrder}
        title={progress.findScreen?.title}
        guide={progress.findScreen?.guide}
        hints={progress.hints}
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
