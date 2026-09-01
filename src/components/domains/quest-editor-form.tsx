import { useFormContext } from "react-hook-form";
import * as v from "valibot";

import { SimpleImageUpload, SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import * as Fieldset from "@/components/ui/fieldset.tsx";
import { styled } from "styled-system/jsx";

const ImageValueSchema = v.object({
  src: v.pipe(v.string()),
  alt: v.string(),
});

const QuestEditorSchema = v.object({
  content: v.pipe(v.string(), v.minLength(1, "문제를 입력해주세요")),
  image: ImageValueSchema,
  answer: v.pipe(v.string(), v.minLength(1, "정답을 입력해주세요")),
  placeholder: v.string(),
  hint: v.pipe(v.string(), v.minLength(1, "힌트를 입력해주세요")),
  rewardText: v.string(),
  rewardImage: v.optional(ImageValueSchema),
});

export type QuestEditorValues = v.InferOutput<typeof QuestEditorSchema>;
export type QuestEditorDefaultValues = v.InferInput<typeof QuestEditorSchema>;

export const EMPTY_QUEST_EDITOR_VALUES: QuestEditorDefaultValues = {
  content: "",
  image: { src: "", alt: "" },
  answer: "",
  placeholder: "",
  hint: "",
  rewardText: "",
  rewardImage: undefined,
};

const Footer = styled("div", {
  base: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "3",
    pt: "2",
  },
});

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { formState } = useFormContext();
  return (
    <Button type="submit" loading={formState.isSubmitting}>
      {children}
    </Button>
  );
}

export function QuestEditorForm({
  submitLabel,
  defaultValues,
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  defaultValues: QuestEditorDefaultValues;
  onSubmit: (values: QuestEditorValues) => Promise<void>;
  onCancel?: () => void;
}) {
  return (
    <SimpleForm schema={QuestEditorSchema} defaultValues={defaultValues} onSubmit={onSubmit}>
      <Fieldset.Root>
        <Fieldset.Legend>문제</Fieldset.Legend>
        <Fieldset.Content>
          <SimpleInput name="content" label="문제" placeholder="이 QR을 찾으면 나오는 질문" />
          <SimpleImageUpload name="image" label="문제 이미지" required />
          <SimpleInput name="answer" label="정답" />
          <SimpleInput name="placeholder" label="입력창 안내 문구 (선택)" />
          <SimpleInput name="hint" label="힌트" />
        </Fieldset.Content>
      </Fieldset.Root>

      <Fieldset.Root>
        <Fieldset.Legend>정답 시 보여줄 보상 (선택)</Fieldset.Legend>
        <Fieldset.Content>
          <SimpleInput name="rewardText" label="문구" />
          <SimpleImageUpload name="rewardImage" label="이미지" />
        </Fieldset.Content>
      </Fieldset.Root>

      <Footer>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
        <SubmitButton>{submitLabel}</SubmitButton>
      </Footer>
    </SimpleForm>
  );
}
