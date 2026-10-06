import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";

import { CaseThemedScreen } from "@/components/domains/case-themed-screen.tsx";
import { CompletionScreen } from "@/components/domains/completion-screen.tsx";
import { StartScreenCard } from "@/components/domains/start-screen-card.tsx";
import { startOrResumeSession } from "@/lib/play-session";
import { caseByEntryQueryOptions } from "@/queries/cases.ts";
import { caseThemeQueryOptions } from "@/queries/themes.ts";
import { VStack } from "styled-system/jsx";

export const Route = createFileRoute("/s/$entryToken")({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const [caseData, session] = await Promise.all([
      context.queryClient.query({
        ...caseByEntryQueryOptions(params.entryToken),
        staleTime: "static",
      }),
      startOrResumeSession(params.entryToken).catch(() => undefined),
    ]);
    if (!session) throw notFound();
    if (caseData) {
      await context.queryClient.query({
        ...caseThemeQueryOptions(caseData.id),
        staleTime: "static",
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const { entryToken } = Route.useParams();
  const { data: caseData } = useQuery(caseByEntryQueryOptions(entryToken));
  if (!caseData) return null;

  return (
    <CaseThemedScreen caseId={caseData.id}>
      <StartScreen entryToken={entryToken} />
    </CaseThemedScreen>
  );
}

function StartScreen({ entryToken }: { entryToken: string }) {
  const { session } = Route.useLoaderData();
  const { data: caseData } = useQuery(caseByEntryQueryOptions(entryToken));
  const navigate = useNavigate();
  if (!caseData) return null;

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
      <StartScreenCard
        caseInfo={caseData}
        resumed={session.resumed}
        resumeUrl={resumeUrl}
        onStart={() => navigate({ to: "/play/$caseId", params: { caseId: caseData.id } })}
      />
    </VStack>
  );
}
