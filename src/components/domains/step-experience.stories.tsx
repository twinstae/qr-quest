import type { Meta, StoryObj } from "@storybook/react-vite";

import type { RevealPreset } from "@/domain/step.ts";

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

const INCORRECT_MESSAGE = "아직 사건의 핵심에 도달하지 못했어요. 문장을 다시 살펴보세요.";
const CORRECT_MESSAGE = "정답입니다. 새로운 단서가 발견되었습니다.";

export const Incorrect: Story = {
  args: {
    state: { status: "incorrect", message: INCORRECT_MESSAGE },
  },
};

export const CorrectWithReveal: Story = {
  args: {
    state: {
      status: "correct",
      message: CORRECT_MESSAGE,
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
    state: { status: "correct", message: CORRECT_MESSAGE, reveal: {} },
  },
};

/**
 * 연출은 카드 하나에 걸린다 — 사진과 문구가 함께 움직이는지 보려면 단서에 사진이 있어야
 * 한다. 그래서 프리셋 스토리는 전부 사진을 넣는다(사진 없는 단서는 CorrectWithoutReveal).
 */
const CLUE_PHOTO = {
  kind: "image" as const,
  src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
  alt: "서가 사이에 놓인 낡은 책",
};

function revealWith(preset: RevealPreset, text: string): Story["args"] {
  return {
    state: {
      status: "correct",
      message: CORRECT_MESSAGE,
      reveal: { text, preset, media: CLUE_PHOTO },
    },
  };
}

export const RevealUnroll: Story = {
  args: revealWith("UNROLL", "두루마리가 펴지며 단서가 드러납니다."),
};

export const RevealFadeUp: Story = {
  args: revealWith("FADE_UP", "차분하게 떠오르는 단서입니다."),
};

export const RevealTypewriter: Story = {
  args: revealWith("TYPEWRITER", "한 글자씩 드러나는 단서입니다."),
};

export const RevealTvScan: Story = {
  args: revealWith("TV_SCAN", "브라운관처럼 스캔되며 나타납니다."),
};

export const RevealGlitch: Story = {
  args: revealWith("GLITCH", "순간적으로 어긋나는 단서입니다."),
};

export const RevealCardUnfold: Story = {
  args: revealWith("CARD_UNFOLD", "접힌 카드를 누르면 단서가 펼쳐집니다."),
};
