import { describe, expect, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { ResetDeviceQrCard } from "./reset-device-qr-card.tsx";

describe("ResetDeviceQrCard", () => {
  it("기기 초기화 페이지(/reset)를 담은 QR과 복사·다운로드 버튼을 보여준다", async () => {
    await runSiheom(
      given.render(<ResetDeviceQrCard />),
      assertions.visible(query.heading("기기 초기화 QR")),
      assertions.visible(query.button("URL 복사")),
      assertions.visible(query.button("QR")),
    );

    const svg = document.querySelector("svg title");
    expect(svg?.textContent).toBe(`${window.location.origin}/reset`);
  });
});
