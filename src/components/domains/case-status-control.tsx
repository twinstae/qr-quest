import { useState } from "react";

import { Button } from "@/components/ui/button.tsx";
import { describeLiveViolation, type CaseStatus, type LiveViolation } from "@/domain/case.ts";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

export type UpdateStatusResult =
  | { kind: "OK"; status: CaseStatus }
  | { kind: "REJECTED"; violations: LiveViolation[] };

/**
 * LIVE로 바꾸기 전 서버 검증을 거친다(요구 30-9). 위반이 있으면 이유를 그대로 보여준다.
 * 실제 API 호출은 페이지에서 주입한다 — 이 컴포넌트는 네트워크를 모른다.
 */
export function CaseStatusControl({
  caseId,
  status,
  updateStatus,
  onChanged,
}: {
  caseId: string;
  status: CaseStatus;
  updateStatus: (caseId: string, status: "LIVE") => Promise<UpdateStatusResult>;
  onChanged: (status: CaseStatus) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [violations, setViolations] = useState<LiveViolation[]>([]);

  if (status === "LIVE") return null;

  return (
    <VStack alignItems="flex-start" gap="2">
      <Button
        size="sm"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setViolations([]);
          const result = await updateStatus(caseId, "LIVE");
          setBusy(false);
          if (result.kind === "OK") {
            onChanged(result.status);
            return;
          }
          setViolations(result.violations);
        }}
      >
        LIVE로 전환
      </Button>
      {violations.length > 0 && (
        <p role="status" aria-label="안내" className={css({ textStyle: "sm", color: "fg.muted" })}>
          {violations.map(describeLiveViolation).join(" ")}
        </p>
      )}
    </VStack>
  );
}
