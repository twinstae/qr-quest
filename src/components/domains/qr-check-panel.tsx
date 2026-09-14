import { useState } from "react";
import { Field } from "@ark-ui/react";

import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { formatCaseNumber } from "@/domain/case.ts";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

export type QrCheckOutcome =
  | { kind: "READY"; label: string; title: string }
  | { kind: "OTHER_CASE"; caseNumber: number }
  | { kind: "UNKNOWN" };

function describeOutcome(outcome: QrCheckOutcome): string {
  switch (outcome.kind) {
    case "READY":
      return `${outcome.label} · ${outcome.title} · 준비 완료`;
    case "OTHER_CASE":
      return `이 QR은 ${formatCaseNumber(outcome.caseNumber)}의 것입니다`;
    case "UNKNOWN":
      return "이 QR은 아직 발급되지 않았습니다";
  }
}

/**
 * 설치 점검(요구 22). 카드 하단에 인쇄된 토큰을 읽어 입력하면 즉시 판정한다 —
 * 혼동 문자를 뺀 코드 알파벳은 원래 사람이 손으로 읽고 입력하기 위한 것이다.
 * 순서와 무관하게 자유롭게 확인할 수 있고, 실제 API 호출은 페이지에서 주입한다.
 */
export function QrCheckPanel({
  totalCount,
  checkToken,
}: {
  totalCount: number;
  checkToken: (token: string) => Promise<QrCheckOutcome>;
}) {
  const [tokenInput, setTokenInput] = useState("");
  const [lastResult, setLastResult] = useState<string>();
  const [checkedTokens, setCheckedTokens] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  async function handleCheck() {
    const token = tokenInput.trim();
    if (!token) return;

    setBusy(true);
    const outcome = await checkToken(token);
    setBusy(false);

    setLastResult(describeOutcome(outcome));
    if (outcome.kind === "READY") {
      setCheckedTokens((previous) => new Set(previous).add(token));
    }
    setTokenInput("");
  }

  return (
    <VStack alignItems="stretch" gap="4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleCheck();
        }}
        className={css({ display: "flex", gap: "2", alignItems: "flex-end" })}
      >
        <Field.Root className={css({ flex: "1" })}>
          <Field.Label>토큰</Field.Label>
          <Input
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="카드 하단의 토큰을 입력하세요"
          />
        </Field.Root>
        <Button type="submit" loading={busy}>
          확인
        </Button>
      </form>

      {lastResult && (
        <p role="status" aria-label="확인 결과" className={css({ textStyle: "md", fontWeight: "medium" })}>
          {lastResult}
        </p>
      )}

      <p role="status" aria-label="진행 상황" className={css({ textStyle: "sm", color: "fg.subtle" })}>
        {checkedTokens.size}/{totalCount} 확인됨
      </p>
    </VStack>
  );
}
