import { createFileRoute, notFound } from "@tanstack/react-router";

import { StepMedia } from "@/components/domains/step-card.tsx";
import * as Card from "@/components/ui/card.tsx";
import { getApiClient } from "@/lib/api-client";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/preview/$stepId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const client = getApiClient();
    const { data: step } = await client.steps({ id: params.stepId }).preview.get();
    if (!step) throw notFound();
    return { step };
  },
});

/**
 * 저장하지 않은 초안을 그대로 보여주는 읽기 전용 화면 — 실제 제출·정답 판정은 하지 않는다.
 * 참가자 화면(step-card.tsx)과 같은 내용을 보여주되, 이 화면은 미리보기 전용이라
 * 별도의 단순한 카드로 렌더한다(제출 로직·세션이 전혀 없으므로 재사용하지 않는다).
 */
function RouteComponent() {
  const { step } = Route.useLoaderData();
  const answerSpec = step.answerSpec;

  return (
    <VStack minHeight="screen" justify="center" p="4">
      <Card.Root variant="elevated" width="full" maxWidth="sm">
        {step.media && <StepMedia media={step.media} />}
        <Card.Header>
          <Card.Title textStyle="xl">{step.title}</Card.Title>
          {step.body && <Card.Description>{step.body}</Card.Description>}
          {step.hint && (
            <p className={css({ textStyle: "sm", color: "fg.subtle" })}>힌트: {step.hint}</p>
          )}
        </Card.Header>
        <Card.Body>
          {step.question && (
            <p className={css({ textStyle: "md", fontWeight: "medium", mb: "3" })}>
              {step.question}
            </p>
          )}
          {(answerSpec?.type === "SINGLE_CHOICE" || answerSpec?.type === "MULTI_CHOICE") && (
            <VStack alignItems="stretch" gap="2">
              {answerSpec.choices.map((choice) => (
                <div
                  key={choice.id}
                  className={css({
                    borderWidth: "1px",
                    borderColor: "border",
                    borderRadius: "md",
                    px: "3",
                    py: "2",
                  })}
                >
                  {choice.id}. {choice.label}
                </div>
              ))}
            </VStack>
          )}
          {answerSpec &&
            answerSpec.type !== "SINGLE_CHOICE" &&
            answerSpec.type !== "MULTI_CHOICE" && (
              <div
                className={css({
                  borderWidth: "1px",
                  borderColor: "border",
                  borderRadius: "md",
                  px: "3",
                  py: "2",
                  color: "fg.subtle",
                })}
              >
                {step.placeholder || "정답 입력"}
              </div>
            )}
        </Card.Body>
      </Card.Root>
      <p className={css({ textStyle: "xs", color: "fg.subtle" })}>
        미리보기 화면이에요 — 여기서 제출한 값은 저장되지 않아요.
      </p>
    </VStack>
  );
}
