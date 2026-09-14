import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { GuidanceScreen } from "./guidance-screen.tsx";

describe("GuidanceScreen", () => {
  it("안내 문구를 보여준다", async () => {
    await runSiheom(
      given.render(<GuidanceScreen text="먼저 시작 QR을 찍어주세요." />),
      assertions.visible(query.status("안내")),
      assertions.textContent(query.status("안내"), "먼저 시작 QR을 찍어주세요."),
    );
  });

  it("복귀 콜백이 없으면 돌아가기 버튼을 보여주지 않는다", async () => {
    await runSiheom(
      given.render(<GuidanceScreen text="이 사건은 지금 진행 중인 사건이 아니에요." />),
      assertions.not.visible(query.button("지금 단계로 돌아가기")),
    );
  });

  it("복귀 콜백이 있으면 버튼을 보여주고 클릭하면 호출한다", async () => {
    let returned = false;

    await runSiheom(
      given.render(
        <GuidanceScreen
          text="아직이에요. 지금은 QR 02를(을) 찾을 차례예요."
          onReturn={() => {
            returned = true;
          }}
        />,
      ),
      assertions.visible(query.button("지금 단계로 돌아가기")),
      actions.click(query.button("지금 단계로 돌아가기")),
    );

    expect(returned).toBe(true);
  });
});
