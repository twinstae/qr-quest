import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, MapPinPlus } from "lucide-react";

import { CaseStatusControl } from "@/components/domains/case-status-control.tsx";
import { EmptyState } from "@/components/domains/empty-state.tsx";
import { StartTestModeButton } from "@/components/domains/start-test-mode-button.tsx";
import { CreateStepDialog } from "@/components/domains/step-form-dialog.tsx";
import { StepListItem } from "@/components/domains/step-list-item.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { formatCaseNumber, type LiveViolation } from "@/domain/case.ts";
import { getApiClient } from "@/lib/api-client";
import { unwrapEdenError } from "@/lib/eden-error";
import { css } from "styled-system/css";
import { Flex, styled, VStack } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/cases/$caseId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const [{ data: caseItem }, { data: steps }] = await Promise.all([
      client.cases({ id: params.caseId }).get(),
      client.cases({ id: params.caseId }).steps.get(),
    ]);
    if (!caseItem) throw notFound();
    return { caseItem, steps: steps ?? [] };
  },
});

const Main = styled("main", {
  base: {
    maxWidth: "5xl",
    marginX: "auto",
    width: "full",
    px: "6",
    py: "10",
  },
});

const BackLink = styled(Link, {
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    color: "fg.muted",
    textStyle: "sm",
    mb: "3",
    _hover: { color: "fg.default" },
  },
});

const PageTitle = styled("h1", {
  base: {
    textStyle: "2xl",
    fontWeight: "bold",
  },
});

function RouteComponent() {
  const { caseItem, steps } = Route.useLoaderData();
  const router = useRouter();
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  async function moveStep(fromIndex: number, toIndex: number) {
    const reordered = [...sortedSteps];
    const [moved] = reordered.splice(fromIndex, 1);
    if (!moved) return;
    reordered.splice(toIndex, 0, moved);

    await getApiClient()
      .cases({ id: caseItem.id })
      .steps.reorder.patch({ orderedStepIds: reordered.map((step) => step.id) });
    await router.invalidate();
  }

  return (
    <Main>
      <BackLink to="/admin/cases">
        <ArrowLeft className={css({ boxSize: "4" })} /> CASE 목록
      </BackLink>

      <Flex justify="space-between" align="center" gap="4" mb="8">
        <Flex align="center" gap="3">
          <PageTitle>
            {formatCaseNumber(caseItem.number)} {caseItem.title}
          </PageTitle>
          <Badge variant="outline">{caseItem.status}</Badge>
          <CaseStatusControl
            caseId={caseItem.id}
            status={caseItem.status}
            updateStatus={async (id, status) => {
              const { data, error } = await getApiClient().cases({ id }).status.patch({ status });
              if (data) return { kind: "OK", status: data.status };
              const payload = unwrapEdenError(error);
              const violations =
                payload && typeof payload === "object" && "violations" in payload
                  ? ((payload as { violations: LiveViolation[] }).violations ?? [])
                  : [];
              return { kind: "REJECTED", violations };
            }}
            onChanged={() => router.invalidate()}
          />
        </Flex>
        <Flex gap="2">
          <StartTestModeButton
            caseId={caseItem.id}
            startTestSession={async (id) => {
              const { data } = await getApiClient().cases({ id })["test-session"].post();
              return Boolean(data);
            }}
            onStarted={() => {
              window.open(`/play/${caseItem.id}`, "_blank");
            }}
          />
          <CreateStepDialog caseId={caseItem.id} />
        </Flex>
      </Flex>

      {steps.length === 0 ? (
        <EmptyState
          icon={<MapPinPlus />}
          title="아직 이 CASE에 단계가 없어요"
          description="단계를 추가하면 QR 코드를 내려받아 책 사이에 배치할 수 있어요."
          action={<CreateStepDialog caseId={caseItem.id} />}
        />
      ) : (
        <VStack gap="3" alignItems="stretch" maxWidth="2xl">
          {sortedSteps.map((step, index) => (
            <StepListItem
              key={step.id}
              step={step}
              canMoveUp={index > 0}
              canMoveDown={index < sortedSteps.length - 1}
              onMoveUp={() => moveStep(index, index - 1)}
              onMoveDown={() => moveStep(index, index + 1)}
            />
          ))}
        </VStack>
      )}
    </Main>
  );
}
