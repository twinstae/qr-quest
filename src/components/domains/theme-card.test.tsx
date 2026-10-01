import { describe, expect, it, vi } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { ThemeWithUsage } from "@/application/themeService.ts";

import { ThemeCard } from "./theme-card.tsx";

const UNUSED: ThemeWithUsage = {
  id: "theme-1",
  name: "팔레스타인",
  palette: "green",
  headingFont: "noto-serif-kr",
  bodyFont: "system",
  backgroundDim: 40,
  usedBy: [],
};

const USED: ThemeWithUsage = {
  ...UNUSED,
  usedBy: [
    { id: "case-3", number: 3, title: "팔레스타인", status: "LIVE" },
    { id: "case-1", number: 1, title: "사라진 책", status: "DRAFT" },
  ],
};

const noop = async () => {};

describe("ThemeCard", () => {
  it("미리보기와 함께 몇 개의 CASE에서 쓰는지 보여준다", async () => {
    await runSiheom(
      given.render(<ThemeCard theme={USED} onSave={noop} onDelete={noop} />),
      assertions.visible(query.figure("팔레스타인 미리보기")),
      assertions.textContent(query.article("팔레스타인"), "CASE 2개에서 사용 중"),
    );
  });

  it("쓰는 CASE가 있으면 삭제 전에 어떤 CASE가 테마 없음이 되는지 경고한다", async () => {
    const onDelete = vi.fn(noop);

    await runSiheom(
      given.render(<ThemeCard theme={USED} onSave={noop} onDelete={onDelete} />),
      actions.click(query.button("팔레스타인 삭제")),
      assertions.textContent(
        query.dialog("테마 삭제"),
        "CASE 03 팔레스타인(LIVE), CASE 01 사라진 책(DRAFT)에서 쓰고 있어요. 삭제하면 이 CASE들은 테마 없이 기본 모습으로 보여요.",
      ),
      actions.click(query.button("삭제하기")),
      assertions.not.visible(query.dialog("테마 삭제")),
    );

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("쓰는 CASE가 없으면 되돌릴 수 없다는 것만 알린다", async () => {
    await runSiheom(
      given.render(<ThemeCard theme={UNUSED} onSave={noop} onDelete={noop} />),
      assertions.textContent(query.article("팔레스타인"), "사용하는 CASE 없음"),
      actions.click(query.button("팔레스타인 삭제")),
      assertions.textContent(
        query.dialog("테마 삭제"),
        '"팔레스타인" 테마를 삭제할까요? 되돌릴 수 없어요.',
      ),
    );
  });

  it("수정하면 지금 값이 채워진 폼에서 고쳐 저장한다", async () => {
    const onSave = vi.fn(noop);

    await runSiheom(
      given.render(<ThemeCard theme={UNUSED} onSave={onSave} onDelete={noop} />),
      actions.click(query.button("팔레스타인 수정")),
      assertions.value(query.textbox("테마 이름"), "팔레스타인"),
      actions.fill(query.textbox("테마 이름"), "올리브 숲"),
      actions.click(query.button("저장")),
      assertions.not.visible(query.dialog("테마 수정")),
    );

    expect(onSave).toHaveBeenCalledWith({
      name: "올리브 숲",
      palette: "green",
      headingFont: "noto-serif-kr",
      bodyFont: "system",
      backgroundDim: 40,
    });
  });
});
