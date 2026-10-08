import type { Meta, StoryObj } from "@storybook/react-vite";

import { SimpleTextarea } from "./simple-field.tsx";
import { FormFieldStory } from "./story-utils.tsx";

const meta = {
  title: "Form/SimpleTextarea",
  component: SimpleTextarea,
  render: (args) => (
    <FormFieldStory>
      <SimpleTextarea {...args} />
    </FormFieldStory>
  ),
} satisfies Meta<typeof SimpleTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "question",
    label: "문제",
  },
};

export const WithHint: Story = {
  args: {
    name: "question",
    label: "문제",
    hint: "여러 줄로 써도 돼요.",
  },
};

export const WithPlaceholder: Story = {
  args: {
    name: "question",
    label: "문제",
    placeholder: "1948년에 일어난 일은?",
  },
};

export const Required: Story = {
  args: {
    name: "question",
    label: "문제",
    required: true,
  },
};

export const WithValue: Story = {
  render: (args) => (
    <FormFieldStory defaultValues={{ name: "1948년에 일어난 일은?" }}>
      <SimpleTextarea {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "question",
    label: "문제",
  },
};

export const Disabled: Story = {
  render: (args) => (
    <FormFieldStory defaultValues={{ name: "1948년에 일어난 일은?" }}>
      <SimpleTextarea {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "question",
    label: "문제",
    disabled: true,
  },
};

export const Invalid: Story = {
  render: (args) => (
    <FormFieldStory errors={{ name: "이름을 입력해주세요" }}>
      <SimpleTextarea {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "question",
    label: "문제",
  },
};
