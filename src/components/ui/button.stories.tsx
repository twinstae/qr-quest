import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeartIcon } from "lucide-react";
import { Stack, Wrap } from "styled-system/jsx";

import { Button } from "./button.tsx";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "버튼",
  },
} satisfies Meta<typeof Button>;

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

export const Plain: Story = {
  args: { variant: "plain" },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <HeartIcon /> 좋아요
      </>
    ),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: "제출하기",
  },
};

export const LoadingWithText: Story = {
  args: {
    loading: true,
    loadingText: "제출 중...",
    children: "제출하기",
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const AllVariants: Story = {
  render: (args) => (
    <Stack gap="4">
      {(["solid", "surface", "subtle", "outline", "plain"] as const).map((variant) => (
        <Wrap key={variant} gap="3" alignItems="center">
          {(["2xs", "xs", "sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
            <Button key={size} {...args} variant={variant} size={size}>
              {variant}/{size}
            </Button>
          ))}
        </Wrap>
      ))}
    </Stack>
  ),
};
