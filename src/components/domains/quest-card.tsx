import * as v from "valibot";

import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import * as Card from "@/components/ui/card.tsx";
import * as Collapsible from "@/components/ui/collapsible.tsx";

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
  return (
    <Card.Root>
      {quest.image && <img src={quest.image.src} alt={quest.image.alt} />}
      <Card.Header>
        <Card.Title>{quest.content}</Card.Title>
        <Card.Description>
          <Collapsible.Root>
            <Collapsible.Trigger>
              <Badge>힌트 보기</Badge>
            </Collapsible.Trigger>
            <Collapsible.Content>{quest.hint}</Collapsible.Content>
          </Collapsible.Root>
        </Card.Description>
      </Card.Header>
      <Card.Body>
        <SimpleForm
          schema={v.object({
            answer: v.pipe(v.string(), v.minLength(1, "정답을 입력해주세요")),
          })}
          defaultValues={{
            __brand: "ValidData",
            answer: "",
          }}
          onSubmit={onSubmit}
        >
          <SimpleInput name="answer" label="정답" placeholder={quest.placeholder} />

          <Button type="submit" color="primary" className="mt-2">
            제출하기
          </Button>
        </SimpleForm>
      </Card.Body>
    </Card.Root>
  );
}
