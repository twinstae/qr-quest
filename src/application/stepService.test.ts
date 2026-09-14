import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { NotExistError } from "../domain/errors.ts";
import { ANOTHER_STEP, TEST_CASE, TEST_STEP } from "../domain/fixtures.ts";
import type { Step } from "../domain/step.ts";
import createFakeStepRepo from "../persistence/FakeStepRepo.ts";
import {
  createStep,
  getStepForDisplay,
  getStepForEdit,
  listSteps,
  submitStepAnswer,
  updateStep,
} from "./stepService.ts";

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

describe("getStepForDisplay", () => {
  it("정답을 뺀 참가자용 내용을 돌려준다", async () => {
    const ctx = contextWith([TEST_STEP]);

    const display = await getStepForDisplay(ctx, TEST_STEP.qrToken ?? "");

    expect(display).toMatchObject({
      id: TEST_STEP.id,
      name: TEST_STEP.name,
      kind: "QR",
      order: TEST_STEP.order,
      title: TEST_STEP.title,
      body: TEST_STEP.body,
      media: TEST_STEP.media,
      question: TEST_STEP.question,
      placeholder: TEST_STEP.placeholder,
      hint: TEST_STEP.hint,
    });
    expect(display.answerSpec).toEqual({ type: "SHORT_TEXT" });
    expect(display).not.toHaveProperty("reveal");
    expect(display).not.toHaveProperty("correctMessage");
  });

  it("객관식은 보기만 남기고 정답 보기는 감춘다", async () => {
    const choiceStep: Step = {
      ...TEST_STEP,
      id: "step-choice",
      qrToken: "QRTOKEN009",
      answerSpec: {
        type: "SINGLE_CHOICE",
        choices: [
          { id: "A", label: "첫 번째" },
          { id: "B", label: "두 번째" },
        ],
        correctChoiceIds: ["B"],
      },
    };
    const ctx = contextWith([choiceStep]);

    const display = await getStepForDisplay(ctx, "QRTOKEN009");

    expect(display.answerSpec).toEqual({
      type: "SINGLE_CHOICE",
      choices: [
        { id: "A", label: "첫 번째" },
        { id: "B", label: "두 번째" },
      ],
    });
    // 보기 id는 화면에 "B. 두 번째"로 보여야 하므로 남고, 정답 표시만 사라진다
    expect(Object.keys(display.answerSpec ?? {})).toEqual(["type", "choices"]);
    expect(JSON.stringify(display)).not.toContain("correctChoiceIds");
  });

  it("없는 QR 토큰은 NotExistError를 던진다", async () => {
    const ctx = contextWith();

    await expect(getStepForDisplay(ctx, "NOPE")).rejects.toThrow(NotExistError);
  });
});

describe("submitStepAnswer", () => {
  it("정답이면 공개할 단서를 돌려준다", async () => {
    const ctx = contextWith([TEST_STEP]);

    const result = await submitStepAnswer(ctx, TEST_STEP.id, {
      type: "TEXT",
      value: "이민열, 김도균",
    });

    expect(result).toEqual({ correct: true, reveal: TEST_STEP.reveal });
  });

  it("오답이면 correct:false만 돌려준다 (단서를 흘리지 않는다)", async () => {
    const ctx = contextWith([TEST_STEP]);

    const result = await submitStepAnswer(ctx, TEST_STEP.id, { type: "TEXT", value: "엉뚱한 답" });

    expect(result).toEqual({ correct: false });
  });

  it("문제가 없는 단계는 어떤 답을 넣어도 정답이 아니다", async () => {
    const ctx = contextWith([{ ...TEST_STEP, answerSpec: undefined }]);

    const result = await submitStepAnswer(ctx, TEST_STEP.id, { type: "TEXT", value: "아무거나" });

    expect(result).toEqual({ correct: false });
  });

  it("없는 단계는 NotExistError를 던진다", async () => {
    const ctx = contextWith();

    await expect(
      submitStepAnswer(ctx, "missing", { type: "TEXT", value: "anything" }),
    ).rejects.toThrow(NotExistError);
  });
});

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
