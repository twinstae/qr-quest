import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { NotExistError } from "../domain/errors.ts";
import { TEST_QUEST } from "../domain/fixtures.ts";
import type { Quest } from "../domain/quest.ts";
import createFakeQuestRepo from "../persistence/FakeQuestRepo.ts";
import { getQuestForDisplay, listQuestsInGroup, submitAnswer } from "./questService.ts";

function contextWithQuest(quest: Quest) {
  return createFakeContext({ repo: { quest: createFakeQuestRepo({ [quest.id]: quest }) } });
}

describe("getQuestForDisplay", () => {
  it("정답과 보상을 제외한 퀘스트 내용을 반환한다", async () => {
    const ctx = contextWithQuest(TEST_QUEST);

    const display = await getQuestForDisplay(ctx, TEST_QUEST.id);

    expect(display).toEqual({
      content: TEST_QUEST.content,
      image: TEST_QUEST.image,
      placeholder: TEST_QUEST.placeholder,
      hint: TEST_QUEST.hint,
    });
  });

  it("존재하지 않는 퀘스트는 NotExistError를 던진다", async () => {
    const ctx = createFakeContext();

    await expect(getQuestForDisplay(ctx, "missing")).rejects.toThrow(NotExistError);
  });
});

describe("submitAnswer", () => {
  it("정답을 제출하면 보상을 반환한다", async () => {
    const ctx = contextWithQuest(TEST_QUEST);

    const result = await submitAnswer(ctx, TEST_QUEST.id, `  ${TEST_QUEST.answer}  `);

    expect(result).toEqual({ correct: true, reward: TEST_QUEST.reward });
  });

  it("alternatives에 있는 값은 아직 정답으로 인정하지 않는다", async () => {
    const ctx = contextWithQuest(TEST_QUEST);

    const result = await submitAnswer(ctx, TEST_QUEST.id, TEST_QUEST.alternatives[0] ?? "");

    expect(result).toEqual({ correct: false });
  });

  it("존재하지 않는 퀘스트는 NotExistError를 던진다", async () => {
    const ctx = createFakeContext();

    await expect(submitAnswer(ctx, "missing", "anything")).rejects.toThrow(NotExistError);
  });
});

describe("listQuestsInGroup", () => {
  it("정답을 제외한 요약 정보만 반환한다", async () => {
    const ctx = contextWithQuest(TEST_QUEST);

    const summaries = await listQuestsInGroup(ctx, TEST_QUEST.groupId);

    expect(summaries).toEqual([
      { id: TEST_QUEST.id, content: TEST_QUEST.content, image: TEST_QUEST.image },
    ]);
  });

  it("다른 그룹의 퀘스트는 포함하지 않는다", async () => {
    const ctx = contextWithQuest(TEST_QUEST);

    const summaries = await listQuestsInGroup(ctx, "other-group");

    expect(summaries).toEqual([]);
  });
});
