import { eq } from "drizzle-orm";

import type { Quest } from "../../domain/quest.ts";
import type { QuestRepo } from "../types.ts";
import type { Database } from "./client.ts";
import { quests } from "./schema.ts";

function toDomain(row: typeof quests.$inferSelect): Quest {
  return {
    id: row.id,
    groupId: row.groupId,
    content: row.content,
    image: { src: row.imageSrc, alt: row.imageAlt },
    answer: row.answer,
    alternatives: row.alternatives,
    placeholder: row.placeholder,
    hint: row.hint,
    reward: {
      text: row.rewardText ?? undefined,
      image:
        row.rewardImageSrc != null
          ? { src: row.rewardImageSrc, alt: row.rewardImageAlt ?? "" }
          : undefined,
    },
  };
}

function toRow(input: Omit<Quest, "id">): typeof quests.$inferInsert {
  return {
    groupId: input.groupId,
    content: input.content,
    imageSrc: input.image.src,
    imageAlt: input.image.alt,
    answer: input.answer,
    alternatives: input.alternatives,
    placeholder: input.placeholder,
    hint: input.hint,
    rewardText: input.reward.text ?? null,
    rewardImageSrc: input.reward.image?.src ?? null,
    rewardImageAlt: input.reward.image?.alt ?? null,
  };
}

export function createDrizzleQuestRepo(db: Database): QuestRepo {
  return {
    async getById(id) {
      const row = await db.query.quests.findFirst({ where: eq(quests.id, id) });
      return row ? toDomain(row) : undefined;
    },
    async create(input) {
      const [row] = await db.insert(quests).values(toRow(input)).returning();
      if (!row) throw new Error("insert did not return a row");
      return toDomain(row);
    },
    async listByGroupId(groupId) {
      const rows = await db.query.quests.findMany({ where: eq(quests.groupId, groupId) });
      return rows.map(toDomain);
    },
  } satisfies QuestRepo;
}

export default createDrizzleQuestRepo;
