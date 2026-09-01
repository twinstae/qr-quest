import type { Meta, StoryObj } from "@storybook/react-vite";

import { EMPTY_QUEST_EDITOR_VALUES, QuestEditorForm } from "./quest-editor-form.tsx";

const meta = {
  title: "Domains/QuestEditorForm",
  component: QuestEditorForm,
  args: {
    onSubmit: async (values) => {
      console.log(values);
    },
    onCancel: () => {
      console.log("cancel");
    },
  },
} satisfies Meta<typeof QuestEditorForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: {
    submitLabel: "만들기",
    defaultValues: EMPTY_QUEST_EDITOR_VALUES,
  },
};

export const Edit: Story = {
  args: {
    submitLabel: "저장하기",
    defaultValues: {
      content: "이 QR을 찾으면 나오는 질문은 무엇일까요?",
      image: {
        src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
        alt: "카페 외관",
      },
      answer: "아메리카노",
      placeholder: "정답을 입력하세요",
      hint: "메뉴판을 자세히 살펴보세요.",
      rewardText: "정답입니다! 커피 한 잔을 드려요.",
      rewardImage: undefined,
    },
  },
};

export const WithoutCancel: Story = {
  args: {
    submitLabel: "만들기",
    defaultValues: EMPTY_QUEST_EDITOR_VALUES,
    onCancel: undefined,
  },
};
