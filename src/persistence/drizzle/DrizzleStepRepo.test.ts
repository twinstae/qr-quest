import { describe, expect, it } from "vitest";

import { caseInput, stepInput, TEST_STEP } from "../../domain/fixtures.ts";
import { createDrizzleCaseRepo } from "./DrizzleCaseRepo.ts";
import { createDrizzleStepRepo } from "./DrizzleStepRepo.ts";
import { createTestDatabase } from "./test-helpers.ts";

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

async function setup() {
  const db = await createTestDatabase();
  const caseRepo = createDrizzleCaseRepo(db);
  const stepRepo = createDrizzleStepRepo(db);
  return { db, caseRepo, stepRepo };
}

describe("createDrizzleStepRepo", () => {
  it("create로 만든 단계를 getById로 그대로 읽을 수 있다", async () => {
    const { db, caseRepo, stepRepo } = await setup();
    await using _db = db;
    const created = await caseRepo.create(caseInput());

    const input = stepInput({ caseId: created.id });
    const step = await stepRepo.create(input);
    const found = await stepRepo.getById(step.id);

    expect(step).toEqual({ ...input, id: step.id });
    expect(found).toEqual(step);
  });

  it("미디어·공개할 단서·정답 유형까지 그대로 보존된다", async () => {
    const { db, caseRepo, stepRepo } = await setup();
    await using _db = db;
    const created = await caseRepo.create(caseInput());

    const step = await stepRepo.create(stepInput({ caseId: created.id }));
    const found = await stepRepo.getById(step.id);

    expect(found?.media).toEqual(TEST_STEP.media);
    expect(found?.reveal).toEqual(TEST_STEP.reveal);
    expect(found?.answerSpec).toEqual(TEST_STEP.answerSpec);
    expect(found?.hint).toEqual(TEST_STEP.hint);
  });

  it("QR 토큰이 없는 단계는 null로 읽힌다 (JSON의 undefined로 새지 않는다)", async () => {
    const { db, caseRepo, stepRepo } = await setup();
    await using _db = db;
    const created = await caseRepo.create(caseInput());

    const step = await stepRepo.create(
      stepInput({ caseId: created.id, kind: "INTRO", qrToken: null }),
    );

    expect(await stepRepo.getById(step.id)).toMatchObject({ kind: "INTRO", qrToken: null });
  });

  it("존재하지 않는 id는 undefined를 반환한다", async () => {
    const { db, stepRepo } = await setup();
    await using _db = db;

    expect(await stepRepo.getById(MISSING_ID)).toBeUndefined();
  });

  it("QR 토큰으로 단계를 찾는다", async () => {
    const { db, caseRepo, stepRepo } = await setup();
    await using _db = db;
    const created = await caseRepo.create(caseInput());
    const step = await stepRepo.create(stepInput({ caseId: created.id, qrToken: "QRTOKEN-XYZ" }));

    expect(await stepRepo.getByQrToken("QRTOKEN-XYZ")).toEqual(step);
    expect(await stepRepo.getByQrToken("NOPE")).toBeUndefined();
  });

  it("listByCaseId는 그 CASE의 단계만 순서대로 돌려준다", async () => {
    const { db, caseRepo, stepRepo } = await setup();
    await using _db = db;
    const caseA = await caseRepo.create(caseInput());
    const caseB = await caseRepo.create(caseInput({ number: 2, entryToken: "ENTRY-B" }));

    const late = await stepRepo.create(
      stepInput({ caseId: caseA.id, order: 3, name: "QR 04", qrToken: "TOKEN-LATE" }),
    );
    const early = await stepRepo.create(
      stepInput({ caseId: caseA.id, order: 1, name: "QR 02", qrToken: "TOKEN-EARLY" }),
    );
    await stepRepo.create(
      stepInput({ caseId: caseB.id, order: 0, name: "다른 단계", qrToken: "TOKEN-B" }),
    );

    expect(await stepRepo.listByCaseId(caseA.id)).toEqual([early, late]);
  });

  it("update로 바꾼 내용이 반영되고 다른 CASE로 옮겨지지 않는다", async () => {
    const { db, caseRepo, stepRepo } = await setup();
    await using _db = db;
    const created = await caseRepo.create(caseInput());

    const step = await stepRepo.create(stepInput({ caseId: created.id, qrToken: "TOKEN-KEEP" }));
    const { caseId: _caseId, ...fields } = stepInput({
      caseId: created.id,
      qrToken: "TOKEN-KEEP",
      title: "수정된 제목",
    });
    const updated = await stepRepo.update(step.id, fields);

    expect(updated).toMatchObject({
      id: step.id,
      caseId: created.id,
      order: TEST_STEP.order,
      title: "수정된 제목",
    });
    expect(await stepRepo.getById(step.id)).toEqual(updated);
  });

  it("delete는 그 단계만 지우고 다른 단계는 남겨둔다", async () => {
    const { db, caseRepo, stepRepo } = await setup();
    await using _db = db;
    const created = await caseRepo.create(caseInput());
    const target = await stepRepo.create(
      stepInput({ caseId: created.id, order: 0, qrToken: "TOKEN-DEL" }),
    );
    const survivor = await stepRepo.create(
      stepInput({ caseId: created.id, order: 1, qrToken: "TOKEN-KEEP2" }),
    );

    await stepRepo.delete(target.id);

    expect(await stepRepo.getById(target.id)).toBeUndefined();
    expect(await stepRepo.listByCaseId(created.id)).toEqual([survivor]);
  });

  it("deleteByCaseId는 그 CASE의 단계만 지운다", async () => {
    const { db, caseRepo, stepRepo } = await setup();
    await using _db = db;
    const caseA = await caseRepo.create(caseInput());
    const caseB = await caseRepo.create(caseInput({ number: 2, entryToken: "ENTRY-B" }));
    await stepRepo.create(stepInput({ caseId: caseA.id, order: 0, qrToken: "TOKEN-A1" }));
    const survivor = await stepRepo.create(
      stepInput({ caseId: caseB.id, order: 0, qrToken: "TOKEN-B1" }),
    );

    await stepRepo.deleteByCaseId(caseA.id);

    expect(await stepRepo.listByCaseId(caseA.id)).toEqual([]);
    expect(await stepRepo.listByCaseId(caseB.id)).toEqual([survivor]);
  });

  it("nextOrder는 단계가 없으면 0, 있으면 마지막 다음 순서를 준다", async () => {
    const { db, caseRepo, stepRepo } = await setup();
    await using _db = db;
    const created = await caseRepo.create(caseInput());

    expect(await stepRepo.nextOrder(created.id)).toBe(0);

    await stepRepo.create(stepInput({ caseId: created.id, order: 0, qrToken: "TOKEN-0" }));
    await stepRepo.create(stepInput({ caseId: created.id, order: 2, qrToken: "TOKEN-2" }));

    expect(await stepRepo.nextOrder(created.id)).toBe(3);
  });
});
