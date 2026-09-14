import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { QrCheckPanel } from "./qr-check-panel.tsx";

describe("QrCheckPanel", () => {
  it("토큰을 입력하고 확인하면 준비 완료를 보여주고 목록에 쌓인다", async () => {
    let requestedToken: string | undefined;

    await runSiheom(
      given.render(
        <QrCheckPanel
          totalCount={2}
          checkToken={async (token) => {
            requestedToken = token;
            return { kind: "READY", label: "QR 01", title: "첫 번째 문제" };
          }}
        />,
      ),
      actions.fill(query.textbox("토큰"), "QRTOKEN001"),
      actions.click(query.button("확인")),
      assertions.visible(query.status("확인 결과")),
      assertions.textContent(query.status("확인 결과"), "QR 01 · 첫 번째 문제 · 준비 완료"),
      assertions.textContent(query.status("진행 상황"), "1/2 확인됨"),
    );

    expect(requestedToken).toBe("QRTOKEN001");
  });

  it("다른 CASE의 토큰이면 경고로 보여준다", async () => {
    await runSiheom(
      given.render(
        <QrCheckPanel
          totalCount={2}
          checkToken={async () => ({ kind: "OTHER_CASE", caseNumber: 3 })}
        />,
      ),
      actions.fill(query.textbox("토큰"), "OTHERTOKEN"),
      actions.click(query.button("확인")),
      assertions.textContent(query.status("확인 결과"), "이 QR은 CASE 03의 것입니다"),
    );
  });

  it("아직 발급되지 않은 토큰이면 경고로 보여준다", async () => {
    await runSiheom(
      given.render(<QrCheckPanel totalCount={2} checkToken={async () => ({ kind: "UNKNOWN" })} />),
      actions.fill(query.textbox("토큰"), "NOPE"),
      actions.click(query.button("확인")),
      assertions.textContent(query.status("확인 결과"), "이 QR은 아직 발급되지 않았습니다"),
    );
  });

  it("같은 토큰을 두 번 확인해도 진행 상황은 한 번만 센다", async () => {
    await runSiheom(
      given.render(
        <QrCheckPanel
          totalCount={2}
          checkToken={async () => ({ kind: "READY", label: "QR 01", title: "제목" })}
        />,
      ),
      actions.fill(query.textbox("토큰"), "QRTOKEN001"),
      actions.click(query.button("확인")),
      actions.fill(query.textbox("토큰"), "QRTOKEN001"),
      actions.click(query.button("확인")),
      assertions.textContent(query.status("진행 상황"), "1/2 확인됨"),
    );
  });
});
