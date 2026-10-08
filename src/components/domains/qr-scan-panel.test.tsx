import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { ScannedQr } from "@/domain/scannedQr.ts";
import { Scanner as FakeScanner } from "@/fakes/react-qr-scanner.fake.tsx";

import { QrScanPanel } from "./qr-scan-panel.tsx";

// 브라우저 테스트에는 카메라가 없다. 가짜 스캐너("카메라에 비친 QR" + [비추기])를 넘긴다.

describe("QrScanPanel", () => {
  it("지금 찾을 QR을 알려 주고, 앱 안 카메라로 찍으면 그 단계로 넘어간다", async () => {
    const scanned: ScannedQr[] = [];

    await runSiheom(
      given.render(
        <QrScanPanel
          scanner={FakeScanner}
          stepName="QR 02"
          onScanned={(target) => scanned.push(target)}
        />,
      ),
      assertions.visible(query.heading("다음은 QR 02 차례예요")),
      actions.click(query.button("QR 코드 찍기")),
      assertions.visible(query.region("QR 카메라")),
      actions.fill(query.textbox("카메라에 비친 QR"), "https://qr-quest-mauve.vercel.app/t/QR02"),
      actions.click(query.button("비추기")),
    );

    expect(scanned).toEqual([{ kind: "step", qrToken: "QR02" }]);
  });

  it("관리자가 적어 둔 찾기 화면 문구가 있으면 기본 안내 대신 보여준다", async () => {
    await runSiheom(
      given.render(
        <QrScanPanel
          scanner={FakeScanner}
          stepName="에필로그"
          title="마지막 에필로그 QR은 책방지기에게 받아주세요."
          guide="큐알을 이미 받으셨다면 아래 버튼을 눌러주세요"
          onScanned={() => {}}
        />,
      ),
      assertions.visible(query.heading("마지막 에필로그 QR은 책방지기에게 받아주세요.")),
      assertions.not.visible(query.heading("다음은 에필로그 차례예요")),
    );

    expect(document.body.textContent).toContain("큐알을 이미 받으셨다면 아래 버튼을 눌러주세요");
  });

  it("QR 위치 힌트가 있으면 힌트 칸에 보여준다", async () => {
    await runSiheom(
      given.render(
        <QrScanPanel
          scanner={FakeScanner}
          stepName="QR 02"
          hints={[{ stepName: "QR 02", text: "계단 옆 서가를 보세요" }]}
          onScanned={() => {}}
        />,
      ),
      assertions.visible(query.region("QR 위치 힌트")),
    );

    expect(document.querySelector('[aria-label="QR 위치 힌트"]')?.textContent).toContain(
      "계단 옆 서가를 보세요",
    );
  });

  it("QR 위치 힌트가 없으면 힌트 칸을 숨긴다", async () => {
    await runSiheom(
      given.render(<QrScanPanel scanner={FakeScanner} stepName="QR 03" onScanned={() => {}} />),
      assertions.visible(query.heading("다음은 QR 03 차례예요")),
      assertions.not.visible(query.region("QR 위치 힌트")),
    );
  });

  it("사건과 상관없는 QR이면 넘어가지 않고 다시 찾도록 안내한다", async () => {
    const scanned: ScannedQr[] = [];

    await runSiheom(
      given.render(
        <QrScanPanel
          scanner={FakeScanner}
          stepName="QR 02"
          onScanned={(target) => scanned.push(target)}
        />,
      ),
      actions.click(query.button("QR 코드 찍기")),
      actions.fill(query.textbox("카메라에 비친 QR"), "https://example.com/menu"),
      actions.click(query.button("비추기")),
      assertions.textContent(
        query.status("QR 안내"),
        "이 QR은 이번 사건의 QR이 아니에요. 사건 QR을 찾아 다시 비춰 주세요.",
      ),
      assertions.visible(query.region("QR 카메라")),
    );

    expect(scanned).toEqual([]);
  });

  it("카메라를 쓸 수 없으면 이유와 다른 방법을 알려 주고 카메라를 닫는다", async () => {
    await runSiheom(
      given.render(<QrScanPanel scanner={FakeScanner} stepName="QR 02" onScanned={() => {}} />),
      actions.click(query.button("QR 코드 찍기")),
      actions.click(query.button("카메라 권한 거부")),
      assertions.textContent(
        query.status("QR 안내"),
        "카메라 권한이 꺼져 있어요. 주소창의 자물쇠 버튼에서 카메라를 허용하거나, 휴대폰 기본 카메라 앱으로 QR을 찍어도 돼요.",
      ),
      assertions.not.visible(query.region("QR 카메라")),
      assertions.visible(query.button("QR 코드 찍기")),
    );
  });
});
