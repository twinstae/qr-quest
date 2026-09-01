import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { TEST_QUEST, TEST_QUEST_GROUP } from "../../domain/fixtures.ts";
import { createTestDatabase } from "./test-helpers.ts";
import { questGroups, quests } from "./schema.ts";

describe("schema", () => {
  it("퀘스트 그룹과 그 안의 퀘스트를 저장하고 읽을 수 있다", async () => {
    await using db = await createTestDatabase();

    const [group] = await db
      .insert(questGroups)
      .values({ name: TEST_QUEST_GROUP.name, description: TEST_QUEST_GROUP.description })
      .returning();
    expect(group).toBeDefined();
    if (!group) throw new Error("unreachable");

    const [quest] = await db
      .insert(quests)
      .values({
        groupId: group.id,
        content: TEST_QUEST.content,
        imageSrc: TEST_QUEST.image.src,
        imageAlt: TEST_QUEST.image.alt,
        answer: TEST_QUEST.answer,
        alternatives: TEST_QUEST.alternatives,
        placeholder: TEST_QUEST.placeholder,
        hint: TEST_QUEST.hint,
      })
      .returning();
    expect(quest).toBeDefined();
    if (!quest) throw new Error("unreachable");

    const found = await db.query.quests.findFirst({
      where: eq(quests.id, quest.id),
    });

    expect(found).toMatchObject({
      groupId: group.id,
      content: TEST_QUEST.content,
      answer: TEST_QUEST.answer,
      alternatives: TEST_QUEST.alternatives,
    });
  });
});
