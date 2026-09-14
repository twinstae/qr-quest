import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronRight, Trash2 } from "lucide-react";

import { CloneCaseButton } from "@/components/domains/clone-case-button.tsx";
import { ConfirmDialog } from "@/components/domains/confirm-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import * as Card from "@/components/ui/card.tsx";
import { formatCaseNumber } from "@/domain/case.ts";
import { getApiClient } from "@/lib/api-client";
import { css } from "styled-system/css";
import { Flex } from "styled-system/jsx";
import { linkOverlay } from "styled-system/patterns";

export type CaseSummary = {
  id: string;
  number: number;
  title: string;
  teaser: string;
  status: "DRAFT" | "TEST" | "LIVE" | "CLOSED";
};

// 카드 전체가 링크 오버레이(::before, zIndex 0)로 덮여 있어서
// 복제·삭제 버튼은 그 위로 올려야 클릭이 링크에 먹히지 않는다.
const overlayButton = css({ position: "relative", zIndex: "1" });

function DeleteCaseButton({ item }: { item: CaseSummary }) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title="CASE 삭제"
      description={`${formatCaseNumber(item.number)} "${item.title}"을(를) 삭제할까요? 이 사건의 단계도 함께 삭제되고 되돌릴 수 없어요.`}
      confirmLabel="삭제하기"
      trigger={
        <Button variant="outline" size="sm" className={overlayButton}>
          <Trash2 /> 삭제
        </Button>
      }
      onConfirm={async () => {
        await getApiClient().cases({ id: item.id }).delete();
        await router.invalidate();
      }}
    />
  );
}

export function CaseListItem({ item }: { item: CaseSummary }) {
  const navigate = useNavigate();

  return (
    <Card.Root
      variant="outline"
      position="relative"
      transition="colors"
      _hover={{ borderColor: "colorPalette.outline.border", bg: "gray.subtle.bg" }}
    >
      <Card.Header>
        <Flex justify="space-between" align="flex-start" gap="2">
          <Card.Title>
            <Link to="/admin/cases/$caseId" params={{ caseId: item.id }} className={linkOverlay()}>
              {formatCaseNumber(item.number)} {item.title}
            </Link>
          </Card.Title>
          <Flex align="center" gap="1" flexShrink="0">
            <Badge variant="outline">{item.status}</Badge>
            <ChevronRight className={css({ color: "fg.subtle" })} />
          </Flex>
        </Flex>
        {item.teaser && <Card.Description>{item.teaser}</Card.Description>}
      </Card.Header>
      <Card.Footer justifyContent="flex-end" alignItems="center" gap="2">
        <span className={overlayButton}>
          <CloneCaseButton
            caseId={item.id}
            cloneCase={async (caseId) => {
              const { data } = await getApiClient().cases({ id: caseId }).clone.post();
              return data ?? undefined;
            }}
            onCloned={(clonedCaseId) =>
              navigate({ to: "/admin/cases/$caseId", params: { caseId: clonedCaseId } })
            }
          />
        </span>
        <DeleteCaseButton item={item} />
      </Card.Footer>
    </Card.Root>
  );
}
