import type { Meta, StoryObj } from "@storybook/react-vite";

import { StepPreviewPanel } from "./step-preview-panel.tsx";
import {
  EMPTY_STEP_EDITOR_VALUES,
  StepEditorForm,
  toAnswerFormValues,
  type StepEditorDefaultValues,
} from "./step-editor-form.tsx";

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

const EDIT_VALUES: StepEditorDefaultValues = {
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
  correctMessage: "",
  wrongMessage: "",
  revealText: "새로운 단서가 발견되었습니다.",
  revealMedia: undefined,
  revealPreset: "FADE_UP",
  revealSound: "NONE",
};

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
    defaultValues: EDIT_VALUES,
  },
};

/**
 * 실제 수정 화면은 이 모양이다 — 오른쪽 칸에서 저장 전 초안이 그대로 참가자 화면으로 보인다.
 * 폼을 고치면 미리보기가 즉시 따라오고, 연출은 [다시 보기]로 되돌려 볼 수 있다.
 */
export const WithPreview: Story = {
  args: {
    kind: "QR",
    submitLabel: "저장",
    defaultValues: EDIT_VALUES,
    preview: <StepPreviewPanel kind="QR" />,
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
