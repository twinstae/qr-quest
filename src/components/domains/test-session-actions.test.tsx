import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { TestSessionActions } from "./test-session-actions.tsx";

describe("TestSessionActions", () => {
  it("이전 단계로를 누르면 stepBack을 부르고 결과를 안내한다", async () => {
    let calledWith: string | undefined;

    await runSiheom(
      given.render(
        <TestSessionActions
          caseId="case-1"
          stepBack={async (caseId) => {
            calledWith = caseId;
            return true;
          }}
          resetCompletion={async () => true}
        />,
      ),
      actions.click(query.button("이전 단계로")),
      assertions.visible(query.status("안내")),
      assertions.textContent(query.status("안내"), "이전 단계로 되돌렸어요."),
    );

    expect(calledWith).toBe("case-1");
  });

  it("진행 중인 테스트 세션이 없으면 그렇게 안내한다", async () => {
    await runSiheom(
      given.render(
        <TestSessionActions caseId="case-1" stepBack={async () => false} resetCompletion={async () => true} />,
      ),
      actions.click(query.button("이전 단계로")),
      assertions.textContent(query.status("안내"), "진행 중인 테스트 세션이 없어요."),
    );
  });

  it("완료 상태 초기화를 누르면 resetCompletion을 부르고 결과를 안내한다", async () => {
    let calledWith: string | undefined;

    await runSiheom(
      given.render(
        <TestSessionActions
          caseId="case-2"
          stepBack={async () => true}
          resetCompletion={async (caseId) => {
            calledWith = caseId;
            return true;
          }}
        />,
      ),
      actions.click(query.button("완료 상태 초기화")),
      assertions.textContent(query.status("안내"), "완료 상태를 초기화했어요."),
    );

    expect(calledWith).toBe("case-2");
  });
});
