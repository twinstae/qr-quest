import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { ResetDeviceScreen } from "./reset-device-screen.tsx";

describe("ResetDeviceScreen", () => {
  it("화면에 들어오면 바로 지우고, 다 지웠다고 알린다", async () => {
    let calls = 0;

    await runSiheom(
      given.render(
        <ResetDeviceScreen
          reset={async () => {
            calls += 1;
          }}
        />,
      ),
      assertions.visible(query.heading("기기에 저장된 정보를 지웠어요")),
    );

    expect(calls).toBeGreaterThan(0);
    expect(document.body.textContent).toContain("관리자 로그인은 그대로");
  });

  it("지우다 실패하면 알리고, 다시 시도할 수 있다", async () => {
    let attempt = 0;

    await runSiheom(
      given.render(
        <ResetDeviceScreen
          reset={async () => {
            attempt += 1;
            if (attempt === 1) throw new Error("network");
          }}
        />,
      ),
      assertions.visible(query.heading("지우지 못했어요")),
      actions.click(query.button("다시 시도")),
      assertions.visible(query.heading("기기에 저장된 정보를 지웠어요")),
    );
  });
});
