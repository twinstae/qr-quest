import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";

import { CompletionScreen } from "@/components/domains/completion-screen.tsx";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import * as Clipboard from "@/components/ui/clipboard.tsx";
import { formatCaseNumber } from "@/domain/case.ts";
import { getApiClient } from "@/lib/api-client";
import { startOrResumeSession } from "@/lib/play-session";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

export const Route = createFileRoute("/s/$entryToken")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const [{ data: caseData }, session] = await Promise.all([
      client.cases["by-entry"]({ entryToken: params.entryToken }).get(),
      startOrResumeSession(params.entryToken).catch(() => undefined),
    ]);
    if (!caseData || !session) throw notFound();
    return { case: caseData, session };
  },
});

function RouteComponent() {
  const { case: caseData, session } = Route.useLoaderData();
  const { entryToken } = Route.useParams();
  const navigate = useNavigate();

  const resumeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/s/${entryToken}`
      : `/s/${entryToken}`;

  if (session.status === "COMPLETED") {
    return (
      <CompletionScreen
        closingTitle="이미 사건을 해결했어요"
        completionCode={session.completionCode}
      />
    );
  }

  return (
    <VStack minHeight="screen" justify="center" p="4" gap="4">
      <Card.Root variant="elevated" width="full" maxWidth="sm">
        {caseData.thumbnail && (
          <img
            src={caseData.thumbnail.src}
            alt={caseData.thumbnail.alt}
            className={css({ width: "full", aspectRatio: "16 / 10", objectFit: "cover" })}
          />
        )}
        <Card.Header>
          <span className={css({ textStyle: "sm", color: "fg.subtle" })}>
            {formatCaseNumber(caseData.number)}
          </span>
          <Card.Title textStyle="xl">{caseData.title}</Card.Title>
          <Card.Description>{caseData.teaser}</Card.Description>
        </Card.Header>
        <Card.Body>
          <p className={css({ textStyle: "sm", color: "fg.subtle" })}>
            예상 소요 시간 약 {caseData.estimatedMinutes}분
          </p>
          {session.resumed && (
            <p className={css({ textStyle: "sm", color: "fg.subtle", mt: "2" })}>
              이어서 진행할 수 있어요.
            </p>
          )}
        </Card.Body>
        <Card.Footer flexDirection="column" alignItems="stretch" gap="3">
          <Button
            size="lg"
            width="full"
            onClick={() => navigate({ to: "/play/$caseId", params: { caseId: caseData.id } })}
          >
            사건 시작
          </Button>
          <Clipboard.Root value={resumeUrl}>
            <Clipboard.Label className={css({ textStyle: "xs", color: "fg.subtle" })}>
              다른 기기에서 이어하려면 이 링크를 저장해 두세요
            </Clipboard.Label>
            <Clipboard.Control>
              <Clipboard.Input readOnly />
              <Clipboard.Trigger asChild>
                <Button variant="outline" size="sm">
                  <Clipboard.Indicator />
                </Button>
              </Clipboard.Trigger>
            </Clipboard.Control>
          </Clipboard.Root>
        </Card.Footer>
      </Card.Root>
    </VStack>
  );
}
