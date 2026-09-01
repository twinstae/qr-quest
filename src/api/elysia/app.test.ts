import { describe, expect, it } from "vitest";

import { createFakeContext } from "../context.ts";
import type { Quest } from "../../domain/quest.ts";
import createFakeQuestRepo from "../../persistence/FakeQuestRepo.ts";
import { createApp } from "./app.ts";

const QUEST: Quest = {
  id: "quest-1",
  groupId: "group-1",
  content: "헌법논증이론의 저자는 누구일까요?",
  image: { src: "https://example.com/cover.jpg", alt: "표지" },
  answer: "이민열, 김도균",
  alternatives: ["이한"],
  placeholder: "ㅇㅇㅇ, ㅁㅁㅁ",
  hint: "표지 안에 답이 있습니다",
  reward: {
    text: "정답입니다!",
    image: { src: "https://example.com/reward.jpg", alt: "보상" },
  },
};

function appWithQuest(quest: Quest) {
  const ctx = createFakeContext({ repo: { quest: createFakeQuestRepo({ [quest.id]: quest }) } });
  return createApp(ctx);
}

describe("GET /api/quests/:id", () => {
  it("퀘스트 내용을 반환하지만 정답은 노출하지 않는다", async () => {
    const app = appWithQuest(QUEST);

    const response = await app.handle(new Request(`http://localhost/api/quests/${QUEST.id}`));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      content: QUEST.content,
      image: QUEST.image,
      placeholder: QUEST.placeholder,
      hint: QUEST.hint,
    });
    expect(payload.answer).toBeUndefined();
  });

  it("존재하지 않는 퀘스트는 404를 반환한다", async () => {
    const app = createApp(createFakeContext());

    const response = await app.handle(new Request("http://localhost/api/quests/missing"));

    expect(response.status).toBe(404);
  });
});

describe("POST /api/quests/:id/submit-answer", () => {
  it("정답을 맞추면 보상을 반환한다", async () => {
    const app = appWithQuest(QUEST);

    const response = await app.handle(
      new Request(`http://localhost/api/quests/${QUEST.id}/submit-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: "  이민열, 김도균  " }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ correct: true, reward: QUEST.reward });
  });

  it("오답을 제출하면 오답 결과를 반환한다", async () => {
    const app = appWithQuest(QUEST);

    const response = await app.handle(
      new Request(`http://localhost/api/quests/${QUEST.id}/submit-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: "이한" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ correct: false });
  });
});
