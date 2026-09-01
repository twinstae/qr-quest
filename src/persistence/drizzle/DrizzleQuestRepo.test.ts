import { describe, expect, it } from "vitest";

import type { Quest } from "../../domain/quest.ts";
import { createTestDatabase } from "./test-helpers.ts";
import { createDrizzleQuestGroupRepo } from "./DrizzleQuestGroupRepo.ts";
import { createDrizzleQuestRepo } from "./DrizzleQuestRepo.ts";

describe("createDrizzleQuestRepo", () => {
  it("create로 만든 퀘스트를 getById로 그대로 읽을 수 있다", async () => {
    await using db = await createTestDatabase();
    const group = await createDrizzleQuestGroupRepo(db).create({ name: "Library Event 2026" });
    const repo = createDrizzleQuestRepo(db);

    const input: Omit<Quest, "id"> = {
      groupId: group.id,
      content: "헌법논증이론의 저자는 누구일까요?",
      image: { src: "https://example.com/cover.jpg", alt: "헌법논증이론 표지" },
      answer: "이민열, 김도균",
      alternatives: ["이한"],
      placeholder: "ㅇㅇㅇ, ㅁㅁㅁ",
      hint: "표지 안에 답이 있습니다",
      reward: { text: "정답입니다!", image: undefined },
    };

    const quest = await repo.create(input);
    const found = await repo.getById(quest.id);

    expect(quest).toEqual({ ...input, id: quest.id });
    expect(found).toEqual(quest);
  });

  it("reward 이미지가 있으면 getById 결과에도 포함된다", async () => {
    await using db = await createTestDatabase();
    const group = await createDrizzleQuestGroupRepo(db).create({ name: "Library Event 2026" });
    const repo = createDrizzleQuestRepo(db);

    const quest = await repo.create({
      groupId: group.id,
      content: "content",
      image: { src: "https://example.com/cover.jpg", alt: "cover" },
      answer: "answer",
      alternatives: [],
      placeholder: "placeholder",
      hint: "hint",
      reward: {
        text: "reward text",
        image: { src: "https://example.com/reward.jpg", alt: "reward" },
      },
    });

    const found = await repo.getById(quest.id);

    expect(found?.reward.image).toEqual({
      src: "https://example.com/reward.jpg",
      alt: "reward",
    });
  });

  it("존재하지 않는 id는 undefined를 반환한다", async () => {
    await using db = await createTestDatabase();

    const repo = createDrizzleQuestRepo(db);
    const quest = await repo.getById("00000000-0000-0000-0000-000000000000");

    expect(quest).toBeUndefined();
  });
});
