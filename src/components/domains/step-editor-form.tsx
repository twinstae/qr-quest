import { useState } from "react";
import { useFormContext } from "react-hook-form";
import * as v from "valibot";

import { SimpleCheckbox, SimpleImageUpload, SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import * as Fieldset from "@/components/ui/fieldset.tsx";
import {
  requiresQrToken,
  type AnswerSpec,
  type Choice,
  type Media,
  type MediaKind,
  type StepKind,
} from "@/domain/step.ts";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

const ImageValueSchema = v.object({
  src: v.pipe(v.string()),
  alt: v.string(),
  kind: v.optional(v.picklist(["image", "video"])),
});

const ANSWER_TYPES = ["SINGLE_CHOICE", "MULTI_CHOICE", "SHORT_TEXT", "NUMBER", "KEYWORDS"] as const;
type AnswerType = (typeof ANSWER_TYPES)[number];

const ANSWER_TYPE_LABELS: Record<AnswerType, string> = {
  SINGLE_CHOICE: "객관식(단일 선택)",
  MULTI_CHOICE: "객관식(복수 선택)",
  SHORT_TEXT: "단답형",
  NUMBER: "숫자",
  KEYWORDS: "키워드",
};

const CHOICE_IDS = ["A", "B", "C", "D"] as const;

const StepEditorEntries = {
  name: v.pipe(v.string(), v.minLength(1, "단계 이름을 입력해주세요")),
  title: v.pipe(v.string(), v.minLength(1, "제목을 입력해주세요")),
  body: v.string(),
  media: ImageValueSchema,
  question: v.string(),
  answerType: v.picklist(ANSWER_TYPES),
  choiceALabel: v.string(),
  choiceBLabel: v.string(),
  choiceCLabel: v.string(),
  choiceDLabel: v.string(),
  correctA: v.boolean(),
  correctB: v.boolean(),
  correctC: v.boolean(),
  correctD: v.boolean(),
  // 쉼표로 여러 값을 받는다 — 단답형은 정답 여러 개(표기 차이 흡수), 키워드는 키워드 목록.
  acceptedText: v.string(),
  matchMode: v.picklist(["EXACT", "CONTAINS"]),
  numberValue: v.string(),
  tolerance: v.string(),
  keywordsText: v.string(),
  keywordMatch: v.picklist(["ALL", "ANY"]),
  placeholder: v.string(),
  hint: v.string(),
  revealText: v.string(),
  revealMedia: v.optional(ImageValueSchema),
};

const StepEditorSchema = v.object(StepEditorEntries);

export type StepEditorFormValues = v.InferOutput<typeof StepEditorSchema>;
export type StepEditorDefaultValues = v.InferInput<typeof StepEditorSchema>;

export const EMPTY_STEP_EDITOR_VALUES: StepEditorDefaultValues = {
  name: "QR 05",
  title: "",
  body: "",
  media: { src: "", alt: "" },
  question: "",
  answerType: "SHORT_TEXT",
  choiceALabel: "",
  choiceBLabel: "",
  choiceCLabel: "",
  choiceDLabel: "",
  correctA: false,
  correctB: false,
  correctC: false,
  correctD: false,
  acceptedText: "",
  matchMode: "EXACT",
  numberValue: "",
  tolerance: "",
  keywordsText: "",
  keywordMatch: "ALL",
  placeholder: "",
  hint: "",
  revealText: "",
  revealMedia: undefined,
};

/** 참가자에게 문제를 내는 단계인가. QR·마지막 단서만 문제를 갖는다. */
export function isQuestionKind(kind: StepKind): boolean {
  return requiresQrToken(kind);
}

function splitList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

/**
 * 편집기 값 → AnswerSpec. 필수 항목이 비어 있으면 undefined를 돌려주고,
 * 호출부(StepEditorForm)가 이를 "정답이 비어 있다"는 신호로 써서 저장을 막는다.
 */
export function toAnswerSpec(values: StepEditorFormValues): AnswerSpec | undefined {
  switch (values.answerType) {
    case "SINGLE_CHOICE":
    case "MULTI_CHOICE": {
      const labels: Record<(typeof CHOICE_IDS)[number], string> = {
        A: values.choiceALabel,
        B: values.choiceBLabel,
        C: values.choiceCLabel,
        D: values.choiceDLabel,
      };
      const corrects: Record<(typeof CHOICE_IDS)[number], boolean> = {
        A: values.correctA,
        B: values.correctB,
        C: values.correctC,
        D: values.correctD,
      };
      const usedIds = CHOICE_IDS.filter((id) => labels[id].trim() !== "");
      const choices: Choice[] = usedIds.map((id) => ({ id, label: labels[id] }));
      const correctChoiceIds: string[] = usedIds.filter((id) => corrects[id]);
      if (choices.length === 0 || correctChoiceIds.length === 0) return undefined;
      return { type: values.answerType, choices, correctChoiceIds };
    }
    case "SHORT_TEXT": {
      const accepted = splitList(values.acceptedText);
      if (accepted.length === 0) return undefined;
      return { type: "SHORT_TEXT", accepted, match: values.matchMode };
    }
    case "NUMBER": {
      const raw = values.numberValue.trim();
      if (raw === "") return undefined;
      const value = Number(raw);
      if (Number.isNaN(value)) return undefined;
      const toleranceRaw = values.tolerance.trim();
      const tolerance = toleranceRaw === "" ? undefined : Number(toleranceRaw);
      return { type: "NUMBER", accepted: [value], tolerance };
    }
    case "KEYWORDS": {
      const keywords = splitList(values.keywordsText);
      if (keywords.length === 0) return undefined;
      return { type: "KEYWORDS", keywords, match: values.keywordMatch };
    }
  }
}

/** AnswerSpec → 편집기 값. 기존 단계를 열었을 때 되돌리는 방향. */
export function toAnswerFormValues(
  spec: AnswerSpec | undefined,
): Pick<
  StepEditorDefaultValues,
  | "answerType"
  | "choiceALabel"
  | "choiceBLabel"
  | "choiceCLabel"
  | "choiceDLabel"
  | "correctA"
  | "correctB"
  | "correctC"
  | "correctD"
  | "acceptedText"
  | "matchMode"
  | "numberValue"
  | "tolerance"
  | "keywordsText"
  | "keywordMatch"
> {
  const empty = {
    choiceALabel: "",
    choiceBLabel: "",
    choiceCLabel: "",
    choiceDLabel: "",
    correctA: false,
    correctB: false,
    correctC: false,
    correctD: false,
    acceptedText: "",
    matchMode: "EXACT" as const,
    numberValue: "",
    tolerance: "",
    keywordsText: "",
    keywordMatch: "ALL" as const,
  };

  if (!spec) return { answerType: "SHORT_TEXT", ...empty };

  switch (spec.type) {
    case "SINGLE_CHOICE":
    case "MULTI_CHOICE": {
      const byId = Object.fromEntries(spec.choices.map((choice) => [choice.id, choice.label]));
      const correctSet = new Set(spec.correctChoiceIds);
      return {
        answerType: spec.type,
        ...empty,
        choiceALabel: byId.A ?? "",
        choiceBLabel: byId.B ?? "",
        choiceCLabel: byId.C ?? "",
        choiceDLabel: byId.D ?? "",
        correctA: correctSet.has("A"),
        correctB: correctSet.has("B"),
        correctC: correctSet.has("C"),
        correctD: correctSet.has("D"),
      };
    }
    case "SHORT_TEXT":
      return { answerType: "SHORT_TEXT", ...empty, acceptedText: spec.accepted.join(", "), matchMode: spec.match };
    case "NUMBER":
      return {
        answerType: "NUMBER",
        ...empty,
        numberValue: String(spec.accepted[0] ?? ""),
        tolerance: spec.tolerance !== undefined ? String(spec.tolerance) : "",
      };
    case "KEYWORDS":
      return {
        answerType: "KEYWORDS",
        ...empty,
        keywordsText: spec.keywords.join(", "),
        keywordMatch: spec.match,
      };
  }
}

export function toMedia(src: string, alt: string, kind: MediaKind = "image"): Media | undefined {
  return src ? { kind, src, alt } : undefined;
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

function AnswerTypeFields() {
  const { watch, setValue } = useFormContext<StepEditorFormValues>();
  const answerType = watch("answerType");

  return (
    <>
      <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
        {ANSWER_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant={answerType === type ? "solid" : "outline"}
            aria-pressed={answerType === type}
            onClick={() => setValue("answerType", type)}
          >
            {ANSWER_TYPE_LABELS[type]}
          </Button>
        ))}
      </div>

      {(answerType === "SINGLE_CHOICE" || answerType === "MULTI_CHOICE") && (
        <Fieldset.Content>
          {CHOICE_IDS.map((id) => (
            <div key={id} className={css({ display: "flex", alignItems: "flex-end", gap: "3" })}>
              <div className={css({ flex: "1" })}>
                <SimpleInput
                  name={`choice${id}Label` as const}
                  label={`보기 ${id}`}
                  placeholder={`보기 ${id} 내용`}
                />
              </div>
              <SimpleCheckbox name={`correct${id}` as const} label={`보기 ${id}를 정답으로 표시`} />
            </div>
          ))}
        </Fieldset.Content>
      )}

      {answerType === "SHORT_TEXT" && (
        <Fieldset.Content>
          <SimpleInput
            name="acceptedText"
            label="정답"
            placeholder="쉼표로 여러 개 입력할 수 있어요 (예: 사과, apple)"
          />
        </Fieldset.Content>
      )}

      {answerType === "NUMBER" && (
        <Fieldset.Content>
          <SimpleInput name="numberValue" label="정답" inputMode="decimal" />
          <SimpleInput name="tolerance" label="허용 오차 (선택)" inputMode="decimal" />
        </Fieldset.Content>
      )}

      {answerType === "KEYWORDS" && (
        <Fieldset.Content>
          <SimpleInput
            name="keywordsText"
            label="키워드"
            placeholder="쉼표로 여러 개 입력할 수 있어요"
          />
        </Fieldset.Content>
      )}
    </>
  );
}

