import type { Meta, StoryObj } from "@storybook/react-vite";

import { QuestExperience } from "./quest-experience.tsx";

const quest = {
  content: "이 QR을 찾으면 나오는 질문은 무엇일까요?",
  placeholder: "정답을 입력하세요",
  hint: "메뉴판을 자세히 살펴보세요.",
};

const meta = {
  title: "Domains/QuestExperience",
  component: QuestExperience,
  args: {
    quest,
    onSubmit: async (result) => {
      console.log(result);
    },
  },
} satisfies Meta<typeof QuestExperience>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    state: { status: "idle" },
  },
};

export const Incorrect: Story = {
  args: {
    state: { status: "incorrect" },
  },
};

export const CorrectWithReward: Story = {
  args: {
    state: {
      status: "correct",
      reward: {
        text: "정답입니다! 커피 한 잔을 드려요.",
        image: {
          src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
          alt: "보상 이미지",
        },
      },
    },
  },
};

export const CorrectWithoutReward: Story = {
  args: {
    state: { status: "correct", reward: {} },
  },
};
