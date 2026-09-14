import { useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { getApiClient } from "@/lib/api-client";
import { css } from "styled-system/css";

/**
 * CASE를 통째로 복제한다(요구 30). 개발자 개입 없이 새 CASE를 시작할 수 있는
 * 가장 빠른 길이라, 실패해도 같은 자리에서 바로 다시 누를 수 있게 한다.
 */
export function CloneCaseButton({
  caseId,
  onCloned,
}: {
  caseId: string;
  onCloned: (clonedCaseId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          const { data } = await getApiClient().cases({ id: caseId }).clone.post();
          setBusy(false);
          if (!data) {
            setFailed(true);
            return;
          }
          onCloned(data.id);
        }}
      >
        <Copy /> 복제
      </Button>
      {failed && (
        <p role="status" aria-label="안내" className={css({ textStyle: "sm", color: "fg.muted" })}>
          복제하지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}
    </>
  );
}
