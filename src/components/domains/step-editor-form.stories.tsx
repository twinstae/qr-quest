import type { Meta, StoryObj } from "@storybook/react-vite";

import { EMPTY_STEP_EDITOR_VALUES, StepEditorForm, toAnswerFormValues } from "./step-editor-form.tsx";

const meta = {
  title: "Domains/StepEditorForm",
  component: StepEditorForm,
  args: {
    onSubmit: async (payload) => {
      console.log(payload);
    },
    onCancel: () => {
      console.log("cancel");
    },
  },
} satisfies Meta<typeof StepEditorForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: {
    kind: "QR",
    submitLabel: "단계 만들기",
    defaultValues: EMPTY_STEP_EDITOR_VALUES,
  },
};

export const Edit: Story = {
  args: {
    kind: "QR",
    submitLabel: "저장",
    defaultValues: {
      name: "QR 02",
      title: "헌법논증이론의 저자는 누구일까요?",
      body: "서가 두 번째 칸을 살펴보세요.",
      media: {
        src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
        alt: "책 표지",
      },
      question: "저자의 이름은?",
      ...toAnswerFormValues({ type: "SHORT_TEXT", accepted: ["이민열, 김도균"], match: "EXACT" }),
      placeholder: "정답을 입력하세요",
      hint: "표지 안에 답이 있습니다.",
      revealText: "새로운 단서가 발견되었습니다.",
      revealMedia: undefined,
      revealPreset: "FADE_UP",
      revealSound: "NONE",
    },
  },
};

export const WithoutCancel: Story = {
  args: {
    kind: "QR",
    submitLabel: "단계 만들기",
    defaultValues: EMPTY_STEP_EDITOR_VALUES,
    onCancel: undefined,
  },
};
