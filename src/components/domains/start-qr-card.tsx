import { QrCodeDownload } from "@/components/domains/qr-code-download.tsx";
import * as Card from "@/components/ui/card.tsx";

/**
 * 시작 QR은 단계가 아니라 CASE에 붙은 자산(/s/{entryToken})이다. 단계 목록은 이 QR을
 * 보여주지 않아서 "시작 QR을 어디서 만들지" 헷갈렸다 — 인쇄 시트에 있는 것과 같은 QR을
 * 목록 맨 위에서도 바로 볼 수 있게 따로 세운다.
 */
export function StartQrCard({
  entryToken,
  prologueEnabled,
}: {
  entryToken: string;
  prologueEnabled: boolean;
}) {
  return (
    <Card.Root variant="outline">
      <Card.Header pb="2">
        <Card.Title>시작 QR</Card.Title>
        <Card.Description>
          {prologueEnabled
            ? "참가자가 이 QR을 찍으면 사건이 시작돼요. 결제한 참가자에게만 나눠주세요."
            : "지금은 프로그램 QR을 쓰지 않아요. 켜면 참가자가 이 QR을 찍어서 시작해요."}
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <QrCodeDownload path={`/s/${entryToken}`} label="시작 QR" />
      </Card.Footer>
    </Card.Root>
  );
}
