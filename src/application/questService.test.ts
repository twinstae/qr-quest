import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { NotExistError } from "../domain/errors.ts";
import type { Quest } from "../domain/quest.ts";
import createFakeQuestRepo from "../persistence/FakeQuestRepo.ts";
import { getQuestForDisplay, submitAnswer } from "./questService.ts";

const QUEST: Quest = {
  id: "quest-1",
  groupId: "group-1",
  content: "헌법논증이론의 저자는 누구일까요?",
  image: { src: "https://example.com/cover.jpg", alt: "표지" },
  answer: "이민열, 김도균",
  alternatives: ["이한"],
  placeholder: "ㅇㅇㅇ, ㅁㅁㅁ",
  hint: "표지 안에 답이 있습니다",
  reward: { text: "정답입니다!", image: undefined },
};

function contextWithQuest(quest: Quest) {
  return createFakeContext({ repo: { quest: createFakeQuestRepo({ [quest.id]: quest }) } });
}

describe("getQuestForDisplay", () => {
  it("정답과 보상을 제외한 퀘스트 내용을 반환한다", async () => {
    const ctx = contextWithQuest(QUEST);

    const display = await getQuestForDisplay(ctx, QUEST.id);

    expect(display).toEqual({
      content: QUEST.content,
      image: QUEST.image,
      placeholder: QUEST.placeholder,
      hint: QUEST.hint,
    });
  });

  it("존재하지 않는 퀘스트는 NotExistError를 던진다", async () => {
    const ctx = createFakeContext();

    await expect(getQuestForDisplay(ctx, "missing")).rejects.toThrow(NotExistError);
  });
});

describe("submitAnswer", () => {
  it("정답을 제출하면 보상을 반환한다", async () => {
    const ctx = contextWithQuest(QUEST);

    const result = await submitAnswer(ctx, QUEST.id, "  이민열, 김도균  ");

    expect(result).toEqual({ correct: true, reward: QUEST.reward });
  });

  it("alternatives에 있는 값은 아직 정답으로 인정하지 않는다", async () => {
    const ctx = contextWithQuest(QUEST);

    const result = await submitAnswer(ctx, QUEST.id, "이한");

    expect(result).toEqual({ correct: false });
  });

  it("존재하지 않는 퀘스트는 NotExistError를 던진다", async () => {
    const ctx = createFakeContext();

    await expect(submitAnswer(ctx, "missing", "anything")).rejects.toThrow(NotExistError);
  });
});
