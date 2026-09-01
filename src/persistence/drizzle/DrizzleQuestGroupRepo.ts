import type { QuestGroup } from "../../domain/questGroup.ts";
import type { QuestGroupRepo } from "../types.ts";
import type { Database } from "./client.ts";
import { questGroups } from "./schema.ts";

function toDomain(row: typeof questGroups.$inferSelect): QuestGroup {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
  };
}

export function createDrizzleQuestGroupRepo(db: Database): QuestGroupRepo {
  return {
    async create(input) {
      const [row] = await db
        .insert(questGroups)
        .values({ name: input.name, description: input.description ?? null })
        .returning();
      if (!row) throw new Error("insert did not return a row");
      return toDomain(row);
    },
  } satisfies QuestGroupRepo;
}

export default createDrizzleQuestGroupRepo;
