import { describe, expect, it } from "vitest";

import { caseInput, TEST_THEME_INPUT } from "../../domain/fixtures.ts";
import { createDrizzleCaseRepo } from "./DrizzleCaseRepo.ts";
import { createDrizzleThemeRepo } from "./DrizzleThemeRepo.ts";
import { createTestDatabase } from "./test-helpers.ts";

describe("createDrizzleThemeRepo", () => {
  it("만든 테마를 그대로 읽고, 고치고, 지울 수 있다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleThemeRepo(db);

    const created = await repo.create(TEST_THEME_INPUT);
    expect(await repo.getById(created.id)).toEqual({ ...TEST_THEME_INPUT, id: created.id });

    const { background: _removed, ...withoutBackground } = TEST_THEME_INPUT;
    const updated = await repo.update(created.id, { ...withoutBackground, palette: "olive" });
    expect(updated).toEqual({ ...withoutBackground, palette: "olive", id: created.id });
    expect(await repo.list()).toEqual([updated]);

    await repo.delete(created.id);
    expect(await repo.list()).toEqual([]);
  });

  it("CASE가 쓰던 테마를 지워도 CASE는 남고 테마만 빠진다", async () => {
    await using db = await createTestDatabase();
    const themes = createDrizzleThemeRepo(db);
    const cases = createDrizzleCaseRepo(db);
    const theme = await themes.create(TEST_THEME_INPUT);
    const created = await cases.create(caseInput({ themeId: theme.id }));
    expect((await cases.getById(created.id))?.themeId).toBe(theme.id);

    await themes.delete(theme.id);

    expect(await cases.getById(created.id)).toEqual({ ...created, themeId: undefined });
  });
});
