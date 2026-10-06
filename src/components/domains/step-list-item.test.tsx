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

const INTRO_STEP: StepListItemData = {
  ...STEP,
  id: "step-0",
  order: 0,
  kind: "INTRO",
  name: "사건 소개",
  qrToken: null,
  title: "사건의 시작",
  hasAnswer: false,
};

const FINAL_STEP: StepListItemData = {
  ...STEP,
  id: "step-9",
  order: 9,
  kind: "FINAL",
  name: "마지막 단서",
  qrToken: "FINALTOKEN",
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

describe("StepListItem > 삭제", () => {
  it("deleteStep을 넘기지 않으면 삭제 버튼이 없다", async () => {
    await runSiheom(given.render(withQueryClient(<StepListItem step={STEP} />)));

    expect(document.querySelector("button")?.textContent?.includes("삭제")).toBeFalsy();
  });

  it("삭제 확인하면 deleteStep을 한 번 호출한다", async () => {
    let deleteCount = 0;

    await runSiheom(
      given.render(
        withQueryClient(
          <StepListItem
            step={STEP}
            deleteStep={async () => {
              deleteCount += 1;
            }}
          />,
        ),
      ),
      actions.click(query.button("삭제")),
      assertions.visible(query.dialog("단계 삭제")),
      actions.click(query.button("삭제하기")),
    );

    expect(deleteCount).toBe(1);
  });

  it("취소하면 deleteStep을 호출하지 않는다", async () => {
    let deleteCount = 0;

    await runSiheom(
      given.render(
        withQueryClient(
          <StepListItem
            step={STEP}
            deleteStep={async () => {
              deleteCount += 1;
            }}
          />,
        ),
      ),
      actions.click(query.button("삭제")),
      actions.click(query.button("취소")),
    );

    expect(deleteCount).toBe(0);
  });
});

describe("StepListItem > QR 표시", () => {
  it("QR 토큰이 없어도 'QR 없는 단계'라고 설명하지 않는다", async () => {
    await runSiheom(given.render(withQueryClient(<StepListItem step={INTRO_STEP} />)));

    expect(document.body.textContent).not.toContain("QR 없는 단계");
    expect(document.body.textContent).not.toContain("QR 없음");
  });

  it("QR 토큰이 있으면 QR 다운로드 버튼이 보인다", async () => {
    await runSiheom(given.render(withQueryClient(<StepListItem step={STEP} />)));

    expect(document.body.textContent).toContain("URL 복사");
  });

  it("에필로그 단계면 이름 옆에 (에필로그) 라벨을 붙인다", async () => {
    await runSiheom(given.render(withQueryClient(<StepListItem step={FINAL_STEP} isEpilogue />)));

    expect(document.body.textContent).toContain("(에필로그)");
  });

  it("에필로그가 아니면 (에필로그) 라벨을 붙이지 않는다", async () => {
    await runSiheom(given.render(withQueryClient(<StepListItem step={FINAL_STEP} />)));

    expect(document.body.textContent).not.toContain("(에필로그)");
  });
});
