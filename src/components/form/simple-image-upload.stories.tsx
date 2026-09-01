import type { Meta, StoryObj } from "@storybook/react-vite";

import { SimpleImageUpload } from "./simple-field.tsx";
import { FormFieldStory } from "./story-utils.tsx";

const meta = {
  title: "Form/SimpleImageUpload",
  component: SimpleImageUpload,
  render: (args) => (
    <FormFieldStory defaultValues={{ image: { src: "", alt: "" } }}>
      <SimpleImageUpload {...args} />
    </FormFieldStory>
  ),
} satisfies Meta<typeof SimpleImageUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    name: "image",
    label: "문제 이미지",
  },
};

export const WithHint: Story = {
  args: {
    name: "image",
    label: "문제 이미지",
    hint: "가로 16:10 비율 이미지를 권장합니다.",
  },
};

export const Uploaded: Story = {
  render: (args) => (
    <FormFieldStory
      defaultValues={{
        image: {
          src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
          alt: "카페 외관",
        },
      }}
    >
      <SimpleImageUpload {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "image",
    label: "문제 이미지",
  },
};

export const Required: Story = {
  args: {
    name: "image",
    label: "문제 이미지",
    required: true,
  },
};

export const Invalid: Story = {
  render: (args) => (
    <FormFieldStory
      defaultValues={{ image: { src: "", alt: "" } }}
      errors={{ image: "이미지를 업로드해주세요" }}
    >
      <SimpleImageUpload {...args} />
    </FormFieldStory>
  ),
  args: {
    name: "image",
    label: "문제 이미지",
    required: true,
  },
};
