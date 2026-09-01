import type { Meta, StoryObj } from "@storybook/react-vite";

import { Span } from "./span.tsx";

const meta = {
  title: "UI/Span",
  component: Span,
  args: {
    children: "styled span",
  },
} satisfies Meta<typeof Span>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Styled: Story = {
  args: {
    color: "fg.muted",
    fontWeight: "semibold",
  },
};
