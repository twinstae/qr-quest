import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Lightbulb, RotateCcw } from "lucide-react";

import {
  isQuestionKind,
  toMedia,
  type StepEditorFormValues,
} from "@/components/domains/step-editor-form.tsx";
import { RevealPanel } from "@/components/domains/reveal-panel.tsx";
import { StepMedia } from "@/components/domains/step-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import * as Card from "@/components/ui/card.tsx";
import * as Field from "@/components/ui/field.tsx";
import { resolveCorrectMessage, type PublicAnswerSpec, type StepKind } from "@/domain/step.ts";
import { css } from "styled-system/css";
import { Flex, VStack } from "styled-system/jsx";

const sectionLabelClass = css({
  textStyle: "xs",
  fontWeight: "semibold",
  color: "fg.subtle",
  mb: "2",
});

const noteClass = css({
  textStyle: "xs",
  color: "fg.subtle",
  mt: "2",
});

/**
 * 편집 폼이 들고 있는(아직 저장하지 않은) 값 그대로 참가자 화면을 그린다.
 *
 * 값을 `getValues`가 아니라 `watch`로 읽는 이유가 곧 이 컴포넌트의 존재 이유다 — 타이핑할
 * 때마다 다시 그려야 "고친 게 어떻게 보이는지"를 저장 전에 알 수 있다. 저장된 초안을 서버에서
 * 받아 iframe으로 띄우던 예전 미리보기는 저장을 한 번 거쳐야 반영돼서, 고치고 → 저장하고 →
 * 다시 열어보는 왕복을 강요했다.
 *
 * 제출 로직·세션·정답 판정은 전혀 없다. 참가자 컴포넌트(StepCardForm)를 그대로 쓰지 않고
 * 여기서 다시 그리는 것도 같은 이유다 — 중첩 <form>이 생기고, 눌러도 아무 일이 없는 버튼이
 * "동작하는 화면"처럼 보이면 관리자가 오해한다.
 */
export function StepPreviewPanel({ kind }: { kind: StepKind }) {
  const { watch } = useFormContext<StepEditorFormValues>();
  const values = watch();
  const [replay, setReplay] = useState(0);

  const isQuestion = isQuestionKind(kind);
  const answerPreview = isQuestion ? toAnswerPreviewSpec(values) : undefined;
  const media = toMedia(values.media.src, values.media.alt, values.media.kind);
  const revealMedia = values.revealMedia
    ? toMedia(values.revealMedia.src, values.revealMedia.alt, values.revealMedia.kind)
    : undefined;
  // 참가자 화면(step-experience.tsx)과 같은 규칙 — 단서 문구가 비어 있으면 정답 메시지가
  // 그 자리를 채우고, 그것도 비어 있으면 기본 문구가 나온다.
  const revealText =
    values.revealText.trim() || resolveCorrectMessage({ correctMessage: values.correctMessage });

  return (
    <VStack alignItems="stretch" gap="6" role="region" aria-label="참가자 화면 미리보기">
      <div>
        {/* 소개/마무리 단계에는 문제가 없다 — 그때는 관리자가 아는 이름으로 적는다. */}
        <p className={sectionLabelClass}>{isQuestion ? "문제" : "참가자가 보는 화면"}</p>
        <Card.Root variant="elevated" width="full" maxWidth="sm">
          {media && <StepMedia media={media} />}
          <Card.Header>
            <Flex justify="space-between" align="baseline" gap="2">
              <Card.Title textStyle="xl">{values.title || "제목 없음"}</Card.Title>
              <span className={css({ textStyle: "xs", color: "fg.subtle", flexShrink: "0" })}>
                {values.name}
              </span>
            </Flex>
            {values.body && <Card.Description>{values.body}</Card.Description>}
            {values.hint && (
              <div className={css({ pt: "2" })}>
                <span className={css({ textStyle: "sm", color: "fg.subtle" })}>
                  <Lightbulb className={css({ boxSize: "3.5", display: "inline", mr: "1" })} />
                  힌트 보기
                </span>
                <p className={css({ textStyle: "sm", color: "fg.muted" })}>{values.hint}</p>
              </div>
            )}
          </Card.Header>
          <Card.Body>
            {values.question && (
              <p className={css({ textStyle: "md", fontWeight: "medium", mb: "3" })}>
                {values.question}
              </p>
            )}
            {answerPreview && (
              <AnswerPreview spec={answerPreview} placeholder={values.placeholder} />
            )}
          </Card.Body>
        </Card.Root>
        <p className={noteClass}>저장 전 초안이에요 — 여기서 눌러도 저장되지 않아요.</p>
      </div>

      <div>
        <p className={sectionLabelClass}>정답을 맞히면 보이는 단서</p>
        {/* key에 프리셋을 넣어 프리셋을 바꿀 때마다 연출이 다시 돌게 한다 —
            연출은 마운트 때 한 번만 재생되므로 key가 바뀌지 않으면 두 번째부터 볼 수 없다. */}
        <RevealPanel
          key={`${values.revealPreset}-${replay}`}
          preset={values.revealPreset}
          text={revealText}
          media={revealMedia}
        />
        <Flex justify="center" mt="3">
          <Button size="sm" variant="outline" onClick={() => setReplay((count) => count + 1)}>
            <RotateCcw /> 다시 보기
          </Button>
        </Flex>
      </div>
    </VStack>
  );
}

