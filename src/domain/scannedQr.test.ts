import { describe, expect, it } from "vitest";

import { parseScannedQr } from "./scannedQr.ts";

describe("parseScannedQr", () => {
  it("단계 QR이면 그 단계 토큰을 돌려준다 (인쇄된 도메인이 달라도 경로로 판단한다)", () => {
    expect(parseScannedQr("https://qr-quest-mauve.vercel.app/t/ZHVXYVCHVR")).toEqual({
      kind: "step",
      qrToken: "ZHVXYVCHVR",
    });
    expect(parseScannedQr("http://localhost:3000/t/ABC123?utm=1")).toEqual({
      kind: "step",
      qrToken: "ABC123",
    });
  });

  it("시작 QR이면 시작 토큰을 돌려준다", () => {
    expect(parseScannedQr("https://qr-quest-mauve.vercel.app/s/GT6NTFM3T8")).toEqual({
      kind: "start",
      entryToken: "GT6NTFM3T8",
    });
  });

  it("이 앱의 QR이 아니면 알 수 없음으로 본다", () => {
    expect(parseScannedQr("https://example.com/menu")).toEqual({ kind: "unknown" });
    expect(parseScannedQr("WIFI:S:museum;T:WPA;P:secret;;")).toEqual({ kind: "unknown" });
    expect(parseScannedQr("https://example.com/t/")).toEqual({ kind: "unknown" });
  });
});
