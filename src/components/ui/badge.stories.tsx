import type { Meta, StoryObj } from "@storybook/react-vite";
import { LightbulbIcon } from "lucide-react";
import { Stack, Wrap } from "styled-system/jsx";

import { Badge } from "./badge.tsx";

const meta = {
  title: "UI/Badge",
  component: Badge,
  args: {
    children: "뱃지",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {
  args: { variant: "solid" },
};

export const Surface: Story = {
  args: { variant: "surface" },
};

export const Subtle: Story = {
  args: { variant: "subtle" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <LightbulbIcon /> 힌트 보기
      </>
    ),
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <Stack gap="3">
      {(["solid", "surface", "subtle", "outline"] as const).map((variant) => (
        <Wrap key={variant} gap="2" alignItems="center">
          {(["sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
            <Badge key={size} {...args} variant={variant} size={size}>
              {variant}/{size}
            </Badge>
          ))}
        </Wrap>
      ))}
    </Stack>
  ),
};
