import { X } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button.tsx";
import * as Dialog from "@/components/ui/dialog.tsx";

export function DialogShell({
  title,
  trigger,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)} lazyMount>
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
