import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { QrCheckPanel, type QrCheckOutcome } from "@/components/domains/qr-check-panel.tsx";
import { formatCaseNumber } from "@/domain/case.ts";
import { getApiClient } from "@/lib/api-client";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/cases/$caseId/check")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const [{ data: caseItem }, { data: steps }] = await Promise.all([
      client.cases({ id: params.caseId }).get(),
      client.cases({ id: params.caseId }).steps.get(),
    ]);
    if (!caseItem) throw notFound();
    // 발급된 QR 수 + 시작 QR 1장.
    const qrCount = (steps ?? []).filter((step) => step.qrToken !== null).length + 1;
    return { caseItem, qrCount };
  },
});

const Main = styled("main", {
  base: { maxWidth: "md", marginX: "auto", width: "full", px: "6", py: "10" },
});

const backLinkStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  color: "fg.muted",
  textStyle: "sm",
  mb: "3",
  _hover: { color: "fg.default" },
});

function RouteComponent() {
  const { caseItem, qrCount } = Route.useLoaderData();

  return (
    <Main>
      <Link to="/admin/cases/$caseId" params={{ caseId: caseItem.id }} className={backLinkStyle}>
        <ArrowLeft className={css({ boxSize: "4" })} /> {formatCaseNumber(caseItem.number)}{" "}
        {caseItem.title}
      </Link>
      <h1 className={css({ textStyle: "xl", fontWeight: "bold", mb: "6" })}>설치 점검</h1>

      <QrCheckPanel
        totalCount={qrCount}
        checkToken={async (token) => {
          const { data } = await getApiClient()
            .cases({ id: caseItem.id })
            ["qr-check"].get({ query: { token } });
          return (data ?? { kind: "UNKNOWN" }) as QrCheckOutcome;
        }}
      />
    </Main>
  );
}
