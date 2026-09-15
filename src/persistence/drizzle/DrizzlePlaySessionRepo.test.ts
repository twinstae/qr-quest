import { describe, expect, it } from "vitest";

import { caseInput, stepInput } from "../../domain/fixtures.ts";
import { createDrizzleCaseRepo } from "./DrizzleCaseRepo.ts";
import {
  createDrizzlePlaySessionRepo,
  createDrizzleStepAttemptRepo,
} from "./DrizzlePlaySessionRepo.ts";
import { createDrizzleStepRepo } from "./DrizzleStepRepo.ts";
import { createTestDatabase } from "./test-helpers.ts";

/** CASE와 STEP이 있어야 세션을 만들 수 있다(외래 키). */
async function seedCaseWithStep(db: Awaited<ReturnType<typeof createTestDatabase>>) {
  const caseRepo = createDrizzleCaseRepo(db);
  const stepRepo = createDrizzleStepRepo(db);
  const caseItem = await caseRepo.create(caseInput({ entryToken: "ENTRY-LOOKUP" }));
  const step = await stepRepo.create(
    stepInput({ caseId: caseItem.id, order: 1, qrToken: "QRTOKEN001" }),
  );
  return { caseId: caseItem.id, stepId: step.id };
}

describe("createDrizzlePlaySessionRepo", () => {
  it("완주 인증번호로 세션을 찾는다", async () => {
    await using db = await createTestDatabase();
    const { caseId } = await seedCaseWithStep(db);
    const repo = createDrizzlePlaySessionRepo(db);

    const created = await repo.create({
      caseId,
      token: "token-1",
      status: "COMPLETED",
      currentStepOrder: 2,
      startedAt: "2026-09-15T06:00:00.000Z",
      lastSeenAt: "2026-09-15T06:20:00.000Z",
      completedAt: "2026-09-15T06:20:00.000Z",
      completionCode: "79-1-K7QP",
      isTest: false,
    });

    expect(await repo.getByCompletionCode("79-1-K7QP")).toEqual(created);
    expect(await repo.getByCompletionCode("79-1-ZZZZ")).toBeUndefined();
  });

  it("리딤 시각을 기록하고, 기간 이후에 건넨 수만 센다", async () => {
    await using db = await createTestDatabase();
    const { caseId } = await seedCaseWithStep(db);
    const repo = createDrizzlePlaySessionRepo(db);

    const base = {
      caseId,
      status: "COMPLETED" as const,
      currentStepOrder: 2,
      startedAt: "2026-09-15T06:00:00.000Z",
      lastSeenAt: "2026-09-15T06:20:00.000Z",
      completedAt: "2026-09-15T06:20:00.000Z",
      isTest: false,
    };
    const today = await repo.create({ ...base, token: "token-today", completionCode: "79-1-AAAA" });
    await repo.create({
      ...base,
      token: "token-yesterday",
      completionCode: "79-1-BBBB",
      completedAt: "2026-09-13T06:20:00.000Z",
      redeemedAt: "2026-09-13T07:00:00.000Z",
    });
    await repo.update(today.id, { redeemedAt: "2026-09-15T07:00:00.000Z" });

    expect(await repo.countRedeemedSince("2026-09-14T15:00:00.000Z")).toBe(1);
    expect(await repo.countRedeemedSince("2026-09-13T00:00:00.000Z")).toBe(2);
    expect((await repo.getById(today.id))?.redeemedAt).toBe("2026-09-15T07:00:00.000Z");
  });

  it("완료 코드는 없는 세션은 undefined다", async () => {
    await using db = await createTestDatabase();
    const { caseId } = await seedCaseWithStep(db);
    const repo = createDrizzlePlaySessionRepo(db);

    await repo.create({
      caseId,
      token: "token-2",
      status: "IN_PROGRESS",
      currentStepOrder: 1,
      startedAt: "2026-09-15T06:00:00.000Z",
      lastSeenAt: "2026-09-15T06:00:00.000Z",
      isTest: false,
    });

    expect(await repo.getByCompletionCode("79-1-K7QP")).toBeUndefined();
  });
});

describe("createDrizzleStepAttemptRepo", () => {
  it("여러 세션의 시도를 한 번에 읽고, 빈 목록이면 조회하지 않는다", async () => {
    await using db = await createTestDatabase();
    const { caseId, stepId } = await seedCaseWithStep(db);
    const sessionRepo = createDrizzlePlaySessionRepo(db);
    const attemptRepo = createDrizzleStepAttemptRepo(db);

    const first = await sessionRepo.create({
      caseId,
      token: "token-a",
      status: "IN_PROGRESS",
      currentStepOrder: 1,
      startedAt: "2026-09-15T06:00:00.000Z",
      lastSeenAt: "2026-09-15T06:00:00.000Z",
      isTest: false,
    });
    const second = await sessionRepo.create({
      caseId,
      token: "token-b",
      status: "IN_PROGRESS",
      currentStepOrder: 1,
      startedAt: "2026-09-15T06:00:00.000Z",
      lastSeenAt: "2026-09-15T06:00:00.000Z",
      isTest: false,
    });

    await attemptRepo.create({
      sessionId: first.id,
      stepId,
      submitted: "오답",
      correct: false,
      usedHint: true,
      createdAt: "2026-09-15T06:01:00.000Z",
    });
    await attemptRepo.create({
      sessionId: second.id,
      stepId,
      submitted: "정답",
      correct: true,
      usedHint: false,
      createdAt: "2026-09-15T06:02:00.000Z",
    });

    expect(await attemptRepo.listBySessionIds([])).toEqual([]);

    const found = await attemptRepo.listBySessionIds([first.id]);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ sessionId: first.id, correct: false, usedHint: true });
  });
});
