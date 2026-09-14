import { eq } from "drizzle-orm";

import type { Case } from "../../domain/case.ts";
import type { CaseRepo } from "../types.ts";
import type { Database } from "./client.ts";
import { cases } from "./schema.ts";

function toDomain(row: typeof cases.$inferSelect): Case {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    teaser: row.teaser,
    intro: row.intro,
    thumbnail: row.thumbnail ?? undefined,
    estimatedMinutes: row.estimatedMinutes,
    status: row.status,
    entryToken: row.entryToken,
    finalBookTitle: row.finalBookTitle ?? undefined,
    rewardNote: row.rewardNote ?? undefined,
  };
}

function toRow(input: Omit<Case, "id">): typeof cases.$inferInsert {
  return {
    number: input.number,
    title: input.title,
    teaser: input.teaser,
    intro: input.intro,
    thumbnail: input.thumbnail ?? null,
    estimatedMinutes: input.estimatedMinutes,
    status: input.status,
    entryToken: input.entryToken,
    finalBookTitle: input.finalBookTitle ?? null,
    rewardNote: input.rewardNote ?? null,
  };
}

export function createDrizzleCaseRepo(db: Database): CaseRepo {
  return {
    async create(input) {
      const [row] = await db.insert(cases).values(toRow(input)).returning();
      if (!row) throw new Error("insert did not return a row");
      return toDomain(row);
    },
    async getById(id) {
      const row = await db.query.cases.findFirst({ where: eq(cases.id, id) });
      return row ? toDomain(row) : undefined;
    },
    async getByEntryToken(token) {
      const row = await db.query.cases.findFirst({ where: eq(cases.entryToken, token) });
      return row ? toDomain(row) : undefined;
    },
    async list() {
      const rows = await db.query.cases.findMany();
      return rows.map(toDomain).sort((left, right) => left.number - right.number);
    },
    async update(id, input) {
      const [row] = await db
        .update(cases)
        .set({ ...toRow(input), updatedAt: new Date() })
        .where(eq(cases.id, id))
        .returning();
      if (!row) throw new Error("update did not return a row");
      return toDomain(row);
    },
    async delete(id) {
      await db.delete(cases).where(eq(cases.id, id));
    },
  } satisfies CaseRepo;
}

export default createDrizzleCaseRepo;
