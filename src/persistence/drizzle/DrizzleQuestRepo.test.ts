import { describe, expect, it } from "vitest";

import { questGroupInput, questInput, TEST_QUEST } from "../../domain/fixtures.ts";
import { createTestDatabase } from "./test-helpers.ts";
import { createDrizzleQuestGroupRepo } from "./DrizzleQuestGroupRepo.ts";
import { createDrizzleQuestRepo } from "./DrizzleQuestRepo.ts";

describe("createDrizzleQuestRepo", () => {
  it("create로 만든 퀘스트를 getById로 그대로 읽을 수 있다", async () => {
    await using db = await createTestDatabase();
    const group = await createDrizzleQuestGroupRepo(db).create(questGroupInput());
    const repo = createDrizzleQuestRepo(db);

    const input = questInput({ groupId: group.id });
    const quest = await repo.create(input);
    const found = await repo.getById(quest.id);

    expect(quest).toEqual({ ...input, id: quest.id });
    expect(found).toEqual(quest);
  });

  it("reward 이미지가 있으면 getById 결과에도 포함된다", async () => {
    await using db = await createTestDatabase();
    const group = await createDrizzleQuestGroupRepo(db).create(questGroupInput());
    const repo = createDrizzleQuestRepo(db);

    const quest = await repo.create(questInput({ groupId: group.id }));
    const found = await repo.getById(quest.id);

    expect(found?.reward.image).toEqual(TEST_QUEST.reward.image);
  });

  it("존재하지 않는 id는 undefined를 반환한다", async () => {
    await using db = await createTestDatabase();

    const repo = createDrizzleQuestRepo(db);
    const quest = await repo.getById("00000000-0000-0000-0000-000000000000");

    expect(quest).toBeUndefined();
  });

  it("listByGroupId는 해당 그룹의 퀘스트만 반환한다", async () => {
    await using db = await createTestDatabase();
    const groupRepo = createDrizzleQuestGroupRepo(db);
    const repo = createDrizzleQuestRepo(db);

    const groupA = await groupRepo.create(questGroupInput({ name: "그룹 A" }));
    const groupB = await groupRepo.create(questGroupInput({ name: "그룹 B" }));

    const questA1 = await repo.create(questInput({ groupId: groupA.id, content: "A1" }));
    const questA2 = await repo.create(questInput({ groupId: groupA.id, content: "A2" }));
    await repo.create(questInput({ groupId: groupB.id, content: "B1" }));

    const questsInA = await repo.listByGroupId(groupA.id);

    expect(questsInA).toEqual(expect.arrayContaining([questA1, questA2]));
    expect(questsInA).toHaveLength(2);
  });

  it("update로 변경한 내용이 getById에도 반영된다", async () => {
    await using db = await createTestDatabase();
    const group = await createDrizzleQuestGroupRepo(db).create(questGroupInput());
    const repo = createDrizzleQuestRepo(db);

    const quest = await repo.create(questInput({ groupId: group.id }));

    const { groupId: _groupId, ...updateFields } = questInput({
      groupId: group.id,
      content: "수정된 문제",
      answer: "수정된 정답",
    });
    const updated = await repo.update(quest.id, updateFields);

    expect(updated).toEqual({ id: quest.id, groupId: group.id, ...updateFields });

    const found = await repo.getById(quest.id);
    expect(found).toEqual(updated);
  });
});
