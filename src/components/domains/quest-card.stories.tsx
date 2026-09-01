import type { Meta, StoryObj } from "@storybook/react-vite";

import { QuestCardForm } from "./quest-card.tsx";

const meta = {
  title: "Domains/QuestCardForm",
  component: QuestCardForm,
  args: {
    onSubmit: async (result) => {
      console.log(result);
    },
  },
} satisfies Meta<typeof QuestCardForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {
    quest: {
      image: {
        src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
        alt: "카페 외관",
      },
      content: "이 QR을 찾으면 나오는 질문은 무엇일까요?",
      placeholder: "정답을 입력하세요",
      hint: "메뉴판을 자세히 살펴보세요.",
    },
  },
};

export const WithoutImage: Story = {
  args: {
    quest: {
      content: "도서관 3층에서 발견한 힌트는?",
      placeholder: "정답을 입력하세요",
      hint: "사서에게 물어보세요.",
    },
  },
};
