import { useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { css } from "styled-system/css";
import { Flex } from "styled-system/jsx";

type Busy = "STEP_BACK" | "RESET_COMPLETION" | null;

/**
 * 테스트 모드 진행 중 "이전 단계로", "완료 상태 초기화"를 쓴다(요구 30-8 후반).
 * 처음부터 다시 걷지 않고 같은 테스트 세션을 그대로 되돌린다는 점이
 * "테스트 모드 시작"(새 세션)과 다르다. 실제 API 호출은 페이지에서 주입한다.
 */
export function TestSessionActions({
  caseId,
  stepBack,
  resetCompletion,
}: {
  caseId: string;
  stepBack: (caseId: string) => Promise<boolean>;
  resetCompletion: (caseId: string) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<string>();

  const NO_SESSION_MESSAGE = "진행 중인 테스트 세션이 없어요.";

  return (
    <Flex direction="column" gap="2" alignItems="flex-start">
      <Flex gap="2">
        <Button
          variant="outline"
          size="sm"
          loading={busy === "STEP_BACK"}
          onClick={async () => {
            setBusy("STEP_BACK");
            const ok = await stepBack(caseId);
            setBusy(null);
            setMessage(ok ? "이전 단계로 되돌렸어요." : NO_SESSION_MESSAGE);
          }}
        >
          <Undo2 /> 이전 단계로
        </Button>
        <Button
          variant="outline"
          size="sm"
          loading={busy === "RESET_COMPLETION"}
          onClick={async () => {
            setBusy("RESET_COMPLETION");
            const ok = await resetCompletion(caseId);
            setBusy(null);
            setMessage(ok ? "완료 상태를 초기화했어요." : NO_SESSION_MESSAGE);
          }}
        >
          <RotateCcw /> 완료 상태 초기화
        </Button>
      </Flex>
      {message && (
        <p role="status" aria-label="안내" className={css({ textStyle: "sm", color: "fg.muted" })}>
          {message}
        </p>
      )}
    </Flex>
  );
}
