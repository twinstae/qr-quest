import type { Meta, StoryObj } from "@storybook/react-vite";
import { Wrap } from "styled-system/jsx";

import { Spinner } from "./spinner.tsx";

const meta = {
  title: "UI/Spinner",
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllSizes: Story = {
  render: (args) => (
    <Wrap gap="4" alignItems="center">
      {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
        <Spinner key={size} {...args} size={size} />
      ))}
    </Wrap>
  ),
};
