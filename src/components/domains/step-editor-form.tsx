import { useFormContext } from "react-hook-form";
import * as v from "valibot";

import { SimpleImageUpload, SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import * as Fieldset from "@/components/ui/fieldset.tsx";
import { requiresQrToken, type AnswerSpec, type Media, type StepKind } from "@/domain/step.ts";
import { styled } from "styled-system/jsx";

const ImageValueSchema = v.object({
  src: v.pipe(v.string()),
  alt: v.string(),
});

const StepEditorEntries = {
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
};

const StepEditorSchema = v.object(StepEditorEntries);

// 소개·종결 단계는 참가자에게 문제를 내지 않으므로 정답을 요구하지 않는다.
// (그 단계에서 정답을 요구하면 관리자가 저장을 위해 없는 답을 지어내야 한다.)
const StepEditorSchemaWithoutAnswer = v.object({ ...StepEditorEntries, answer: v.string() });

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

/** 참가자에게 문제를 내는 단계인가. QR·마지막 단서만 문제를 갖는다. */
export function isQuestionKind(kind: StepKind): boolean {
  return requiresQrToken(kind);
}

function stepEditorSchema(kind: StepKind) {
  return isQuestionKind(kind) ? StepEditorSchema : StepEditorSchemaWithoutAnswer;
}

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
  kind: StepKind;
  values: StepEditorFormValues;
  media?: Media;
  revealMedia?: Media;
  answerSpec?: AnswerSpec;
};

/**
 * 편집기가 만든 값을 서버 요청 바디로 바꾼다.
 *
 * 단계 종류는 편집기가 만들어내지 않고 **원래 값을 그대로 되돌려 보낸다** —
 * 소개 단계를 열어 제목만 고쳤는데 종류가 QR로 바뀌면 참가자 화면의 순서가 어긋난다.
 */
export function toStepRequestBody(payload: StepEditorSubmit) {
  const { kind, values } = payload;
  const isQuestion = isQuestionKind(kind);

  return {
    name: values.name,
    kind,
    title: values.title,
    body: values.body,
    media: payload.media,
    reveal: {
      text: values.revealText || undefined,
      media: payload.revealMedia,
    },
    question: isQuestion ? values.question || undefined : undefined,
    answerSpec: payload.answerSpec,
    placeholder: isQuestion ? values.placeholder || undefined : undefined,
    hint: isQuestion ? values.hint || undefined : undefined,
  };
}

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
  kind,
  submitLabel,
  defaultValues,
  onSubmit,
  onCancel,
}: {
  /** 이 단계의 종류. 편집기는 종류를 바꾸지 않는다 — 13에서 선택 UI가 붙는다. */
  kind: StepKind;
  submitLabel: string;
  defaultValues: StepEditorDefaultValues;
  onSubmit: (payload: StepEditorSubmit) => Promise<void>;
  onCancel?: () => void;
}) {
  const isQuestion = isQuestionKind(kind);

  return (
    <SimpleForm<StepEditorFormValues>
      schema={stepEditorSchema(kind)}
      defaultValues={defaultValues}
      onSubmit={async (values) =>
        onSubmit({
          kind,
          values,
          media: toMedia(values.media.src, values.media.alt),
          revealMedia: values.revealMedia
            ? toMedia(values.revealMedia.src, values.revealMedia.alt)
            : undefined,
          answerSpec: isQuestion ? toAnswerSpec(values.answer) : undefined,
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

      {isQuestion && (
        <Fieldset.Root>
          <Fieldset.Legend>문제와 정답</Fieldset.Legend>
          <Fieldset.Content>
            <SimpleInput name="question" label="문제 (선택)" />
            <SimpleInput name="answer" label="정답" />
            <SimpleInput name="placeholder" label="입력창 안내 문구 (선택)" />
            <SimpleInput name="hint" label="힌트" />
          </Fieldset.Content>
        </Fieldset.Root>
      )}

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
