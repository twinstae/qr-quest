import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { caseInput, stepInput, TEST_STEP } from "../../domain/fixtures.ts";
import { cases, playSessions, stepAttempts, steps } from "./schema.ts";
import { createTestDatabase } from "./test-helpers.ts";

describe("schema", () => {
  it("CASE와 그 안의 단계를 저장하고 읽을 수 있다", async () => {
    await using db = await createTestDatabase();

    const [created] = await db.insert(cases).values(caseInput()).returning();
    expect(created).toBeDefined();
    if (!created) throw new Error("unreachable");

    const [step] = await db
      .insert(steps)
      .values({
        caseId: created.id,
        order: TEST_STEP.order,
        kind: TEST_STEP.kind,
        name: TEST_STEP.name,
        qrToken: TEST_STEP.qrToken,
        published: TEST_STEP.published,
        title: TEST_STEP.title,
        body: TEST_STEP.body,
        media: TEST_STEP.media,
        reveal: TEST_STEP.reveal,
        question: TEST_STEP.question,
        answerSpec: TEST_STEP.answerSpec,
        placeholder: TEST_STEP.placeholder,
        hint: TEST_STEP.hint,
      })
      .returning();
    expect(step).toBeDefined();
    if (!step) throw new Error("unreachable");

    const found = await db.query.steps.findFirst({ where: eq(steps.id, step.id) });

    expect(found).toMatchObject({
      caseId: created.id,
      order: TEST_STEP.order,
      name: TEST_STEP.name,
      // reference 단계에는 caseId가 없다 — 저장할 때 채워 넣은 값을 그대로 쓴다
      title: TEST_STEP.title,
      answerSpec: TEST_STEP.answerSpec,
      reveal: TEST_STEP.reveal,
    });
  });

  it("정답을 저장하지 않은 단계도 만들 수 있다 (소개·종결 단계)", async () => {
    await using db = await createTestDatabase();

    const [created] = await db.insert(cases).values(caseInput()).returning();
    if (!created) throw new Error("unreachable");

    const [step] = await db
      .insert(steps)
      .values({
        caseId: created.id,
        order: 0,
        kind: "INTRO",
        name: "사건 소개",
        qrToken: null,
        title: "사건 소개",
        body: "",
        reveal: {},
      })
      .returning();
    if (!step) throw new Error("unreachable");

    expect(step).toMatchObject({ qrToken: null, answerSpec: null, published: true });
  });

  it("참가 세션과 제출 기록을 저장할 수 있다", async () => {
    await using db = await createTestDatabase();

    const [created] = await db.insert(cases).values(caseInput()).returning();
    if (!created) throw new Error("unreachable");

    const [step] = await db
      .insert(steps)
      .values({ ...stepInput({ caseId: created.id }) })
      .returning();
    if (!step) throw new Error("unreachable");

    const [session] = await db
      .insert(playSessions)
      .values({ caseId: created.id, token: "SESSION-TOKEN" })
      .returning();
    if (!session) throw new Error("unreachable");

    const [attempt] = await db
      .insert(stepAttempts)
      .values({
        sessionId: session.id,
        stepId: step.id,
        submitted: "엉뚱한 답",
        correct: false,
        usedHint: true,
      })
      .returning();
    if (!attempt) throw new Error("unreachable");

    expect(session).toMatchObject({
      status: "IN_PROGRESS",
      currentStepOrder: 0,
      isTest: false,
      completedAt: null,
      completionCode: null,
    });
    expect(attempt).toMatchObject({ usedHint: true, correct: false });
  });

  it("같은 CASE 안에서 단계 순서는 겹칠 수 없다", async () => {
    await using db = await createTestDatabase();

    const [created] = await db.insert(cases).values(caseInput()).returning();
    if (!created) throw new Error("unreachable");

    const base = {
      caseId: created.id,
      order: 0,
      kind: "QR" as const,
      title: "문제",
      body: "",
      reveal: {},
    };
    await db.insert(steps).values({ ...base, name: "QR 01", qrToken: "TOKEN-A" });

    await expect(
      db.insert(steps).values({ ...base, name: "QR 02", qrToken: "TOKEN-B" }),
    ).rejects.toThrow();
  });

  it("CASE를 지우면 단계와 참가 기록이 함께 사라진다", async () => {
    await using db = await createTestDatabase();

    const [created] = await db.insert(cases).values(caseInput()).returning();
    if (!created) throw new Error("unreachable");
    const [step] = await db
      .insert(steps)
      .values({ ...stepInput({ caseId: created.id }) })
      .returning();
    if (!step) throw new Error("unreachable");
    const [session] = await db
      .insert(playSessions)
      .values({ caseId: created.id, token: "SESSION-TOKEN" })
      .returning();
    if (!session) throw new Error("unreachable");
    await db.insert(stepAttempts).values({
      sessionId: session.id,
      stepId: step.id,
      submitted: "답",
      correct: false,
    });

    await db.delete(cases).where(eq(cases.id, created.id));

    expect(await db.query.steps.findMany()).toEqual([]);
    expect(await db.query.playSessions.findMany()).toEqual([]);
    expect(await db.query.stepAttempts.findMany()).toEqual([]);
  });
});
