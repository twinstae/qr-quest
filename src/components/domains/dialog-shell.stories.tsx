import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { DialogShell } from "./dialog-shell.tsx";
import { Button } from "@/components/ui/button.tsx";

function DialogShellExample({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <DialogShell
      title="퀘스트 수정"
      trigger={<Button>수정하기</Button>}
      open={open}
      onOpenChange={setOpen}
    >
      <p>다이얼로그 본문 내용입니다.</p>
    </DialogShell>
  );
}

const meta = {
  title: "Domains/DialogShell",
  component: DialogShellExample,
} satisfies Meta<typeof DialogShellExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: { defaultOpen: true },
};
