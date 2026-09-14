import { useFormContext } from "react-hook-form";
import * as v from "valibot";

import { SimpleImageUpload, SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import * as Fieldset from "@/components/ui/fieldset.tsx";
import type { AnswerSpec, Media } from "@/domain/step.ts";
import { styled } from "styled-system/jsx";

const ImageValueSchema = v.object({
  src: v.pipe(v.string()),
  alt: v.string(),
});

const StepEditorSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "단계 이름을 입력해주세요")),
  title: v.pipe(v.string(), v.minLength(1, "제목을 입력해주세요")),
  body: v.string(),
  media: ImageValueSchema,
  question: v.string(),
  answer: v.pipe(v.string(), v.minLength(1, "정답을 입력해주세요")),
  placeholder: v.string(),
  hint: v.string(),
  revealText: v.string(),
  revealMedia: v.optional(ImageValueSchema),
});

export type StepEditorFormValues = v.InferOutput<typeof StepEditorSchema>;
export type StepEditorDefaultValues = v.InferInput<typeof StepEditorSchema>;

export const EMPTY_STEP_EDITOR_VALUES: StepEditorDefaultValues = {
  name: "QR 05",
  title: "",
  body: "",
  media: { src: "", alt: "" },
  question: "",
  answer: "",
  placeholder: "",
  hint: "",
  revealText: "",
  revealMedia: undefined,
};

/**
 * 관리자 화면의 값 ↔ 도메인 값 변환.
 *
 * 지금은 답이 하나인 단답형만 편집한다. 유형별 편집(객관식/숫자/키워드)은
 * 티켓 13-5에서 이 자리에 들어온다.
 */
export function toAnswerSpec(answer: string): AnswerSpec {
  return { type: "SHORT_TEXT", accepted: [answer], match: "EXACT" };
}

export function toAnswerInput(spec: AnswerSpec | undefined): string {
  if (spec?.type === "SHORT_TEXT") return spec.accepted[0] ?? "";
  return "";
}

export function toMedia(src: string, alt: string): Media | undefined {
  return src ? { kind: "image", src, alt } : undefined;
}

export type StepEditorSubmit = {
  values: StepEditorFormValues;
  media?: Media;
  revealMedia?: Media;
  answerSpec: AnswerSpec;
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

export function StepEditorForm({
  submitLabel,
  defaultValues,
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  defaultValues: StepEditorDefaultValues;
  onSubmit: (payload: StepEditorSubmit) => Promise<void>;
  onCancel?: () => void;
}) {
  return (
    <SimpleForm
      schema={StepEditorSchema}
      defaultValues={defaultValues}
      onSubmit={async (values) =>
        onSubmit({
          values,
          media: toMedia(values.media.src, values.media.alt),
          revealMedia: values.revealMedia
            ? toMedia(values.revealMedia.src, values.revealMedia.alt)
            : undefined,
          answerSpec: toAnswerSpec(values.answer),
        })
      }
    >
      <Fieldset.Root>
        <Fieldset.Legend>단계</Fieldset.Legend>
        <Fieldset.Content>
          <SimpleInput name="name" label="단계 이름" placeholder="QR 02" />
          <SimpleInput name="title" label="제목" placeholder="이 QR을 찾으면 보이는 제목" />
          <SimpleInput name="body" label="본문 (선택)" />
          <SimpleImageUpload name="media" label="이미지" />
        </Fieldset.Content>
      </Fieldset.Root>

      <Fieldset.Root>
        <Fieldset.Legend>문제와 정답</Fieldset.Legend>
        <Fieldset.Content>
          <SimpleInput name="question" label="문제 (선택)" />
          <SimpleInput name="answer" label="정답" />
          <SimpleInput name="placeholder" label="입력창 안내 문구 (선택)" />
          <SimpleInput name="hint" label="힌트" />
        </Fieldset.Content>
      </Fieldset.Root>

      <Fieldset.Root>
        <Fieldset.Legend>정답 시 공개할 단서 (선택)</Fieldset.Legend>
        <Fieldset.Content>
          <SimpleInput name="revealText" label="문구" />
          <SimpleImageUpload name="revealMedia" label="이미지" />
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
