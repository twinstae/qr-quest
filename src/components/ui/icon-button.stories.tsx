import type { Meta, StoryObj } from "@storybook/react-vite";
import { XIcon } from "lucide-react";

import { IconButton } from "./icon-button.tsx";

const meta = {
  title: "UI/IconButton",
  component: IconButton,
  args: {
    "aria-label": "닫기",
    children: <XIcon />,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "plain", size: "sm" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Solid: Story = {
  args: { variant: "solid" },
};

export const Disabled: Story = {
  args: { disabled: true },
};
