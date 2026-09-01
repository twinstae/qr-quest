import type { Meta, StoryObj } from "@storybook/react-vite";

import * as Fieldset from "./fieldset.tsx";
import * as Field from "./field.tsx";
import { Input } from "./input.tsx";

function FieldsetExample(props: Fieldset.RootProps) {
  return (
    <Fieldset.Root {...props}>
      <Fieldset.Legend>문제</Fieldset.Legend>
      <Fieldset.Content>
        <Field.Root>
          <Field.Label>문제</Field.Label>
          <Input placeholder="이 QR을 찾으면 나오는 질문" />
        </Field.Root>
        <Field.Root>
          <Field.Label>정답</Field.Label>
          <Input />
        </Field.Root>
        <Fieldset.HelperText>모든 필드는 필수입니다.</Fieldset.HelperText>
        <Fieldset.ErrorText>입력값을 확인해주세요.</Fieldset.ErrorText>
      </Fieldset.Content>
    </Fieldset.Root>
  );
}

const meta = {
  title: "UI/Fieldset",
  component: Fieldset.Root,
  render: (args) => <FieldsetExample {...args} />,
} satisfies Meta<typeof Fieldset.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = {
  args: { invalid: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
