import { describe, expect, it, vi } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { Button } from "@/components/ui/button.tsx";
import { ConfirmDialog } from "./confirm-dialog.tsx";

function renderDialog(onConfirm: () => Promise<void> | void = () => {}) {
  return (
    <ConfirmDialog
      title="CASE 삭제"
      description="이 CASE의 단계도 함께 삭제되고 되돌릴 수 없어요."
      confirmLabel="삭제하기"
      onConfirm={onConfirm}
      trigger={<Button variant="outline">삭제</Button>}
    />
  );
}

describe("ConfirmDialog", () => {
  it("트리거를 누르기 전에는 확인 버튼이 없다", async () => {
    await runSiheom(given.render(renderDialog()));

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("트리거를 누르면 제목과 함께 확인/취소 버튼이 열린다", async () => {
    await runSiheom(
      given.render(renderDialog()),
      actions.click(query.button("삭제")),
      assertions.visible(query.dialog("CASE 삭제")),
      assertions.visible(query.button("취소")),
      assertions.visible(query.button("삭제하기")),
    );
  });

  it("취소하면 onConfirm을 호출하지 않는다", async () => {
    const onConfirm = vi.fn();

    await runSiheom(
      given.render(renderDialog(onConfirm)),
      actions.click(query.button("삭제")),
      actions.click(query.button("취소")),
    );

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("확인하면 onConfirm을 한 번 호출한다", async () => {
    const onConfirm = vi.fn(async () => {});

    await runSiheom(
      given.render(renderDialog(onConfirm)),
      actions.click(query.button("삭제")),
      actions.click(query.button("삭제하기")),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("실패하면 열어둔 채로 이유를 알리고 다시 시도할 수 있다", async () => {
    const onConfirm = vi.fn(async () => {
      throw new Error("boom");
    });

    await runSiheom(
      given.render(renderDialog(onConfirm)),
      actions.click(query.button("삭제")),
      actions.click(query.button("삭제하기")),
      assertions.visible(query.button("삭제하기")),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="alert"]')?.textContent).toBe(
      "처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
    );
  });
});
