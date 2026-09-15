import { StepMedia } from "@/components/domains/step-card.tsx";
import * as Card from "@/components/ui/card.tsx";
import type { Media } from "@/domain/step.ts";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

/**
 * FINAL 정답 직후와, 완료한 세션으로 재진입했을 때 모두 이 화면을 보여준다.
 *
 * 이 화면의 유일한 목적은 **직원이 1초에 인증번호를 읽는 것**이다(요구 14).
 * 그래서 인증번호가 화면에서 가장 큰 글자이고, 나머지 정보는 그 아래 작게 둔다.
 */
export function CompletionScreen({
  closingTitle,
  closingBody,
  closingMedia,
  completionCode,
  elapsedMinutes,
  hintCount,
}: {
  closingTitle?: string;
  closingBody?: string;
  closingMedia?: Media;
  completionCode?: string;
  elapsedMinutes?: number;
  hintCount?: number;
}) {
  // 한 덩어리 문자열로 만든다 — 화면에서 한 줄로 읽히고, 검증도 한 텍스트로 끝난다.
  const progressText = [
    elapsedMinutes === undefined ? undefined : `약 ${elapsedMinutes}분`,
    hintCount === undefined ? undefined : `힌트 ${hintCount}번`,
  ]
    .filter((part) => part !== undefined)
    .join(" · ");

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
          <Card.Body width="full">
            <p className={css({ textStyle: "sm", color: "fg.subtle" })}>완료 인증번호</p>
            <p
              role="status"
              aria-label="인증번호"
              className={css({
                textStyle: "5xl",
                fontWeight: "bold",
                letterSpacing: "wide",
                color: "green.11",
                my: "2",
              })}
            >
              {completionCode}
            </p>
            {progressText && (
              <p className={css({ textStyle: "sm", color: "fg.muted", mb: "2" })}>{progressText}</p>
            )}
            <p className={css({ textStyle: "xs", color: "fg.subtle" })}>
              직원에게 이 번호를 보여주세요
            </p>
          </Card.Body>
        )}
      </Card.Root>
    </VStack>
  );
}
