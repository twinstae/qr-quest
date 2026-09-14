import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import * as v from "valibot";

import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
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
  hint?: string;
};

/** 이미지와 동영상을 같은 자리에서 보여준다. */
export function StepMedia({ media }: { media: Media }) {
  const className = css({ width: "full", aspectRatio: "16 / 10", objectFit: "cover" });

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

function HintDisclosure({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
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
        <Card.Description pt="2">{hint}</Card.Description>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function ChoiceAnswerForm({
  choices,
  multiple,
  onSubmit,
}: {
  choices: Choice[];
  multiple: boolean;
  onSubmit: (submission: AnswerSubmission) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);

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
          onClick={() => toggle(choice.id)}
        >
          {choice.id}. {choice.label}
        </Button>
      ))}
      <Button
        type="button"
        size="lg"
        width="full"
        disabled={selected.length === 0}
        onClick={() => onSubmit({ type: "CHOICE", choiceIds: selected })}
      >
        제출하기
      </Button>
    </div>
  );
}

export function StepCardForm({
  step,
  onSubmit,
}: {
  step: StepCardData;
  onSubmit: (submission: AnswerSubmission) => Promise<void>;
}) {
  const answerSpec = step.answerSpec;

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
        {step.body && <Card.Description>{step.body}</Card.Description>}
        {step.hint && <HintDisclosure hint={step.hint} />}
      </Card.Header>
      <Card.Body>
        {step.question && (
          <p className={css({ textStyle: "md", fontWeight: "medium", mb: "3" })}>{step.question}</p>
        )}

        {answerSpec?.type === "SINGLE_CHOICE" || answerSpec?.type === "MULTI_CHOICE" ? (
          <ChoiceAnswerForm
            choices={answerSpec.choices}
            multiple={answerSpec.type === "MULTI_CHOICE"}
            onSubmit={onSubmit}
          />
        ) : (
          <SimpleForm
            schema={v.object({
              answer: v.pipe(v.string(), v.minLength(1, "정답을 입력해주세요")),
            })}
            defaultValues={{ answer: "" }}
            onSubmit={async ({ answer }) => onSubmit({ type: "TEXT", value: answer })}
          >
            <SimpleInput name="answer" label="정답" placeholder={step.placeholder} />
            <Button type="submit" size="lg" width="full">
              제출하기
            </Button>
          </SimpleForm>
        )}
      </Card.Body>
    </Card.Root>
  );
}
