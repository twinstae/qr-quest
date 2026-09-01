import type { Meta, StoryObj } from "@storybook/react-vite";

import { SimpleCheckbox } from "./simple-field.tsx";
import { FormFieldStory } from "./story-utils.tsx";

const meta = {
  title: "Form/SimpleCheckbox",
  component: SimpleCheckbox,
  render: (args) => (
    <FormFieldStory>
      <SimpleCheckbox {...args} />
    </FormFieldStory>
  ),
} satisfies Meta<typeof SimpleCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    name: "consent",
    label: "약관 동의",
  },
};

export const Checked: Story = {
  render: (args) => (
    <FormFieldStory defaultValues={{ consent: true }}>
      <SimpleCheckbox {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "consent",
    label: "약관 동의",
  },
};

export const WithHint: Story = {
  args: {
    name: "consent",
    label: "약관 동의",
    hint: "마케팅 정보 수신에 동의합니다.",
  },
};

export const Required: Story = {
  args: {
    name: "consent",
    label: "약관 동의",
    required: true,
  },
};

export const Disabled: Story = {
  render: (args) => (
    <FormFieldStory defaultValues={{ consent: true }}>
      <SimpleCheckbox {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "consent",
    label: "약관 동의",
    disabled: true,
  },
};

export const Invalid: Story = {
  render: (args) => (
    <FormFieldStory errors={{ consent: "약관에 동의해주세요" }}>
      <SimpleCheckbox {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "consent",
    label: "약관 동의",
  },
};
