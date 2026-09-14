import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { NotExistError } from "../domain/errors.ts";
import { ANOTHER_STEP, TEST_CASE, TEST_STEP } from "../domain/fixtures.ts";
import type { Step } from "../domain/step.ts";
import createFakeStepRepo from "../persistence/FakeStepRepo.ts";
import { createStep, getStepForEdit, listSteps, updateStep } from "./stepService.ts";

function contextWith(steps: Step[] = []) {
  return createFakeContext({
    repo: { step: createFakeStepRepo(Object.fromEntries(steps.map((step) => [step.id, step]))) },
  });
}

const EDITOR_INPUT = {
  name: "QR 01",
  kind: "QR" as const,
  title: "첫 번째 문제",
  body: "서가를 살펴보세요",
  reveal: { text: "단서가 발견되었습니다" },
  question: "무엇일까요?",
  answerSpec: { type: "SHORT_TEXT" as const, accepted: ["정답"], match: "EXACT" as const },
  hint: "표지를 보세요",
};

describe("listSteps", () => {
  it("관리자 목록은 순서대로 정렬하고 정답 보유 여부만 알려준다", async () => {
    const ctx = contextWith([
      { ...TEST_STEP, id: "step-late", order: 5, name: "QR 05", qrToken: "QRTOKEN005" },
      TEST_STEP,
    ]);

    const list = await listSteps(ctx, TEST_CASE.id);

    expect(list.map((step) => step.name)).toEqual(["QR 02", "QR 05"]);
    expect(list[0]).toEqual({
      id: TEST_STEP.id,
      order: TEST_STEP.order,
      kind: "QR",
      name: TEST_STEP.name,
      qrToken: TEST_STEP.qrToken,
      published: true,
      title: TEST_STEP.title,
      hasAnswer: true,
    });
  });

  it("다른 CASE의 단계는 섞이지 않는다", async () => {
    const ctx = contextWith([TEST_STEP, ANOTHER_STEP]);

    const list = await listSteps(ctx, TEST_CASE.id);

    expect(list.map((step) => step.id)).toEqual([TEST_STEP.id]);
  });
});

describe("createStep", () => {
  it("QR 단계에는 토큰을 새로 붙인다", async () => {
    const ctx = contextWith();

    const created = await createStep(ctx, TEST_CASE.id, EDITOR_INPUT);

    expect(created).toMatchObject({ caseId: TEST_CASE.id, order: 0, kind: "QR", published: true });
    expect(created.qrToken).toEqual(expect.any(String));
    expect(created.answerSpec).toEqual(EDITOR_INPUT.answerSpec);
  });

  it("소개 단계는 QR 토큰을 갖지 않는다", async () => {
    const ctx = contextWith();

    const created = await createStep(ctx, TEST_CASE.id, {
      ...EDITOR_INPUT,
      kind: "INTRO",
      name: "사건 소개",
    });

    expect(created.qrToken).toBeNull();
  });

  it("이미 단계가 있으면 마지막 순서 다음에 붙인다", async () => {
    const ctx = contextWith([TEST_STEP]);

    const created = await createStep(ctx, TEST_CASE.id, EDITOR_INPUT);

    expect(created.order).toBe(TEST_STEP.order + 1);
  });
});

describe("updateStep", () => {
  it("내용을 고쳐도 QR 토큰과 순서는 그대로다 (요구 23)", async () => {
    const ctx = contextWith([TEST_STEP]);

    const updated = await updateStep(ctx, TEST_STEP.id, {
      ...EDITOR_INPUT,
      name: TEST_STEP.name,
      title: "고친 제목",
    });

    expect(updated).toMatchObject({
      id: TEST_STEP.id,
      order: TEST_STEP.order,
      qrToken: TEST_STEP.qrToken,
      title: "고친 제목",
    });
  });

  it("종류를 바꿔 QR 없는 단계로 만들면 토큰을 떼어낸다", async () => {
    const ctx = contextWith([TEST_STEP]);

    const updated = await updateStep(ctx, TEST_STEP.id, { ...EDITOR_INPUT, kind: "CLOSING" });

    expect(updated.qrToken).toBeNull();
  });

  it("없는 단계는 NotExistError를 던진다", async () => {
    const ctx = contextWith();

    await expect(updateStep(ctx, "missing", EDITOR_INPUT)).rejects.toThrow(NotExistError);
  });

  it("getStepForEdit은 정답을 포함한 전체 단계를 돌려준다", async () => {
    const ctx = contextWith([TEST_STEP]);

    const found = await getStepForEdit(ctx, TEST_STEP.id);

    expect(found).toEqual(TEST_STEP);
  });
});
