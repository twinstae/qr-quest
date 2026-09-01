import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import * as v from "valibot";

import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import * as Card from "@/components/ui/card.tsx";
import * as Collapsible from "@/components/ui/collapsible.tsx";
import { css } from "styled-system/css";

export type Quest = {
  image?: {
    src: string;
    alt: string;
  };
  content: string;
  placeholder: string;
  hint: string;
};

export function QuestCardForm({
  quest,
  onSubmit,
}: {
  quest: Quest;
  onSubmit: (result: { answer: string }) => Promise<void>;
}) {
  const [hintOpen, setHintOpen] = useState(false);

  return (
    <Card.Root variant="elevated" width="full" maxWidth="sm">
      {quest.image && (
        <img
          src={quest.image.src}
          alt={quest.image.alt}
          className={css({ width: "full", aspectRatio: "16 / 10", objectFit: "cover" })}
        />
      )}
      <Card.Header>
        <Card.Title textStyle="xl">{quest.content}</Card.Title>
        <Collapsible.Root open={hintOpen} onOpenChange={(d) => setHintOpen(d.open)}>
          <Collapsible.Trigger className={css({ cursor: "pointer" })}>
            <Badge variant="outline" size="lg">
              <Lightbulb />
              {hintOpen ? "힌트 숨기기" : "힌트 보기"}
              <ChevronDown
                className={css({
                  transition: "transform",
                  transform: hintOpen ? "rotate(180deg)" : "rotate(0)",
                })}
              />
            </Badge>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Card.Description pt="2">{quest.hint}</Card.Description>
          </Collapsible.Content>
        </Collapsible.Root>
      </Card.Header>
      <Card.Body>
        <SimpleForm
          schema={v.object({
            answer: v.pipe(v.string(), v.minLength(1, "정답을 입력해주세요")),
          })}
          defaultValues={{
            answer: "",
          }}
          onSubmit={onSubmit}
        >
          <SimpleInput name="answer" label="정답" placeholder={quest.placeholder} />

          <Button type="submit" size="lg" width="full">
            제출하기
          </Button>
        </SimpleForm>
      </Card.Body>
    </Card.Root>
  );
}
