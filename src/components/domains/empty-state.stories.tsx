import type { Meta, StoryObj } from "@storybook/react-vite";
import { QrCodeIcon } from "lucide-react";

import { EmptyState } from "./empty-state.tsx";
import { Button } from "@/components/ui/button.tsx";

const meta = {
  title: "Domains/EmptyState",
  component: EmptyState,
  args: {
    icon: <QrCodeIcon />,
    title: "아직 퀘스트가 없어요",
    description: "새 퀘스트를 만들어 QR 코드를 배치해보세요.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: <Button>퀘스트 만들기</Button>,
  },
};
