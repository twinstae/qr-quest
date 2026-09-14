import { useState } from "react";

import { DialogShell } from "@/components/domains/dialog-shell.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Flex, styled, VStack } from "styled-system/jsx";

const Description = styled("p", {
  base: {
    textStyle: "sm",
    color: "fg.muted",
  },
});

const ErrorText = styled("p", {
  base: {
    textStyle: "sm",
    color: "error",
  },
});

/**
 * 되돌릴 수 없는 동작을 실행하기 전에 한 번 묻는 다이얼로그.
 * 실행 중에는 버튼이 로딩 상태가 되고, 실패하면 열린 채로 남겨 다시 시도할 수 있게 한다.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <DialogShell title={title} open={open} onOpenChange={setOpen} trigger={trigger}>
      <VStack alignItems="stretch" gap="4">
        <Description>{description}</Description>
        {failed && (
          <ErrorText role="alert">처리하지 못했어요. 잠시 후 다시 시도해 주세요.</ErrorText>
        )}
        <Flex justify="flex-end" gap="3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            colorPalette="red"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              setFailed(false);
              try {
                await onConfirm();
                setOpen(false);
              } catch {
                // 실패 이유는 호출한 쪽이 알고 있으므로 여기서는 열어둔 채로 남긴다.
                setFailed(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </Flex>
      </VStack>
    </DialogShell>
  );
}
