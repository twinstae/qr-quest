import { StepMedia } from "@/components/domains/step-card.tsx";
import * as Card from "@/components/ui/card.tsx";
import type { Media } from "@/domain/step.ts";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

/** FINAL 정답 직후와, 완료한 세션으로 재진입했을 때 모두 이 화면을 보여준다. */
export function CompletionScreen({
  closingTitle,
  closingBody,
  closingMedia,
  completionCode,
}: {
  closingTitle?: string;
  closingBody?: string;
  closingMedia?: Media;
  completionCode?: string;
}) {
  return (
    <VStack minHeight="screen" justify="center" p="4" gap="4">
      <Card.Root
        variant="elevated"
        colorPalette="green"
        width="full"
        maxWidth="sm"
        alignItems="center"
        textAlign="center"
      >
        {closingMedia && <StepMedia media={closingMedia} />}
        <Card.Header alignItems="center">
          <Card.Title textStyle="xl">{closingTitle ?? "사건 종결"}</Card.Title>
          {closingBody && <Card.Description>{closingBody}</Card.Description>}
        </Card.Header>
        {completionCode && (
          <Card.Body>
            <p className={css({ textStyle: "sm", color: "fg.subtle" })}>완료 인증번호</p>
            <p className={css({ textStyle: "2xl", fontWeight: "bold", letterSpacing: "wide" })}>
              {completionCode}
            </p>
            <p className={css({ textStyle: "xs", color: "fg.subtle", mt: "2" })}>
              직원에게 이 번호를 보여주세요
            </p>
          </Card.Body>
        )}
      </Card.Root>
    </VStack>
  );
}
