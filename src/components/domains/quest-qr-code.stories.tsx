import type { Meta, StoryObj } from "@storybook/react-vite";

import { QuestQrCodeDownload } from "./quest-qr-code.tsx";

const meta = {
  title: "Domains/QuestQrCodeDownload",
  component: QuestQrCodeDownload,
} satisfies Meta<typeof QuestQrCodeDownload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    questId: "quest-123",
  },
};
