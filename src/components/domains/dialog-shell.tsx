import { X } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button.tsx";
import * as Dialog from "@/components/ui/dialog.tsx";

export function DialogShell({
  title,
  trigger,
  open,
  onOpenChange,
  children,
  size = "md",
}: {
  title: string;
  trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** 내용이 넓어야 하는 편집기는 "wide"를 쓴다(참가자 미리보기를 옆에 두는 경우). */
  size?: "md" | "wide";
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      size={size}
      lazyMount
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton variant="plain" size="sm" aria-label="닫기">
                  <X />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
