export type ScannedQr =
  | { kind: "step"; qrToken: string }
  | { kind: "start"; entryToken: string }
  | { kind: "unknown" };

/**
 * 앱 안 카메라로 찍은 QR을 해석한다. 도메인이 아니라 경로(/t/…, /s/…)로 판단한다 —
 * 인쇄된 QR의 도메인과 지금 연 도메인(미리보기 배포 등)이 달라도 같은 사건이다.
 * 찍힌 주소로 이동하지 않고 토큰만 꺼내 쓰므로 다른 사이트로 새지 않는다.
 */
export function parseScannedQr(raw: string): ScannedQr {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { kind: "unknown" };
  }

  const [section, token, ...rest] = url.pathname.split("/").filter(Boolean);
  if (!token || rest.length > 0) return { kind: "unknown" };
  if (section === "t") return { kind: "step", qrToken: token };
  if (section === "s") return { kind: "start", entryToken: token };
  return { kind: "unknown" };
}
