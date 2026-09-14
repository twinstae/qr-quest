import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPinPlus } from "lucide-react";

import { EmptyState } from "@/components/domains/empty-state.tsx";
import { CreateStepDialog } from "@/components/domains/step-form-dialog.tsx";
import { StepListItem } from "@/components/domains/step-list-item.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { formatCaseNumber } from "@/domain/case.ts";
import { getApiClient } from "@/lib/api-client";
import { css } from "styled-system/css";
import { Flex, Grid, styled } from "styled-system/jsx";

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
        </Flex>
        <CreateStepDialog caseId={caseItem.id} />
      </Flex>

      {steps.length === 0 ? (
        <EmptyState
          icon={<MapPinPlus />}
          title="아직 이 CASE에 단계가 없어요"
          description="단계를 추가하면 QR 코드를 내려받아 책 사이에 배치할 수 있어요."
          action={<CreateStepDialog caseId={caseItem.id} />}
        />
      ) : (
        <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
          {steps.map((step) => (
            <StepListItem key={step.id} step={step} />
          ))}
        </Grid>
      )}
    </Main>
  );
}
