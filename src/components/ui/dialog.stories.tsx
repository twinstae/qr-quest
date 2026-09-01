import type { Meta, StoryObj } from "@storybook/react-vite";
import { XIcon } from "lucide-react";

import * as Dialog from "./dialog.tsx";
import { Button } from "./button.tsx";
import { IconButton } from "./icon-button.tsx";

function DialogExample(props: Dialog.RootProps) {
  return (
    <Dialog.Root {...props}>
      <Dialog.Trigger asChild>
        <Button>다이얼로그 열기</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>다이얼로그 제목</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton variant="plain" size="sm" aria-label="닫기">
                  <XIcon />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description>다이얼로그 본문 내용입니다.</Dialog.Description>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="outline">취소</Button>
              </Dialog.CloseTrigger>
              <Button>확인</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const meta = {
  title: "UI/Dialog",
  component: Dialog.Root,
  render: (args) => <DialogExample {...args} />,
} satisfies Meta<typeof Dialog.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: { defaultOpen: true },
};
