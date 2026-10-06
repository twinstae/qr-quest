import { describe, expect, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { StartQrCard } from "./start-qr-card.tsx";

describe("StartQrCard", () => {
  it("시작 QR(/s/{entryToken})을 인코딩한 QR 코드를 보여준다", async () => {
    await runSiheom(given.render(<StartQrCard entryToken="GT6NTFM3T8" prologueEnabled />));

    const svg = document.querySelector("svg");
    expect(svg?.querySelector("title")?.textContent).toBe(`${window.location.origin}/s/GT6NTFM3T8`);
  });

  it("시작 QR이라는 제목과 다운로드·복사 버튼을 보여준다", async () => {
    await runSiheom(
      given.render(<StartQrCard entryToken="GT6NTFM3T8" prologueEnabled />),
      assertions.visible(query.heading("시작 QR")),
      assertions.visible(query.button("URL 복사")),
      assertions.visible(query.button("QR")),
    );
  });

  it("프로그램 QR이 켜져 있으면 결제한 참가자에게만 나눠주라고 안내한다", async () => {
    await runSiheom(given.render(<StartQrCard entryToken="GT6NTFM3T8" prologueEnabled />));

    expect(document.body.textContent).toContain("결제한 참가자에게만");
  });

  it("프로그램 QR이 꺼져 있으면 결제 안내를 하지 않는다", async () => {
    await runSiheom(given.render(<StartQrCard entryToken="GT6NTFM3T8" prologueEnabled={false} />));

    expect(document.body.textContent).not.toContain("결제한 참가자에게만");
  });
});
