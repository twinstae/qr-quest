import { Link, useRouter } from "@tanstack/react-router";
import { ChevronRight, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/domains/confirm-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import { getApiClient } from "@/lib/api-client";
import { css } from "styled-system/css";
import { Flex } from "styled-system/jsx";
import { linkOverlay } from "styled-system/patterns";

export type QuestGroupSummary = {
  id: string;
  name: string;
  description?: string;
};

// 카드 전체가 GroupListItem의 링크 오버레이(::before, zIndex 0)로 덮여 있어서
// 삭제 버튼은 그 위로 올려야 클릭이 링크에 먹히지 않는다.
const deleteButton = css({ position: "relative", zIndex: "1" });

function DeleteGroupButton({ group }: { group: QuestGroupSummary }) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title="그룹 삭제"
      description={`"${group.name}" 그룹을 삭제할까요? 이 그룹의 Quest도 함께 삭제되고 되돌릴 수 없어요.`}
      confirmLabel="삭제하기"
      trigger={
        <Button variant="outline" size="sm" className={deleteButton}>
          <Trash2 /> 삭제
        </Button>
      }
      onConfirm={async () => {
        await getApiClient().groups({ id: group.id }).delete();
        await router.invalidate();
      }}
    />
  );
}

export function GroupListItem({ group }: { group: QuestGroupSummary }) {
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
            <Link
              to="/admin/groups/$groupId"
              params={{ groupId: group.id }}
              className={linkOverlay()}
            >
              {group.name}
            </Link>
          </Card.Title>
          <ChevronRight className={css({ color: "fg.subtle", flexShrink: "0" })} />
        </Flex>
        {group.description && <Card.Description>{group.description}</Card.Description>}
      </Card.Header>
      <Card.Footer justifyContent="flex-end">
        <DeleteGroupButton group={group} />
      </Card.Footer>
    </Card.Root>
  );
}
