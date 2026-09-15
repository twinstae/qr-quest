import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/domains/confirm-dialog.tsx";
import { ReissueTokenButton } from "@/components/domains/reissue-token-button.tsx";
import { EditStepDialog } from "@/components/domains/step-form-dialog.tsx";
import { StepQrCodeDownload } from "@/components/domains/step-qr-code.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
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
  caseId,
  step,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  reissueQrToken,
  deleteStep,
}: {
  /** 단계 수정 후 캐시 무효화 범위를 좁히는 데 쓴다 — 없으면 CASE 전체를 무효화한다. */
  caseId?: string;
  step: StepListItemData;
  /** 순서 이동 버튼을 함께 보여줄 때만 넘긴다 — 단독 미리보기 등에서는 생략한다. */
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** 넘기면 QR이 있는 단계에 [QR 재발급] 버튼이 보인다. */
  reissueQrToken?: () => Promise<string>;
  /** 넘기면 [삭제] 버튼이 보인다 — 단독 미리보기 등에서는 생략한다. */
  deleteStep?: () => Promise<void>;
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
            {reissueQrToken && (
              <ReissueTokenButton reissue={reissueQrToken} onReissued={() => {}} />
            )}
          </Flex>
        ) : (
          <span className={css({ textStyle: "xs", color: "fg.subtle" })}>QR 없음</span>
        )}
        <Flex gap="2">
          <EditStepDialog caseId={caseId} stepId={step.id} />
          {deleteStep && (
            <ConfirmDialog
              title="단계 삭제"
              description={`"${step.name}" 단계를 삭제할까요? 되돌릴 수 없어요.`}
              confirmLabel="삭제하기"
              trigger={
                <Button variant="outline" size="sm">
                  <Trash2 /> 삭제
                </Button>
              }
              onConfirm={deleteStep}
            />
          )}
        </Flex>
      </Card.Footer>
    </Card.Root>
  );
}
