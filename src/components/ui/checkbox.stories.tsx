import type { Meta, StoryObj } from "@storybook/react-vite";

import * as Checkbox from "./checkbox.tsx";

function CheckboxExample(props: Checkbox.RootProps) {
  return (
    <Checkbox.Root {...props}>
      <Checkbox.HiddenInput />
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Label>약관에 동의합니다</Checkbox.Label>
    </Checkbox.Root>
  );
}

const meta = {
  title: "UI/Checkbox",
  component: Checkbox.Root,
  render: (args) => <CheckboxExample {...args} />,
} satisfies Meta<typeof Checkbox.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Indeterminate: Story = {
  args: { checked: "indeterminate" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Invalid: Story = {
  args: { invalid: true },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Large: Story = {
  args: { size: "lg" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};
