import { describe, expect, it } from "vitest";
import { actions, given, query, runSiheom } from "@siheom/react";

import { QuestQrCodeDownload } from "./quest-qr-code.tsx";

describe("QuestQrCodeDownload", () => {
  it("Quest 링크를 인코딩한 QR 코드를 렌더링한다", async () => {
    await runSiheom(given.render(<QuestQrCodeDownload questId="quest-123" />));

    const svg = document.querySelector("svg");
    expect(svg?.querySelector("title")?.textContent).toBe(
      `${window.location.origin}/quest/quest-123`,
    );
  });

  it("SVG/PNG 다운로드 버튼을 클릭해도 오류가 발생하지 않는다", async () => {
    await runSiheom(
      given.render(<QuestQrCodeDownload questId="quest-123" />),
      actions.click(query.button("SVG")),
      actions.click(query.button("PNG")),
    );
  });
});
