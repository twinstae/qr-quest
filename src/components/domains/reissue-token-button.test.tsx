import { describe, expect, it } from "vitest";
import { actions, given, query, runSiheom } from "@siheom/react";

import { ReissueTokenButton } from "./reissue-token-button.tsx";

describe("ReissueTokenButton", () => {
  it("경고를 확인해야 재발급이 실행되고, 새 토큰을 알려준다", async () => {
    let requested = false;
    let reissuedTo: string | undefined;

    await runSiheom(
      given.render(
        <ReissueTokenButton
          reissue={async () => {
            requested = true;
            return "NEWTOKEN";
          }}
          onReissued={(token) => {
            reissuedTo = token;
          }}
        />,
      ),
      actions.click(query.button("QR 재발급")),
      actions.click(query.button("재발급하기")),
    );

    expect(requested).toBe(true);
    expect(reissuedTo).toBe("NEWTOKEN");
  });

  it("취소하면 재발급하지 않는다", async () => {
    let requested = false;

    await runSiheom(
      given.render(
        <ReissueTokenButton
          reissue={async () => {
            requested = true;
            return "NEWTOKEN";
          }}
          onReissued={() => {}}
        />,
      ),
      actions.click(query.button("QR 재발급")),
      actions.click(query.button("취소")),
    );

    expect(requested).toBe(false);
  });
});
