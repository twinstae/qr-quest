import { describe, expect, it, vi } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { StepListItem, type StepListItemData } from "./step-list-item.tsx";

const STEP: StepListItemData = {
  id: "step-1",
  order: 1,
  kind: "QR",
  name: "QR 01",
  qrToken: "K7QPM2XR9T",
  published: true,
  title: "첫 번째 문제",
  hasAnswer: true,
};

describe("StepListItem > 순서 이동", () => {
  it("위로/아래로 누르면 각각 콜백을 부른다", async () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    await runSiheom(
      given.render(
        <StepListItem step={STEP} canMoveUp canMoveDown onMoveUp={onMoveUp} onMoveDown={onMoveDown} />,
      ),
      actions.click(query.button("위로 이동")),
      actions.click(query.button("아래로 이동")),
    );

    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it("맨 앞 단계는 위로 이동 버튼이 비활성화된다", async () => {
    await runSiheom(
      given.render(
        <StepListItem
          step={STEP}
          canMoveUp={false}
          canMoveDown
          onMoveUp={() => {}}
          onMoveDown={() => {}}
        />,
      ),
      assertions.disabled(query.button("위로 이동")),
    );
  });

  it("맨 뒤 단계는 아래로 이동 버튼이 비활성화된다", async () => {
    await runSiheom(
      given.render(
        <StepListItem
          step={STEP}
          canMoveUp
          canMoveDown={false}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
        />,
      ),
      assertions.disabled(query.button("아래로 이동")),
    );
  });
});
