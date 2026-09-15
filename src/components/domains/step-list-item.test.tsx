import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { StepListItem, type StepListItemData } from "./step-list-item.tsx";

function withQueryClient(children: ReactNode) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

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
    let movedUp = 0;
    let movedDown = 0;

    await runSiheom(
      given.render(
        withQueryClient(
          <StepListItem
            step={STEP}
            canMoveUp
            canMoveDown
            onMoveUp={() => {
              movedUp += 1;
            }}
            onMoveDown={() => {
              movedDown += 1;
            }}
          />,
        ),
      ),
      actions.click(query.button("위로 이동")),
      actions.click(query.button("아래로 이동")),
    );

    expect(movedUp).toBe(1);
    expect(movedDown).toBe(1);
  });

  it("맨 앞 단계는 위로 이동 버튼이 비활성화된다", async () => {
    await runSiheom(
      given.render(
        withQueryClient(
          <StepListItem
            step={STEP}
            canMoveUp={false}
            canMoveDown
            onMoveUp={() => {}}
            onMoveDown={() => {}}
          />,
        ),
      ),
      assertions.disabled(query.button("위로 이동")),
    );
  });

  it("맨 뒤 단계는 아래로 이동 버튼이 비활성화된다", async () => {
    await runSiheom(
      given.render(
        withQueryClient(
          <StepListItem
            step={STEP}
            canMoveUp
            canMoveDown={false}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
          />,
        ),
      ),
      assertions.disabled(query.button("아래로 이동")),
    );
  });
});
