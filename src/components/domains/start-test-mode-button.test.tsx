import { describe, expect, it } from "vitest";
import { actions, given, query, runSiheom } from "@siheom/react";

import { StartTestModeButton } from "./start-test-mode-button.tsx";

describe("StartTestModeButton", () => {
  it("누르면 테스트 세션을 시작하고, 성공하면 알려준다", async () => {
    let requestedCaseId: string | undefined;
    let started = false;

    await runSiheom(
      given.render(
        <StartTestModeButton
          caseId="case-1"
          startTestSession={async (caseId) => {
            requestedCaseId = caseId;
            return true;
          }}
          onStarted={() => {
            started = true;
          }}
        />,
      ),
      actions.click(query.button("테스트 모드 시작")),
    );

    expect(requestedCaseId).toBe("case-1");
    expect(started).toBe(true);
  });
});
