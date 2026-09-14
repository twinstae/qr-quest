import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { CaseStatusControl } from "./case-status-control.tsx";

describe("CaseStatusControl", () => {
  it("LIVE로 전환을 누르면 상태를 바꾸도록 요청한다", async () => {
    let changedTo: string | undefined;

    await runSiheom(
      given.render(
        <CaseStatusControl
          caseId="case-1"
          status="DRAFT"
          updateStatus={async () => ({ kind: "OK", status: "LIVE" })}
          onChanged={(status) => {
            changedTo = status;
          }}
        />,
      ),
      actions.click(query.button("LIVE로 전환")),
    );

    expect(changedTo).toBe("LIVE");
  });

  it("위반이 있으면 전환을 거부하고 위반 목록을 보여준다", async () => {
    let changed = false;

    await runSiheom(
      given.render(
        <CaseStatusControl
          caseId="case-1"
          status="DRAFT"
          updateStatus={async () => ({
            kind: "REJECTED",
            violations: [
              { kind: "MISSING_ANSWER", stepId: "s1", stepName: "QR 02" },
              { kind: "MISSING_CLOSING" },
            ],
          })}
          onChanged={() => {
            changed = true;
          }}
        />,
      ),
      actions.click(query.button("LIVE로 전환")),
      assertions.visible(query.status("안내")),
      assertions.textContent(
        query.status("안내"),
        "QR 02 단계에 정답이 없어요. 사건 종결 화면이 없어요.",
      ),
    );

    expect(changed).toBe(false);
  });
});
