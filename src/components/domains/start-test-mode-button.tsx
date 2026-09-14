import { useState } from "react";
import { FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";

/**
 * 관리자가 실제 참가자처럼 처음부터 끝까지 진행해 본다(요구 30-8).
 * 세션은 매번 새로 만들어지므로, 다시 누르면 그 자체가 초기화다.
 * 실제 API 호출은 페이지에서 주입한다 — 이 컴포넌트는 네트워크를 모른다.
 */
export function StartTestModeButton({
  caseId,
  startTestSession,
  onStarted,
}: {
  caseId: string;
  startTestSession: (caseId: string) => Promise<boolean>;
  onStarted: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        const ok = await startTestSession(caseId);
        setBusy(false);
        if (ok) onStarted();
      }}
    >
      <FlaskConical /> 테스트 모드 시작
    </Button>
  );
}
