import { RefreshCw } from "lucide-react";

import { ConfirmDialog } from "@/components/domains/confirm-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";

/**
 * 토큰을 재발급하면 기존 인쇄물이 즉시 무효가 된다(요구 22) — 실행 전에 반드시
 * 경고를 보여준다. 실제 API 호출은 페이지에서 주입한다.
 */
export function ReissueTokenButton({
  label = "QR 재발급",
  reissue,
  onReissued,
}: {
  label?: string;
  reissue: () => Promise<string>;
  onReissued: (newToken: string) => void;
}) {
  return (
    <ConfirmDialog
      title="QR 토큰 재발급"
      description="기존에 인쇄한 QR은 이 순간부터 무효가 돼요. 재발급 후에는 새 시트를 다시 인쇄해서 교체해야 해요."
      confirmLabel="재발급하기"
      trigger={
        <Button variant="outline" size="sm">
          <RefreshCw /> {label}
        </Button>
      }
      onConfirm={async () => {
        const token = await reissue();
        onReissued(token);
      }}
    />
  );
}
