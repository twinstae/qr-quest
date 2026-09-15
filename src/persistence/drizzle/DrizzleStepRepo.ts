import { eq } from "drizzle-orm";

import type { Step } from "../../domain/step.ts";
import type { StepRepo } from "../types.ts";
import type { Database } from "./client.ts";
import { steps } from "./schema.ts";

function toDomain(row: typeof steps.$inferSelect): Step {
  return {
    id: row.id,
    caseId: row.caseId,
    order: row.order,
    kind: row.kind,
    name: row.name,
    qrToken: row.qrToken ?? null,
    published: row.published,
    title: row.title,
    body: row.body,
    media: row.media ?? undefined,
    reveal: row.reveal ?? {},
    question: row.question ?? undefined,
    answerSpec: row.answerSpec ?? undefined,
    placeholder: row.placeholder ?? undefined,
    hint: row.hint ?? undefined,
    correctMessage: row.correctMessage ?? undefined,
    wrongMessage: row.wrongMessage ?? undefined,
  };
}

function toColumns(input: Omit<Step, "id" | "caseId">) {
  return {
    order: input.order,
    kind: input.kind,
    name: input.name,
    qrToken: input.qrToken ?? null,
    published: input.published,
    title: input.title,
    body: input.body,
    media: input.media ?? null,
    reveal: input.reveal,
    question: input.question ?? null,
    answerSpec: input.answerSpec ?? null,
    placeholder: input.placeholder ?? null,
    hint: input.hint ?? null,
    correctMessage: input.correctMessage ?? null,
    wrongMessage: input.wrongMessage ?? null,
  };
}

export function createDrizzleStepRepo(db: Database): StepRepo {
  return {
    async create(input) {
      const [row] = await db
        .insert(steps)
        .values({ caseId: input.caseId, ...toColumns(input) })
        .returning();
      if (!row) throw new Error("insert did not return a row");
      return toDomain(row);
    },
    async getById(id) {
      const row = await db.query.steps.findFirst({ where: eq(steps.id, id) });
      return row ? toDomain(row) : undefined;
    },
    async getByQrToken(token) {
      const row = await db.query.steps.findFirst({ where: eq(steps.qrToken, token) });
      return row ? toDomain(row) : undefined;
    },
    async listByCaseId(caseId) {
      const rows = await db.query.steps.findMany({ where: eq(steps.caseId, caseId) });
      return rows.map(toDomain).sort((left, right) => left.order - right.order);
    },
    async update(id, input) {
      const [row] = await db
        .update(steps)
        .set({ ...toColumns(input), updatedAt: new Date() })
        .where(eq(steps.id, id))
        .returning();
      if (!row) throw new Error("update did not return a row");
      return toDomain(row);
    },
    async delete(id) {
      await db.delete(steps).where(eq(steps.id, id));
    },
    async deleteByCaseId(caseId) {
      await db.delete(steps).where(eq(steps.caseId, caseId));
    },
    async nextOrder(caseId) {
      const rows = await db.query.steps.findMany({
        where: eq(steps.caseId, caseId),
        columns: { order: true },
      });
      return rows.length === 0 ? 0 : Math.max(...rows.map((row) => row.order)) + 1;
    },
  } satisfies StepRepo;
}

export default createDrizzleStepRepo;
