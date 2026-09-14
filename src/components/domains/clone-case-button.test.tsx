import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { CloneCaseButton } from "./clone-case-button.tsx";

describe("CloneCaseButton", () => {
  it("누르면 복제를 요청하고, 성공하면 새 CASE를 알려준다", async () => {
    let requestedCaseId: string | undefined;
    let clonedCaseId: string | undefined;

    await runSiheom(
      given.render(
        <CloneCaseButton
          caseId="case-1"
          cloneCase={async (caseId) => {
            requestedCaseId = caseId;
            return { id: "case-2" };
          }}
          onCloned={(id) => {
            clonedCaseId = id;
          }}
        />,
      ),
      actions.click(query.button("복제")),
    );

    expect(requestedCaseId).toBe("case-1");
    expect(clonedCaseId).toBe("case-2");
  });

  it("실패하면 이유를 알리고 다시 시도할 수 있다", async () => {
    await runSiheom(
      given.render(
        <CloneCaseButton caseId="case-1" cloneCase={async () => undefined} onCloned={() => {}} />,
      ),
      actions.click(query.button("복제")),
      assertions.visible(query.status("안내")),
      assertions.visible(query.button("복제")),
    );
  });
});
