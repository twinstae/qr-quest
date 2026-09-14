import { useState } from "react";

import { Button } from "@/components/ui/button.tsx";
import { describeLiveViolation, type CaseStatus, type LiveViolation } from "@/domain/case.ts";
import { getApiClient } from "@/lib/api-client";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Eden Treaty는 실패를 `{ status, value: <서버 응답 바디> }`로 감싸서 준다. */
function violationsOf(error: unknown): LiveViolation[] {
  const payload = isRecord(error) && isRecord(error.value) ? error.value : error;
  if (isRecord(payload) && Array.isArray(payload.violations)) {
    return payload.violations as LiveViolation[];
  }
  return [];
}

/** LIVE로 바꾸기 전 서버 검증을 거친다(요구 30-9). 위반이 있으면 이유를 그대로 보여준다. */
export function CaseStatusControl({
  caseId,
  status,
  onChanged,
}: {
  caseId: string;
  status: CaseStatus;
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
          const { data, error } = await getApiClient().cases({ id: caseId }).status.patch({
            status: "LIVE",
          });
          setBusy(false);
          if (data) {
            onChanged("LIVE");
            return;
          }
          setViolations(violationsOf(error));
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
