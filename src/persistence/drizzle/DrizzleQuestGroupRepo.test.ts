import { describe, expect, it } from "vitest";

import { createTestDatabase } from "./test-helpers.ts";
import { createDrizzleQuestGroupRepo } from "./DrizzleQuestGroupRepo.ts";

describe("createDrizzleQuestGroupRepo", () => {
  it("이름과 설명으로 그룹을 생성한다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleQuestGroupRepo(db);

    const group = await repo.create({ name: "Library Event 2026", description: "가을 행사" });

    expect(group).toEqual({
      id: group.id,
      name: "Library Event 2026",
      description: "가을 행사",
    });
  });

  it("설명 없이 그룹을 생성할 수 있다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleQuestGroupRepo(db);

    const group = await repo.create({ name: "Library Event 2026" });

    expect(group.description).toBeUndefined();
  });

  it("생성한 그룹들을 list로 모두 읽을 수 있다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleQuestGroupRepo(db);

    const a = await repo.create({ name: "Library Event 2026" });
    const b = await repo.create({ name: "Bookstore Event 2026" });

    const groups = await repo.list();

    expect(groups).toContainEqual(a);
    expect(groups).toContainEqual(b);
    expect(groups).toHaveLength(2);
  });
});
