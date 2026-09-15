import { and, count, eq, gte, inArray, isNotNull } from "drizzle-orm";

import type { PlaySession, StepAttempt } from "../../domain/playSession.ts";
import type { PlaySessionRepo, StepAttemptRepo } from "../types.ts";
import type { Database } from "./client.ts";
import { playSessions, stepAttempts } from "./schema.ts";

function toDomain(row: typeof playSessions.$inferSelect): PlaySession {
  return {
    id: row.id,
    caseId: row.caseId,
    token: row.token,
    status: row.status,
    currentStepOrder: row.currentStepOrder,
    startedAt: row.startedAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    completionCode: row.completionCode ?? undefined,
    redeemedAt: row.redeemedAt?.toISOString(),
    isTest: row.isTest,
  };
}

function toColumns(input: Partial<Omit<PlaySession, "id" | "caseId" | "token">>) {
  return {
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.currentStepOrder !== undefined ? { currentStepOrder: input.currentStepOrder } : {}),
    ...(input.lastSeenAt !== undefined ? { lastSeenAt: new Date(input.lastSeenAt) } : {}),
    ...(input.completedAt !== undefined ? { completedAt: new Date(input.completedAt) } : {}),
    ...(input.completionCode !== undefined ? { completionCode: input.completionCode } : {}),
    ...(input.redeemedAt !== undefined ? { redeemedAt: new Date(input.redeemedAt) } : {}),
    ...(input.isTest !== undefined ? { isTest: input.isTest } : {}),
  };
}

export function createDrizzlePlaySessionRepo(db: Database): PlaySessionRepo {
  return {
    async create(input) {
      const [row] = await db
        .insert(playSessions)
        .values({
          caseId: input.caseId,
          token: input.token,
          status: input.status,
          currentStepOrder: input.currentStepOrder,
          startedAt: new Date(input.startedAt),
          lastSeenAt: new Date(input.lastSeenAt),
          completedAt: input.completedAt ? new Date(input.completedAt) : null,
          completionCode: input.completionCode ?? null,
          redeemedAt: input.redeemedAt ? new Date(input.redeemedAt) : null,
          isTest: input.isTest,
        })
        .returning();
      if (!row) throw new Error("insert did not return a row");
      return toDomain(row);
    },
    async getById(id) {
      const row = await db.query.playSessions.findFirst({ where: eq(playSessions.id, id) });
      return row ? toDomain(row) : undefined;
    },
    async getByToken(token) {
      const row = await db.query.playSessions.findFirst({ where: eq(playSessions.token, token) });
      return row ? toDomain(row) : undefined;
    },
    async update(id, input) {
      const [row] = await db
        .update(playSessions)
        .set(toColumns(input))
        .where(eq(playSessions.id, id))
        .returning();
      if (!row) throw new Error("update did not return a row");
      return toDomain(row);
    },
    async listByCaseId(caseId) {
      const rows = await db.query.playSessions.findMany({ where: eq(playSessions.caseId, caseId) });
      return rows.map(toDomain);
    },
    async getByCompletionCode(code) {
      const row = await db.query.playSessions.findFirst({
        where: eq(playSessions.completionCode, code),
      });
      return row ? toDomain(row) : undefined;
    },
    async countRedeemedSince(since) {
      const [row] = await db
        .select({ total: count() })
        .from(playSessions)
        .where(gte(playSessions.redeemedAt, new Date(since)));
      return row?.total ?? 0;
    },
    async countStartedSince(since) {
      const [row] = await db
        .select({ total: count() })
        .from(playSessions)
        .where(and(eq(playSessions.isTest, false), gte(playSessions.startedAt, new Date(since))));
      return row?.total ?? 0;
    },
    async countCompletedSince(since) {
      const [row] = await db
        .select({ total: count() })
        .from(playSessions)
        .where(
          and(
            eq(playSessions.isTest, false),
            isNotNull(playSessions.completedAt),
            gte(playSessions.completedAt, new Date(since)),
          ),
        );
      return row?.total ?? 0;
    },
  } satisfies PlaySessionRepo;
}

function attemptToDomain(row: typeof stepAttempts.$inferSelect): StepAttempt {
  return {
    id: row.id,
    sessionId: row.sessionId,
    stepId: row.stepId,
    submitted: row.submitted,
    correct: row.correct,
    usedHint: row.usedHint,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createDrizzleStepAttemptRepo(db: Database): StepAttemptRepo {
  return {
    async create(input) {
      const [row] = await db
        .insert(stepAttempts)
        .values({
          sessionId: input.sessionId,
          stepId: input.stepId,
          submitted: input.submitted,
          correct: input.correct,
          usedHint: input.usedHint,
          createdAt: new Date(input.createdAt),
        })
        .returning();
      if (!row) throw new Error("insert did not return a row");
      return attemptToDomain(row);
    },
    async listBySessionId(sessionId) {
      const rows = await db.query.stepAttempts.findMany({
        where: eq(stepAttempts.sessionId, sessionId),
      });
      return rows.map(attemptToDomain);
    },
    async listBySessionIds(sessionIds) {
      // 빈 배열을 inArray에 넘기면 SQL이 성립하지 않는다 — 호출부마다 따지지 않게 여기서 막는다.
      if (sessionIds.length === 0) return [];
      const rows = await db.query.stepAttempts.findMany({
        where: inArray(stepAttempts.sessionId, sessionIds),
      });
      return rows.map(attemptToDomain);
    },
  } satisfies StepAttemptRepo;
}

export default createDrizzlePlaySessionRepo;
