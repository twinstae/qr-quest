// 브라우저 테스트·Storybook에는 카메라가 없다. @yudiel/react-qr-scanner 대신 alias로 연결된다.
// "카메라에 비친 QR"에 내용을 적고 [비추기]를 누르면 인식된 것처럼 onScan을 부른다.
import { useState } from "react";
import type { IDetectedBarcode, IScannerError } from "@yudiel/react-qr-scanner";

export function Scanner({
  onScan,
  onError,
}: {
  onScan: (codes: IDetectedBarcode[]) => void;
  onError?: (error: IScannerError) => void;
}) {
  const [raw, setRaw] = useState("");

  return (
    <div>
      <label>
        카메라에 비친 QR
        <input value={raw} onChange={(event) => setRaw(event.target.value)} />
      </label>
      <button
        type="button"
        onClick={() =>
          onScan([
            {
              rawValue: raw,
              format: "qr_code",
              boundingBox: { x: 0, y: 0, width: 0, height: 0 },
              cornerPoints: [],
            },
          ])
        }
      >
        비추기
      </button>
      <button
        type="button"
        onClick={() =>
          onError?.({ kind: "permission-denied", message: "Permission denied", cause: null })
        }
      >
        카메라 권한 거부
      </button>
    </div>
  );
}