export function StepEditorForm({
  kind,
  submitLabel,
  defaultValues,
  onSubmit,
  onCancel,
}: {
  /** 이 단계의 종류. 편집기는 종류를 바꾸지 않는다. */
  kind: StepKind;
  submitLabel: string;
  defaultValues: StepEditorDefaultValues;
  onSubmit: (payload: StepEditorSubmit) => Promise<void>;
  onCancel?: () => void;
}) {
  const isQuestion = isQuestionKind(kind);
  const [answerError, setAnswerError] = useState<string>();

  return (
    <SimpleForm<StepEditorFormValues>
      schema={StepEditorSchema}
      defaultValues={defaultValues}
      onSubmit={async (values) => {
        const answerSpec = isQuestion ? toAnswerSpec(values) : undefined;
        if (isQuestion && !answerSpec) {
          setAnswerError("정답을 입력해주세요.");
          return;
        }
        setAnswerError(undefined);

        await onSubmit({
          kind,
          values,
          media: toMedia(values.media.src, values.media.alt, values.media.kind),
          revealMedia: values.revealMedia
            ? toMedia(values.revealMedia.src, values.revealMedia.alt, values.revealMedia.kind)
            : undefined,
          answerSpec,
        });
      }}
    >
      <Fieldset.Root>
        <Fieldset.Legend>단계</Fieldset.Legend>
        <Fieldset.Content>
          <SimpleInput name="name" label="단계 이름" placeholder="QR 02" />
          <SimpleInput name="title" label="제목" placeholder="이 QR을 찾으면 보이는 제목" />
          <SimpleInput name="body" label="본문 (선택)" />
          <SimpleImageUpload name="media" label="이미지" allowVideo />
        </Fieldset.Content>
      </Fieldset.Root>

      {isQuestion && (
        <Fieldset.Root>
          <Fieldset.Legend>문제와 정답</Fieldset.Legend>
          <Fieldset.Content>
            <SimpleInput name="question" label="문제 (선택)" />
          </Fieldset.Content>
          <AnswerTypeFields />
          {answerError && (
            <p role="status" aria-label="안내" className={css({ textStyle: "sm", color: "fg.muted" })}>
              {answerError}
            </p>
          )}
          <Fieldset.Content>
            <SimpleInput name="placeholder" label="입력창 안내 문구 (선택)" />
            <SimpleInput name="hint" label="힌트" />
          </Fieldset.Content>
        </Fieldset.Root>
      )}

      <Fieldset.Root>
        <Fieldset.Legend>정답 시 공개할 단서 (선택)</Fieldset.Legend>
        <Fieldset.Content>
          <SimpleInput name="revealText" label="문구" />
          <SimpleImageUpload name="revealMedia" label="이미지" allowVideo />
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
