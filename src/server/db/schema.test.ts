import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { createTestDatabase } from "./test-helpers.ts";
import { questGroups, quests } from "./schema.ts";

describe("schema", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it("퀘스트 그룹과 그 안의 퀘스트를 저장하고 읽을 수 있다", async () => {
    const created = await createTestDatabase();
    const db = created.db;
    close = created.close;

    const [group] = await db
      .insert(questGroups)
      .values({ name: "Library Event 2026", description: "가을 도서관 행사" })
      .returning();
    expect(group).toBeDefined();
    if (!group) throw new Error("unreachable");

    const [quest] = await db
      .insert(quests)
      .values({
        groupId: group.id,
        content: "헌법논증이론의 저자는 누구일까요?",
        imageSrc: "https://example.com/cover.jpg",
        imageAlt: "헌법논증이론 표지",
        answer: "이민열, 김도균",
        alternatives: ["이한"],
        placeholder: "ㅇㅇㅇ, ㅁㅁㅁ",
        hint: "표지 안에 답이 있습니다",
      })
      .returning();
    expect(quest).toBeDefined();
    if (!quest) throw new Error("unreachable");

    const found = await db.query.quests.findFirst({
      where: eq(quests.id, quest.id),
    });

    expect(found).toMatchObject({
      groupId: group.id,
      content: "헌법논증이론의 저자는 누구일까요?",
      answer: "이민열, 김도균",
      alternatives: ["이한"],
    });
  });
});
