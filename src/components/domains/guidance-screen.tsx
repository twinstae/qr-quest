import { Button } from "@/components/ui/button.tsx";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

export function GuidanceScreen({
  text,
  returnLabel = "지금 단계로 돌아가기",
  onReturn,
}: {
  text: string;
  returnLabel?: string;
  onReturn?: () => void;
}) {
  return (
    <VStack minHeight="screen" justify="center" p="4" gap="4" textAlign="center">
      <p role="status" aria-label="안내" className={css({ textStyle: "lg" })}>
        {text}
      </p>
      {onReturn && (
        <Button variant="outline" onClick={onReturn}>
          {returnLabel}
        </Button>
      )}
    </VStack>
  );
}