const CHOICE_IDS = ["A", "B", "C", "D"] as const;

/**
 * 참가자가 보게 될 정답 입력의 모양.
 *
 * 저장용 `toAnswerSpec`과 달리 **정답이 아직 안 채워져 있어도 그린다** — 미리보기는 저장
 * 가능 여부를 판단하는 곳이 아니라 "지금 내가 만든 게 어떻게 보이는가"를 보는 곳이다.
 * 보기를 적는 동안 미리보기가 비어 있으면 확인할 게 없다.
 */
function toAnswerPreviewSpec(values: StepEditorFormValues): PublicAnswerSpec | undefined {
  switch (values.answerType) {
    case "SINGLE_CHOICE":
    case "MULTI_CHOICE": {
      const choices = CHOICE_IDS.map((id) => ({ id, label: values[`choice${id}Label`] })).filter(
        (choice) => choice.label.trim() !== "",
      );
      return choices.length > 0 ? { type: values.answerType, choices } : undefined;
    }
    case "SHORT_TEXT":
      return { type: "SHORT_TEXT" };
    case "NUMBER":
      return { type: "NUMBER" };
    case "KEYWORDS":
      return { type: "KEYWORDS" };
  }
}

/**
 * 참가자가 보는 정답 입력 영역. 눌리지 않는다(disabled) — 미리보기라는 사실을 조작
 * 가능성으로 속이지 않으면서, 모양과 안내 문구는 참가자 화면과 같게 맞춘다.
 */
function AnswerPreview({ spec, placeholder }: { spec: PublicAnswerSpec; placeholder?: string }) {
  if (spec.type === "SINGLE_CHOICE" || spec.type === "MULTI_CHOICE") {
    return (
      <VStack alignItems="stretch" gap="2">
        {spec.choices.map((choice) => (
          <Button
            key={choice.id}
            variant="outline"
            justifyContent="flex-start"
            width="full"
            disabled
          >
            {choice.id}. {choice.label}
          </Button>
        ))}
        <Button size="lg" width="full" disabled>
          제출하기
        </Button>
      </VStack>
    );
  }

  const fallbackPlaceholder = spec.type === "KEYWORDS" ? "핵심 단어를 입력하세요" : "정답 입력";

  return (
    <VStack alignItems="stretch" gap="2">
      <Field.Root>
        <Field.Label>정답</Field.Label>
        <Input disabled placeholder={placeholder || fallbackPlaceholder} />
      </Field.Root>
      <Button size="lg" width="full" disabled>
        제출하기
      </Button>
    </VStack>
  );
}
