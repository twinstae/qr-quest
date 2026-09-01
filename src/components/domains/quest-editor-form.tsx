import * as v from "valibot";

import { SimpleImageUpload, SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";

const ImageValueSchema = v.object({
  src: v.pipe(v.string(), v.minLength(1, "이미지를 업로드해주세요")),
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
export type QuestEditorDefaultValues = v.InferInput<typeof QuestEditorSchema> & {
  __brand: "ValidData";
};

export function QuestEditorForm({
  title,
  submitLabel,
  defaultValues,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  defaultValues: QuestEditorDefaultValues;
  onSubmit: (values: QuestEditorValues) => Promise<void>;
}) {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Body>
        <SimpleForm schema={QuestEditorSchema} defaultValues={defaultValues} onSubmit={onSubmit}>
          <SimpleInput name="content" label="문제" />
          <SimpleImageUpload name="image" label="문제 이미지" required />
          <SimpleInput name="answer" label="정답" />
          <SimpleInput name="placeholder" label="입력창 안내 문구 (선택)" />
          <SimpleInput name="hint" label="힌트" />
          <SimpleInput name="rewardText" label="정답 시 보여줄 문구 (선택)" />
          <SimpleImageUpload name="rewardImage" label="정답 시 보여줄 이미지 (선택)" />

          <Button type="submit" color="primary" className="mt-2">
            {submitLabel}
          </Button>
        </SimpleForm>
      </Card.Body>
    </Card.Root>
  );
}
