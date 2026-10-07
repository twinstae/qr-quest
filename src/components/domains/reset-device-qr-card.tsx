import { QrCodeDownload } from "@/components/domains/qr-code-download.tsx";
import * as Card from "@/components/ui/card.tsx";

/**
 * 기기 초기화 페이지(/reset)로 가는 QR. 참가자 휴대폰에 저장된 상태가 꼬여 같은 에러가
 * 반복될 때 이 QR을 찍게 하면 그 기기의 진행 정보가 지워진다.
 */
export function ResetDeviceQrCard() {
  return (
    <Card.Root variant="outline">
      <Card.Header pb="2">
        <Card.Title>기기 초기화 QR</Card.Title>
        <Card.Description>
          참가자 화면에서 같은 오류가 계속 나면 이 QR을 찍게 해주세요. 그 기기에 저장된 진행 정보가
          모두 지워져요. 관리자 로그인은 남아요.
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <QrCodeDownload path="/reset" label="기기 초기화 QR" />
      </Card.Footer>
    </Card.Root>
  );
}
