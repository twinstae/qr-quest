import type { Meta, StoryObj } from "@storybook/react-vite";

import { SimpleInput } from "./simple-field.tsx";
import { FormFieldStory } from "./story-utils.tsx";

const meta = {
  title: "Form/SimpleInput",
  component: SimpleInput,
  render: (args) => (
    <FormFieldStory>
      <SimpleInput {...args} />
    </FormFieldStory>
  ),
} satisfies Meta<typeof SimpleInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "name",
    label: "이름",
  },
};

export const WithHint: Story = {
  args: {
    name: "name",
    label: "이름",
    hint: "실명을 입력해주세요.",
  },
};

export const WithPlaceholder: Story = {
  args: {
    name: "name",
    label: "이름",
    placeholder: "김태희",
  },
};

export const Required: Story = {
  args: {
    name: "name",
    label: "이름",
    required: true,
  },
};

export const WithValue: Story = {
  render: (args) => (
    <FormFieldStory defaultValues={{ name: "김태희" }}>
      <SimpleInput {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "name",
    label: "이름",
  },
};

export const Disabled: Story = {
  render: (args) => (
    <FormFieldStory defaultValues={{ name: "김태희" }}>
      <SimpleInput {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "name",
    label: "이름",
    disabled: true,
  },
};

export const Invalid: Story = {
  render: (args) => (
    <FormFieldStory errors={{ name: "이름을 입력해주세요" }}>
      <SimpleInput {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "name",
    label: "이름",
  },
};
