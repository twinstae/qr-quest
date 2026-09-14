import { eq } from "drizzle-orm";

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
    async list() {
      const rows = await db.query.questGroups.findMany();
      return rows.map(toDomain);
    },
    async delete(id) {
      await db.delete(questGroups).where(eq(questGroups.id, id));
    },
  } satisfies QuestGroupRepo;
}

export default createDrizzleQuestGroupRepo;
