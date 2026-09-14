import { EditStepDialog } from "@/components/domains/step-form-dialog.tsx";
import { StepQrCodeDownload } from "@/components/domains/step-qr-code.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import * as Card from "@/components/ui/card.tsx";
import { css } from "styled-system/css";
import { Flex } from "styled-system/jsx";

export type StepListItemData = {
  id: string;
  order: number;
  kind: string;
  name: string;
  qrToken: string | null;
  published: boolean;
  title: string;
  hasAnswer: boolean;
};

export function StepListItem({ step }: { step: StepListItemData }) {
  return (
    <Card.Root variant="outline">
      <Card.Header pb="2">
        <Flex justify="space-between" align="center" gap="2">
          <Card.Title>{step.name}</Card.Title>
          <Flex gap="1" flexShrink="0">
            {!step.published && <Badge variant="outline">비공개</Badge>}
            <Badge variant={step.hasAnswer ? "solid" : "outline"}>
              {step.hasAnswer ? "정답 있음" : "정답 없음"}
            </Badge>
          </Flex>
        </Flex>
        <Card.Description>
          <span className={css({ color: "fg.default" })}>{step.title}</span>
          {step.qrToken === null && " · QR 없는 단계"}
        </Card.Description>
      </Card.Header>
      <Card.Footer justifyContent="space-between" alignItems="center">
        {step.qrToken ? (
          <StepQrCodeDownload qrToken={step.qrToken} label={step.name} />
        ) : (
          <span className={css({ textStyle: "xs", color: "fg.subtle" })}>QR 없음</span>
        )}
        <EditStepDialog stepId={step.id} />
      </Card.Footer>
    </Card.Root>
  );
}
