import { describe, expect, it } from "vitest";
import { actions, given, query, runSiheom } from "@siheom/react";

import { QrCodeDownload } from "./qr-code-download.tsx";

describe("QrCodeDownload", () => {
  it("경로를 인코딩한 QR 코드를 렌더링한다", async () => {
    await runSiheom(given.render(<QrCodeDownload path="/t/K7QPM2XR9T" label="QR 02" />));

    const svg = document.querySelector("svg");
    expect(svg?.querySelector("title")?.textContent).toBe(`${window.location.origin}/t/K7QPM2XR9T`);
  });

  it("시작 QR 경로도 그대로 인코딩한다", async () => {
    await runSiheom(given.render(<QrCodeDownload path="/s/ENTRYTOKEN" label="시작 QR" />));

    const svg = document.querySelector("svg");
    expect(svg?.querySelector("title")?.textContent).toBe(`${window.location.origin}/s/ENTRYTOKEN`);
  });

  it("복사, 다운로드 버튼을 클릭해도 오류가 발생하지 않는다", async () => {
    await runSiheom(
      given.render(<QrCodeDownload path="/t/K7QPM2XR9T" label="QR 02" />),
      actions.click(query.button("URL 복사")),
      actions.click(query.button("QR")),
    );
  });
});
