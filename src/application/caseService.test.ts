import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import type { Case } from "../domain/case.ts";
import { NotExistError } from "../domain/errors.ts";
import { ANOTHER_CASE, TEST_CASE } from "../domain/fixtures.ts";
import createFakeCaseRepo from "../persistence/FakeCaseRepo.ts";
import createFakeStepRepo from "../persistence/FakeStepRepo.ts";
import {
  createCase,
  deleteCase,
  getCaseByEntryToken,
  getCaseForEdit,
  listCases,
  updateCase,
} from "./caseService.ts";

function contextWith(cases: Case[] = []) {
  return createFakeContext({
    repo: {
      case: createFakeCaseRepo(Object.fromEntries(cases.map((item) => [item.id, item]))),
      step: createFakeStepRepo({}),
    },
  });
}

const CREATE_INPUT = {
  number: 1,
  title: TEST_CASE.title,
  teaser: TEST_CASE.teaser,
  intro: TEST_CASE.intro,
};

describe("createCase", () => {
  it("CASE를 DRAFT로 만들고 시작 토큰을 붙인다", async () => {
    const ctx = contextWith();

    const created = await createCase(ctx, CREATE_INPUT);

    expect(created).toMatchObject({ ...CREATE_INPUT, status: "DRAFT", estimatedMinutes: 20 });
    expect(created.entryToken).toEqual(expect.any(String));
    expect(created.entryToken.length).toBeGreaterThan(0);
  });

  it("단계 뼈대(소개 → QR 4 → 마지막 → 종결)를 함께 만들어 준다", async () => {
    const ctx = contextWith();

    const created = await createCase(ctx, CREATE_INPUT);
    const steps = await ctx.repo.step.listByCaseId(created.id);

    expect(steps.map((step) => [step.order, step.kind, step.name])).toEqual([
      [0, "INTRO", "사건 소개"],
      [1, "QR", "QR 01"],
      [2, "QR", "QR 02"],
      [3, "QR", "QR 03"],
      [4, "QR", "QR 04"],
      [5, "FINAL", "마지막 단서"],
      [6, "CLOSING", "사건 종결"],
    ]);
  });

  it("QR로 들어가는 단계에만 토큰을 붙이고 서로 겹치지 않게 한다", async () => {
    const ctx = contextWith();

    const created = await createCase(ctx, CREATE_INPUT);
    const steps = await ctx.repo.step.listByCaseId(created.id);

    expect(steps[0]?.qrToken).toBeNull();
    expect(steps[6]?.qrToken).toBeNull();

    const tokens = steps.filter((step) => step.qrToken !== null).map((step) => step.qrToken);
    expect(tokens).toHaveLength(5);
    expect(new Set(tokens).size).toBe(5);
  });
});

describe("listCases", () => {
  it("CASE 번호 순으로 돌려준다", async () => {
    const ctx = contextWith([
      { ...ANOTHER_CASE, number: 2 },
      { ...TEST_CASE, number: 1 },
    ]);

    const list = await listCases(ctx);

    expect(list.map((item) => item.number)).toEqual([1, 2]);
  });
});

describe("getCaseByEntryToken", () => {
  it("시작 토큰에 해당하는 CASE를 찾는다", async () => {
    const ctx = contextWith([TEST_CASE, ANOTHER_CASE]);

    expect(await getCaseByEntryToken(ctx, ANOTHER_CASE.entryToken)).toEqual(ANOTHER_CASE);
  });

  it("없는 토큰은 NotExistError를 던진다", async () => {
    const ctx = contextWith([TEST_CASE]);

    await expect(getCaseByEntryToken(ctx, "NOPE")).rejects.toThrow(NotExistError);
  });
});

describe("updateCase", () => {
  it("내용을 고쳐도 시작 토큰과 상태는 그대로다", async () => {
    const ctx = contextWith([TEST_CASE]);

    const updated = await updateCase(ctx, TEST_CASE.id, {
      ...CREATE_INPUT,
      number: 7,
      title: "고친 제목",
    });

    expect(updated).toMatchObject({
      id: TEST_CASE.id,
      number: 7,
      title: "고친 제목",
      entryToken: TEST_CASE.entryToken,
      status: TEST_CASE.status,
    });
  });

  it("없는 CASE는 NotExistError를 던진다", async () => {
    const ctx = contextWith();

    await expect(updateCase(ctx, "missing", CREATE_INPUT)).rejects.toThrow(NotExistError);
  });

  it("getCaseForEdit도 없는 CASE는 NotExistError를 던진다", async () => {
    const ctx = contextWith();

    await expect(getCaseForEdit(ctx, "missing")).rejects.toThrow(NotExistError);
  });
});

describe("deleteCase", () => {
  it("CASE와 그 CASE의 단계를 함께 지운다", async () => {
    const ctx = contextWith();
    const created = await createCase(ctx, CREATE_INPUT);
    const other = await createCase(ctx, { ...CREATE_INPUT, number: 2 });

    await deleteCase(ctx, created.id);

    expect(await listCases(ctx)).toEqual([other]);
    expect(await ctx.repo.step.listByCaseId(created.id)).toEqual([]);
  });

  it("다른 CASE의 단계는 남겨둔다", async () => {
    const ctx = contextWith();
    const created = await createCase(ctx, CREATE_INPUT);
    const other = await createCase(ctx, { ...CREATE_INPUT, number: 2 });

    await deleteCase(ctx, created.id);

    expect(await ctx.repo.step.listByCaseId(other.id)).toHaveLength(7);
  });
});
