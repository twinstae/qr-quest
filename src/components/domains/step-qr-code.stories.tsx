import type { Meta, StoryObj } from "@storybook/react-vite";

import { StepQrCodeDownload } from "./step-qr-code.tsx";

const meta = {
  title: "Domains/StepQrCodeDownload",
  component: StepQrCodeDownload,
} satisfies Meta<typeof StepQrCodeDownload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    qrToken: "K7QPM2XR9T",
    label: "QR 02",
  },
};
