import type { Meta, StoryObj } from "@storybook/react-vite";

import { StepExperience } from "./step-experience.tsx";

const step = {
  name: "QR 02",
  title: "헌법논증이론의 저자는 누구일까요?",
  body: "서가 두 번째 칸을 살펴보세요.",
  question: "저자의 이름은?",
  answerSpec: { type: "SHORT_TEXT" as const },
  placeholder: "정답을 입력하세요",
  hasHint: true,
};

const meta = {
  title: "Domains/StepExperience",
  component: StepExperience,
  args: {
    step,
    onSubmit: async (submission) => {
      console.log(submission);
    },
    onRequestHint: async () => {
      console.log("hint requested");
      return "표지 안에 답이 있습니다.";
    },
    onContinue: () => {
      console.log("continue");
    },
  },
} satisfies Meta<typeof StepExperience>;

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

export const CorrectWithReveal: Story = {
  args: {
    state: {
      status: "correct",
      reveal: {
        text: "새로운 단서가 발견되었습니다.",
        media: {
          kind: "image",
          src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
          alt: "단서 이미지",
        },
      },
    },
  },
};

export const CorrectWithoutReveal: Story = {
  args: {
    state: { status: "correct", reveal: {} },
  },
};
