import { asc, eq } from "drizzle-orm";

import type { Theme } from "../../domain/theme.ts";
import type { ThemeRepo } from "../types.ts";
import type { Database } from "./client.ts";
import { themes } from "./schema.ts";

function toDomain(row: typeof themes.$inferSelect): Theme {
  return {
    id: row.id,
    name: row.name,
    palette: row.palette,
    headingFont: row.headingFont,
    bodyFont: row.bodyFont,
    background: row.background ?? undefined,
    backgroundDim: row.backgroundDim,
  };
}

function toRow(input: Omit<Theme, "id">): typeof themes.$inferInsert {
  return {
    name: input.name,
    palette: input.palette,
    headingFont: input.headingFont,
    bodyFont: input.bodyFont,
    background: input.background ?? null,
    backgroundDim: input.backgroundDim,
  };
}

export function createDrizzleThemeRepo(db: Database): ThemeRepo {
  return {
    async create(input) {
      const [row] = await db.insert(themes).values(toRow(input)).returning();
      if (!row) throw new Error("insert did not return a row");
      return toDomain(row);
    },
    async getById(id) {
      const row = await db.query.themes.findFirst({ where: eq(themes.id, id) });
      return row ? toDomain(row) : undefined;
    },
    async list() {
      const rows = await db.query.themes.findMany({ orderBy: asc(themes.createdAt) });
      return rows.map(toDomain);
    },
    async update(id, input) {
      const [row] = await db
        .update(themes)
        .set({ ...toRow(input), updatedAt: new Date() })
        .where(eq(themes.id, id))
        .returning();
      if (!row) throw new Error("update did not return a row");
      return toDomain(row);
    },
    async delete(id) {
      await db.delete(themes).where(eq(themes.id, id));
    },
  } satisfies ThemeRepo;
}

export default createDrizzleThemeRepo;
