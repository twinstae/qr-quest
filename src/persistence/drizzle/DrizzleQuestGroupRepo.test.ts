import { describe, expect, it } from "vitest";

import { ANOTHER_QUEST_GROUP, questGroupInput, TEST_QUEST_GROUP } from "../../domain/fixtures.ts";
import { createTestDatabase } from "./test-helpers.ts";
import { createDrizzleQuestGroupRepo } from "./DrizzleQuestGroupRepo.ts";

describe("createDrizzleQuestGroupRepo", () => {
  it("이름과 설명으로 그룹을 생성한다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleQuestGroupRepo(db);

    const group = await repo.create(questGroupInput());

    expect(group).toEqual({ id: group.id, ...questGroupInput() });
  });

  it("설명 없이 그룹을 생성할 수 있다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleQuestGroupRepo(db);

    const group = await repo.create(questGroupInput({ description: undefined }));

    expect(group.description).toBeUndefined();
  });

  it("생성한 그룹들을 list로 모두 읽을 수 있다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleQuestGroupRepo(db);

    const a = await repo.create(questGroupInput({ name: TEST_QUEST_GROUP.name }));
    const b = await repo.create(questGroupInput({ name: ANOTHER_QUEST_GROUP.name }));

    const groups = await repo.list();

    expect(groups).toContainEqual(a);
    expect(groups).toContainEqual(b);
    expect(groups).toHaveLength(2);
  });
});
