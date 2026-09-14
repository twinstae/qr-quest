import type { Meta, StoryObj } from "@storybook/react-vite";

import { StepCardForm } from "./step-card.tsx";

const meta = {
  title: "Domains/StepCardForm",
  component: StepCardForm,
  args: {
    onSubmit: async (submission) => {
      console.log(submission);
    },
    onRequestHint: async () => {
      console.log("hint requested");
      return "표지 안에 답이 있습니다.";
    },
  },
} satisfies Meta<typeof StepCardForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShortText: Story = {
  args: {
    step: {
      name: "QR 02",
      title: "헌법논증이론의 저자는 누구일까요?",
      body: "서가 두 번째 칸을 살펴보세요.",
      media: {
        kind: "image",
        src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
        alt: "책 표지",
      },
      question: "저자의 이름은?",
      answerSpec: { type: "SHORT_TEXT" },
      placeholder: "정답을 입력하세요",
      hasHint: true,
    },
  },
};

export const SingleChoice: Story = {
  args: {
    step: {
      name: "QR 03",
      title: "이 책이 꽂혀 있던 자리는?",
      body: "",
      question: "가장 가까운 서가를 고르세요.",
      answerSpec: {
        type: "SINGLE_CHOICE",
        choices: [
          { id: "A", label: "창가 쪽 서가" },
          { id: "B", label: "계단 옆 서가" },
          { id: "C", label: "책상 뒤 서가" },
        ],
      },
    },
  },
};
