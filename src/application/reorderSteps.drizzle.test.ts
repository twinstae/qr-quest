import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { caseInput, stepInput } from "../domain/fixtures.ts";
import { createDrizzleCaseRepo } from "../persistence/drizzle/DrizzleCaseRepo.ts";
import { createDrizzleStepRepo } from "../persistence/drizzle/DrizzleStepRepo.ts";
import { createTestDatabase } from "../persistence/drizzle/test-helpers.ts";
import { reorderSteps } from "./caseEditorService.ts";

// 가짜 저장소는 (case_id, order) 유일 인덱스를 흉내 내지 않는다 — 실제 DB로 확인한다.
describe("reorderSteps (실제 DB)", () => {
  it("이웃한 두 단계의 순서를 맞바꿀 수 있다", async () => {
    await using db = await createTestDatabase();
    const ctx = createFakeContext({
      repo: { case: createDrizzleCaseRepo(db), step: createDrizzleStepRepo(db) },
    });
    const created = await ctx.repo.case.create(caseInput());
    const first = await ctx.repo.step.create(
      stepInput({ caseId: created.id, order: 0, name: "첫째", qrToken: "QR-A" }),
    );
    const second = await ctx.repo.step.create(
      stepInput({ caseId: created.id, order: 1, name: "둘째", qrToken: "QR-B" }),
    );

    await reorderSteps(ctx, created.id, [second.id, first.id]);

    const steps = await ctx.repo.step.listByCaseId(created.id);
    expect(steps.map(({ name, order }) => ({ name, order }))).toEqual([
      { name: "둘째", order: 0 },
      { name: "첫째", order: 1 },
    ]);
  });
});
