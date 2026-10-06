import type { Meta, StoryObj } from "@storybook/react-vite";

import { QrCodeDownload } from "./qr-code-download.tsx";

const meta = {
  title: "Domains/QrCodeDownload",
  component: QrCodeDownload,
} satisfies Meta<typeof QrCodeDownload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Step: Story = {
  args: {
    path: "/t/K7QPM2XR9T",
    label: "QR 02",
  },
};

export const Start: Story = {
  args: {
    path: "/s/GT6NTFM3T8",
    label: "시작 QR",
  },
};
