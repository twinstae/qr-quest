import type { Meta, StoryObj } from "@storybook/react-vite";

import * as Field from "./field.tsx";
import { Input } from "./input.tsx";

function FieldExample(props: Field.RootProps) {
  return (
    <Field.Root {...props}>
      <Field.Label>
        이름 <Field.RequiredIndicator />
      </Field.Label>
      <Input placeholder="이름을 입력하세요" />
      <Field.HelperText>실명을 입력해주세요.</Field.HelperText>
      <Field.ErrorText>이름을 입력해주세요.</Field.ErrorText>
    </Field.Root>
  );
}

const meta = {
  title: "UI/Field",
  component: Field.Root,
  render: (args) => <FieldExample {...args} />,
} satisfies Meta<typeof Field.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const Invalid: Story = {
  args: { invalid: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const ReadOnly: Story = {
  args: { readOnly: true },
};
