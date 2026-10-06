import type { Meta, StoryObj } from "@storybook/react-vite";

import { StartQrCard } from "./start-qr-card.tsx";

const meta = {
  title: "Domains/StartQrCard",
  component: StartQrCard,
} satisfies Meta<typeof StartQrCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entryToken: "GT6NTFM3T8",
    prologueEnabled: true,
  },
};

export const NoPrologue: Story = {
  args: {
    entryToken: "GT6NTFM3T8",
    prologueEnabled: false,
  },
};
