import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, Wrap } from "styled-system/jsx";

import { Input } from "./input.tsx";

const meta = {
  title: "UI/Input",
  component: Input,
  args: {
    placeholder: "이름을 입력하세요",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: "김태희" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "김태희" },
};

export const Invalid: Story = {
  args: { "aria-invalid": true },
};

export const Surface: Story = {
  args: { variant: "surface" },
};

export const Subtle: Story = {
  args: { variant: "subtle" },
};

export const Flushed: Story = {
  args: { variant: "flushed" },
};

export const AllSizes: Story = {
  render: (args) => (
    <Stack gap="3" width="240px">
      {(["2xs", "xs", "sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
        <Input key={size} {...args} size={size} placeholder={size} />
      ))}
    </Stack>
  ),
};

export const AllVariants: Story = {
  render: (args) => (
    <Wrap gap="3" width="600px">
      {(["outline", "surface", "subtle", "flushed"] as const).map((variant) => (
        <Input key={variant} {...args} variant={variant} placeholder={variant} width="180px" />
      ))}
    </Wrap>
  ),
};
