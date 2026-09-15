import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button.tsx";
import { formatCaseNumber } from "@/domain/case.ts";
import { getApiClient } from "@/lib/api-client";
import { css } from "styled-system/css";
import { Grid, styled } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/cases/$caseId/print")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const [{ data: caseItem }, { data: steps }] = await Promise.all([
      client.cases({ id: params.caseId }).get(),
      client.cases({ id: params.caseId }).steps.get(),
    ]);
    if (!caseItem) throw notFound();
    const qrSteps = (steps ?? [])
      .filter((step) => step.qrToken !== null)
      .sort((a, b) => a.order - b.order);
    return { caseItem, qrSteps };
  },
});

const Main = styled("main", {
  base: { maxWidth: "3xl", marginX: "auto", width: "full", px: "6", py: "10" },
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

const cardStyle = css({
  borderWidth: "1px",
  borderStyle: "dashed",
  borderColor: "border",
  borderRadius: "md",
  p: "4",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1",
  textAlign: "center",
});

type Card = { name: string; title: string; url: string; token: string };

function PrintCard({ card }: { card: Card }) {
  return (
    <div className={cardStyle} style={{ breakInside: "avoid" }}>
      <div className={css({ textStyle: "2xl", fontWeight: "bold" })}>{card.name}</div>
      <div className={css({ textStyle: "sm", color: "fg.muted" })}>{card.title}</div>
      <QRCodeSVG value={card.url} size={140} title={card.url} />
      <div className={css({ textStyle: "xs", color: "fg.subtle", fontFamily: "mono" })}>
        {card.token}
      </div>
    </div>
  );
}

function RouteComponent() {
  const { caseItem, qrSteps } = Route.useLoaderData();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const cards: Card[] = [
    {
      name: "시작 QR",
      title: caseItem.title,
      url: `${origin}/s/${caseItem.entryToken}`,
      token: caseItem.entryToken,
    },
    ...qrSteps.map((step) => ({
      name: step.name,
      title: step.title,
      url: `${origin}/t/${step.qrToken}`,
      token: step.qrToken ?? "",
    })),
  ];

  return (
    <Main>
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@media print { .no-print { display: none !important; } @page { size: A4; margin: 12mm; } }",
        }}
      />

      <div className="no-print">
        <Link to="/admin/cases/$caseId" params={{ caseId: caseItem.id }} className={backLinkStyle}>
          <ArrowLeft className={css({ boxSize: "4" })} /> {formatCaseNumber(caseItem.number)}{" "}
          {caseItem.title}
        </Link>
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: "6",
          })}
        >
          <h1 className={css({ textStyle: "xl", fontWeight: "bold" })}>인쇄 시트</h1>
          <Button onClick={() => window.print()}>
            <Printer /> 인쇄하기
          </Button>
        </div>
      </div>

      <Grid columns={2} gap="4">
        {cards.map((card) => (
          <PrintCard key={card.token} card={card} />
        ))}
      </Grid>
    </Main>
  );
}
