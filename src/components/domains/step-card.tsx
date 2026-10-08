import { useState, type ReactNode } from "react";
import { ChevronDown, Eye, Lightbulb } from "lucide-react";
import * as v from "valibot";

import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import * as Card from "@/components/ui/card.tsx";
import * as Collapsible from "@/components/ui/collapsible.tsx";
import type { AnswerSubmission, Choice, Media, PublicAnswerSpec } from "@/domain/step.ts";
import { css } from "styled-system/css";
import { Flex } from "styled-system/jsx";

export type StepCardData = {
  name: string;
  title: string;
  body: string;
  media?: Media;
  question?: string;
  answerSpec?: PublicAnswerSpec;
  placeholder?: string;
  hasHint?: boolean;
  /** 관리자 테스트 세션에서만 온다 — 실제 참가자 화면에는 절대 없다. */
  debugAnswer?: string;
};

/** 이미지와 동영상을 같은 자리에서 보여준다. */
export function StepMedia({ media }: { media: Media }) {
  const className = css({ width: "full", aspectRatio: "1 / 1", objectFit: "contain" });

  if (media.kind === "video") {
    return (
      <video
        className={className}
        src={media.src}
        poster={media.src}
        playsInline
        muted
        loop
        autoPlay
      >
        <track kind="captions" />
      </video>
    );
  }

  return <img src={media.src} alt={media.alt} className={className} />;
}

/**
 * 힌트는 열 때마다 requestHint를 부른다 — 글자를 미리 받지 않고 여기서만 받아야
 * "썼는지"를 통계로 잡을 수 있다. 한 번 받으면 다시 부르지 않고 화면에 남긴다.
 */
