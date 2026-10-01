import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import type { Case } from "../domain/case.ts";
import { NotExistError } from "../domain/errors.ts";
import { ANOTHER_CASE, TEST_CASE, TEST_THEME_INPUT } from "../domain/fixtures.ts";
import createFakeCaseRepo from "../persistence/FakeCaseRepo.ts";
import {
  createTheme,
  deleteTheme,
  getThemeForCase,
  listThemes,
  setCaseTheme,
  updateTheme,
} from "./themeService.ts";

function contextWith(cases: Case[] = []) {
  return createFakeContext({
    repo: { case: createFakeCaseRepo(Object.fromEntries(cases.map((item) => [item.id, item]))) },
  });
}

describe("themeService", () => {
  it("만든 테마는 목록에 보이고, 아직 쓰는 CASE가 없다", async () => {
    const ctx = contextWith();

    const created = await createTheme(ctx, TEST_THEME_INPUT);

    expect(await listThemes(ctx)).toEqual([{ ...TEST_THEME_INPUT, id: created.id, usedBy: [] }]);
  });

  it("목록은 테마를 쓰는 CASE의 번호·제목·상태를 함께 알려준다", async () => {
    const ctx = contextWith([TEST_CASE, ANOTHER_CASE]);
    const theme = await createTheme(ctx, TEST_THEME_INPUT);
    await ctx.repo.case.update(ANOTHER_CASE.id, { ...ANOTHER_CASE, themeId: theme.id });

    const [listed] = await listThemes(ctx);

    expect(listed?.usedBy).toEqual([
      { id: ANOTHER_CASE.id, number: 2, title: "다른 사건", status: "DRAFT" },
    ]);
  });

  it("테마를 고치면 같은 id로 바뀐 값이 저장된다", async () => {
    const ctx = contextWith();
    const theme = await createTheme(ctx, TEST_THEME_INPUT);

    await updateTheme(ctx, theme.id, { ...TEST_THEME_INPUT, name: "올리브 숲", palette: "olive" });

    expect((await listThemes(ctx)).map(({ name, palette }) => ({ name, palette }))).toEqual([
      { name: "올리브 숲", palette: "olive" },
    ]);
  });

  it("없는 테마를 고치면 NotExistError", async () => {
    await expect(updateTheme(contextWith(), "missing", TEST_THEME_INPUT)).rejects.toThrow(
      NotExistError,
    );
  });

  it("테마를 지우면 그 테마를 쓰던 CASE는 테마 없음이 되고, 다른 CASE는 그대로다", async () => {
    const ctx = contextWith([TEST_CASE, ANOTHER_CASE]);
    const doomed = await createTheme(ctx, TEST_THEME_INPUT);
    const kept = await createTheme(ctx, { ...TEST_THEME_INPUT, name: "남길 테마" });
    await ctx.repo.case.update(TEST_CASE.id, { ...TEST_CASE, themeId: doomed.id });
    await ctx.repo.case.update(ANOTHER_CASE.id, { ...ANOTHER_CASE, themeId: kept.id });

    await deleteTheme(ctx, doomed.id);

    expect((await listThemes(ctx)).map((theme) => theme.name)).toEqual(["남길 테마"]);
    expect((await ctx.repo.case.getById(TEST_CASE.id))?.themeId).toBeUndefined();
    expect((await ctx.repo.case.getById(ANOTHER_CASE.id))?.themeId).toBe(kept.id);
  });

  it("참가자 화면은 CASE에 걸린 테마를 받고, 없으면 null을 받는다", async () => {
    const ctx = contextWith([TEST_CASE, ANOTHER_CASE]);
    const theme = await createTheme(ctx, TEST_THEME_INPUT);
    await ctx.repo.case.update(TEST_CASE.id, { ...TEST_CASE, themeId: theme.id });

    expect(await getThemeForCase(ctx, TEST_CASE.id)).toEqual(theme);
    expect(await getThemeForCase(ctx, ANOTHER_CASE.id)).toBeNull();
    await expect(getThemeForCase(ctx, "missing")).rejects.toThrow(NotExistError);
  });

  it("CASE의 다른 내용은 건드리지 않고 테마만 걸거나 뗀다", async () => {
    const ctx = contextWith([TEST_CASE]);
    const theme = await createTheme(ctx, TEST_THEME_INPUT);

    expect(await setCaseTheme(ctx, TEST_CASE.id, theme.id)).toEqual({
      ...TEST_CASE,
      themeId: theme.id,
    });
    expect(await setCaseTheme(ctx, TEST_CASE.id, null)).toEqual(TEST_CASE);
  });

  it("없는 테마나 없는 CASE면 NotExistError", async () => {
    const ctx = contextWith([TEST_CASE]);

    await expect(setCaseTheme(ctx, TEST_CASE.id, "missing")).rejects.toThrow(NotExistError);
    await expect(setCaseTheme(ctx, "missing", null)).rejects.toThrow(NotExistError);
  });
});
