import { describe, expect, it } from "vitest";

import { caseInput, TEST_CASE } from "../../domain/fixtures.ts";
import { createDrizzleCaseRepo } from "./DrizzleCaseRepo.ts";
import { createTestDatabase } from "./test-helpers.ts";

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

describe("createDrizzleCaseRepo", () => {
  it("create로 만든 CASE를 getById로 그대로 읽을 수 있다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleCaseRepo(db);

    const input = caseInput();
    const created = await repo.create(input);
    const found = await repo.getById(created.id);

    expect(created).toEqual({ ...input, id: created.id });
    expect(found).toEqual(created);
  });

  it("썸네일 이미지가 있으면 읽을 때도 그대로다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleCaseRepo(db);
    const thumbnail = {
      kind: "image" as const,
      src: "https://example.com/case.jpg",
      alt: "썸네일",
    };

    const created = await repo.create(caseInput({ thumbnail }));
    const found = await repo.getById(created.id);

    expect(found?.thumbnail).toEqual(thumbnail);
  });

  it("존재하지 않는 id는 undefined를 반환한다", async () => {
    await using db = await createTestDatabase();

    expect(await createDrizzleCaseRepo(db).getById(MISSING_ID)).toBeUndefined();
  });

  it("시작 토큰으로 CASE를 찾는다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleCaseRepo(db);
    const created = await repo.create(caseInput({ entryToken: "ENTRY-ABC" }));

    expect(await repo.getByEntryToken("ENTRY-ABC")).toEqual(created);
    expect(await repo.getByEntryToken("NOPE")).toBeUndefined();
  });

  it("list는 CASE 번호 순으로 돌려준다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleCaseRepo(db);

    await repo.create(caseInput({ number: 3, entryToken: "T3" }));
    await repo.create(caseInput({ number: 1, entryToken: "T1" }));
    await repo.create(caseInput({ number: 2, entryToken: "T2" }));

    expect((await repo.list()).map((item) => item.number)).toEqual([1, 2, 3]);
  });

  it("update로 바꾼 내용이 getById에도 반영된다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleCaseRepo(db);

    const created = await repo.create(caseInput({ entryToken: "ENTRY-KEEP" }));
    const updated = await repo.update(created.id, {
      ...caseInput({ title: "수정된 사건", entryToken: "ENTRY-KEEP" }),
    });

    expect(updated).toMatchObject({ id: created.id, title: "수정된 사건" });
    expect(await repo.getById(created.id)).toEqual(updated);
  });

  it("delete로 지운 CASE는 더 이상 읽히지 않는다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleCaseRepo(db);
    const created = await repo.create(caseInput());

    await repo.delete(created.id);

    expect(await repo.getById(created.id)).toBeUndefined();
    expect(await repo.list()).toEqual([]);
  });

  it("시작 토큰은 중복될 수 없다", async () => {
    await using db = await createTestDatabase();
    const repo = createDrizzleCaseRepo(db);

    await repo.create(caseInput({ entryToken: TEST_CASE.entryToken }));

    await expect(repo.create(caseInput({ number: 2 }))).rejects.toThrow();
  });
});