function HintDisclosure({ requestHint }: { requestHint: () => Promise<string | undefined> }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleOpenChange(details: { open: boolean }) {
    setOpen(details.open);
    if (details.open && hint === undefined) {
      setLoading(true);
      const value = await requestHint();
      setHint(value ?? "");
      setLoading(false);
    }
  }

  return (
    <Collapsible.Root open={open} onOpenChange={handleOpenChange}>
      <Collapsible.Trigger className={css({ cursor: "pointer" })}>
        <Badge variant="outline" size="lg">
          <Lightbulb />
          {open ? "힌트 숨기기" : "힌트 보기"}
          <ChevronDown
            className={css({
              transition: "transform",
              transform: open ? "rotate(180deg)" : "rotate(0)",
            })}
          />
        </Badge>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Card.Description role="status" aria-label="힌트" pt="2" whiteSpace="pre-line">
          {loading ? "불러오는 중…" : hint}
        </Card.Description>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

/** 관리자가 테스트 모드에서 정답을 확인해볼 때만 쓴다(요구 30-8). */
function AnswerDisclosure({ answer }: { answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
      <Collapsible.Trigger className={css({ cursor: "pointer" })}>
        <Badge variant="outline" size="lg" colorPalette="orange">
          <Eye />
          {open ? "정답 숨기기" : "정답 보기"}
          <ChevronDown
            className={css({
              transition: "transform",
              transform: open ? "rotate(180deg)" : "rotate(0)",
            })}
          />
        </Badge>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Card.Description role="status" aria-label="정답" pt="2">
          {answer}
        </Card.Description>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export function ChoiceFields({
  choices,
  multiple,
  onSubmit,
  disabled = false,
}: {
  choices: Choice[];
  multiple: boolean;
  onSubmit: (submission: AnswerSubmission) => Promise<void>;
  /** 관리자 미리보기 — 모양은 같지만 누를 수 없다. */
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  // 서버가 답을 판정하는 동안 눌렸다는 걸 보여준다 — 단답형의 SubmitButton과 같은 모습.
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await onSubmit({ type: "CHOICE", choiceIds: selected });
    } finally {
      setSubmitting(false);
    }
  }

  function toggle(id: string) {
    setSelected((previous) => {
      if (!multiple) return [id];
      return previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id];
    });
  }

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
      {choices.map((choice) => (
        <Button
          key={choice.id}
          type="button"
          variant={selected.includes(choice.id) ? "solid" : "outline"}
          aria-pressed={selected.includes(choice.id)}
          justifyContent="flex-start"
          width="full"
          // 버튼 기본값(한 줄·고정 높이)이면 긴 보기가 잘린다 — 줄을 바꾸고 높이를 늘린다.
          // 관리자가 넣은 줄바꿈도 그대로 보여준다.
          whiteSpace="pre-line"
          height="auto"
          minHeight="11"
          py="2.5"
          textAlign="start"
          disabled={disabled}
          onClick={() => toggle(choice.id)}
        >
          {choice.id}. {choice.label}
        </Button>
      ))}
      <Button
        type="button"
        size="lg"
        width="full"
        disabled={disabled || selected.length === 0}
        loading={submitting}
        onClick={submit}
      >
        제출하기
      </Button>
    </div>
  );
}

/** SHORT_TEXT/NUMBER 공용 — 단답 하나를 받는다. */
export function TextAnswerField({
  placeholder,
  numeric,
  onSubmit,
}: {
  placeholder?: string;
  numeric?: boolean;
  onSubmit: (submission: AnswerSubmission) => Promise<void>;
}) {
  return (
    <SimpleForm
      schema={v.object({ answer: v.pipe(v.string(), v.minLength(1, "정답을 입력해주세요")) })}
      defaultValues={{ answer: "" }}
      onSubmit={async ({ answer }) => onSubmit({ type: "TEXT", value: answer })}
    >
      <SimpleInput
        name="answer"
        label="정답"
        placeholder={placeholder}
        inputMode={numeric ? "decimal" : undefined}
      />
      <SubmitButton size="lg" width="full">
        제출하기
      </SubmitButton>
    </SimpleForm>
  );
}

/** KEYWORDS 전용 — 단답형과 입력창은 같지만 "키워드가 들어가면 된다"는 안내를 곁들인다. */
export function KeywordAnswerField({
  placeholder,
  onSubmit,
}: {
  placeholder?: string;
  onSubmit: (submission: AnswerSubmission) => Promise<void>;
}) {
  return (
    <SimpleForm
      schema={v.object({ answer: v.pipe(v.string(), v.minLength(1, "정답을 입력해주세요")) })}
      defaultValues={{ answer: "" }}
      onSubmit={async ({ answer }) => onSubmit({ type: "TEXT", value: answer })}
    >
      <SimpleInput
        name="answer"
        label="정답"
        placeholder={placeholder ?? "핵심 단어를 입력하세요"}
      />
      <SubmitButton size="lg" width="full">
        제출하기
      </SubmitButton>
    </SimpleForm>
  );
}

function AnswerFields({
  answerSpec,
  placeholder,
  onSubmit,
}: {
  answerSpec: PublicAnswerSpec;
  placeholder?: string;
  onSubmit: (submission: AnswerSubmission) => Promise<void>;
}) {
  switch (answerSpec.type) {
    case "SINGLE_CHOICE":
    case "MULTI_CHOICE":
      return (
        <ChoiceFields
          choices={answerSpec.choices}
          multiple={answerSpec.type === "MULTI_CHOICE"}
          onSubmit={onSubmit}
        />
      );
    case "NUMBER":
      return <TextAnswerField placeholder={placeholder} numeric onSubmit={onSubmit} />;
    case "KEYWORDS":
      return <KeywordAnswerField placeholder={placeholder} onSubmit={onSubmit} />;
    case "SHORT_TEXT":
      return <TextAnswerField placeholder={placeholder} onSubmit={onSubmit} />;
  }
}

/**
 * 문제 카드의 겉모습. 참가자 화면(StepCardForm)과 관리자 미리보기가 같은 카드를 써서
 * 미리보기와 실제 화면이 어긋나지 않는다. 정답 입력은 children으로 받는다.
 */
export function StepCardView({
  step,
  onRequestHint,
  children,
}: {
  step: StepCardData;
  onRequestHint: () => Promise<string | undefined>;
  children?: ReactNode;
}) {
  return (
    <Card.Root variant="elevated" width="full" maxWidth="sm">
      {step.media && <StepMedia media={step.media} />}
      <Card.Header>
        <Flex justify="space-between" align="baseline" gap="2">
          <Card.Title textStyle="xl">{step.title}</Card.Title>
          <span className={css({ textStyle: "xs", color: "fg.subtle", flexShrink: "0" })}>
            {step.name}
          </span>
        </Flex>
        {/* 관리자가 쓴 글은 줄바꿈까지 그대로 보여준다(문제·본문이 몇 줄씩 길다). */}
        {step.body && <Card.Description whiteSpace="pre-line">{step.body}</Card.Description>}
        {step.hasHint && <HintDisclosure requestHint={onRequestHint} />}
        {step.debugAnswer && <AnswerDisclosure answer={step.debugAnswer} />}
      </Card.Header>
      <Card.Body>
        {step.question && (
          <p
            className={css({
              textStyle: "md",
              fontWeight: "medium",
              mb: "3",
              whiteSpace: "pre-line",
            })}
          >
            {step.question}
          </p>
        )}
        {children}
      </Card.Body>
    </Card.Root>
  );
}

export function StepCardForm({
  step,
  onSubmit,
  onRequestHint,
}: {
  step: StepCardData;
  onSubmit: (submission: AnswerSubmission) => Promise<void>;
  onRequestHint: () => Promise<string | undefined>;
}) {
  return (
    <StepCardView step={step} onRequestHint={onRequestHint}>
      {step.answerSpec && (
        <AnswerFields
          answerSpec={step.answerSpec}
          placeholder={step.placeholder}
          onSubmit={onSubmit}
        />
      )}
    </StepCardView>
  );
}
