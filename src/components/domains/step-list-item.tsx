import { ArrowDown, ArrowUp } from "lucide-react";

import { PreviewDialog } from "@/components/domains/preview-dialog.tsx";
import { ReissueTokenButton } from "@/components/domains/reissue-token-button.tsx";
import { EditStepDialog } from "@/components/domains/step-form-dialog.tsx";
import { StepQrCodeDownload } from "@/components/domains/step-qr-code.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import * as Card from "@/components/ui/card.tsx";
import { IconButton } from "@/components/ui/icon-button.tsx";
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

export function StepListItem({
  step,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  reissueQrToken,
}: {
  step: StepListItemData;
  /** 순서 이동 버튼을 함께 보여줄 때만 넘긴다 — 단독 미리보기 등에서는 생략한다. */
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** 넘기면 QR이 있는 단계에 [QR 재발급] 버튼이 보인다. */
  reissueQrToken?: () => Promise<string>;
}) {
  return (
    <Card.Root variant="outline">
      <Card.Header pb="2">
        <Flex justify="space-between" align="center" gap="2">
          <Card.Title>{step.name}</Card.Title>
          <Flex gap="1" flexShrink="0" align="center">
            {!step.published && <Badge variant="outline">비공개</Badge>}
            <Badge variant={step.hasAnswer ? "solid" : "outline"}>
              {step.hasAnswer ? "정답 있음" : "정답 없음"}
            </Badge>
            {onMoveUp && onMoveDown && (
              <Flex gap="1" ml="1">
                <IconButton
                  variant="outline"
                  size="xs"
                  aria-label="위로 이동"
                  disabled={!canMoveUp}
                  onClick={onMoveUp}
                >
                  <ArrowUp />
                </IconButton>
                <IconButton
                  variant="outline"
                  size="xs"
                  aria-label="아래로 이동"
                  disabled={!canMoveDown}
                  onClick={onMoveDown}
                >
                  <ArrowDown />
                </IconButton>
              </Flex>
            )}
          </Flex>
        </Flex>
        <Card.Description>
          <span className={css({ color: "fg.default" })}>{step.title}</span>
          {step.qrToken === null && " · QR 없는 단계"}
        </Card.Description>
      </Card.Header>
      <Card.Footer justifyContent="space-between" alignItems="center">
        {step.qrToken ? (
          <Flex gap="2" align="center">
            <StepQrCodeDownload qrToken={step.qrToken} label={step.name} />
            {reissueQrToken && <ReissueTokenButton reissue={reissueQrToken} onReissued={() => {}} />}
          </Flex>
        ) : (
          <span className={css({ textStyle: "xs", color: "fg.subtle" })}>QR 없음</span>
        )}
        <Flex gap="2">
          <PreviewDialog previewUrl={`/admin/preview/${step.id}`} />
          <EditStepDialog stepId={step.id} />
        </Flex>
      </Card.Footer>
    </Card.Root>
  );
}
