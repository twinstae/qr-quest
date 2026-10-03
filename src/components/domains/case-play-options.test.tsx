import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { CasePlayOptionsPanel, type CasePlayOptions } from "./case-play-options.tsx";

describe("CasePlayOptionsPanel", () => {
  it("CASE에 저장된 진행 설정을 그대로 보여준다", async () => {
    await runSiheom(
      given.render(
        <CasePlayOptionsPanel
          options={{ freeOrder: true, prologueEnabled: false, epilogueEnabled: true }}
          onChange={async () => {}}
        />,
      ),
      assertions.checked(query.checkbox("자유 진행 (스탬프 투어)")),
      assertions.not.checked(query.checkbox("프로그램 QR로 시작")),
      assertions.checked(query.checkbox("에필로그 QR로 완주")),
    );
  });

  it("누른 항목 하나만 바꿔서 알린다", async () => {
    const patches: Partial<CasePlayOptions>[] = [];

    await runSiheom(
      given.render(
        <CasePlayOptionsPanel
          options={{ freeOrder: true, prologueEnabled: true, epilogueEnabled: true }}
          onChange={async (patch) => {
            patches.push(patch);
          }}
        />,
      ),
      actions.click(query.checkbox("에필로그 QR로 완주")),
    );

    expect(patches).toEqual([{ epilogueEnabled: false }]);
  });
});
