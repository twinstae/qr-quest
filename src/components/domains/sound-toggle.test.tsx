import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { SoundToggle } from "./sound-toggle.tsx";

describe("SoundToggle", () => {
  it("기본은 꺼짐 상태로 보이고, 누르면 켜달라고 알린다", async () => {
    let requested: boolean | undefined;

    await runSiheom(
      given.render(
        <SoundToggle
          enabled={false}
          onToggle={(next) => {
            requested = next;
          }}
        />,
      ),
      assertions.visible(query.button("효과음 켜기")),
      actions.click(query.button("효과음 켜기")),
    );

    expect(requested).toBe(true);
  });

  it("켜진 상태면 끄기 버튼으로 보인다", async () => {
    await runSiheom(
      given.render(<SoundToggle enabled onToggle={() => {}} />),
      assertions.visible(query.button("효과음 끄기")),
    );
  });
});
