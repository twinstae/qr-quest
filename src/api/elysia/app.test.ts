import { describe, expect, it } from "vitest";

import { createFakeContext } from "../context.ts";
import { signInAndGetCookie } from "../testHelpers.ts";
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

describe("/api/auth/* (better-auth mount)", () => {
  it("POST /api/auth/sign-up/email로 가입하고 로그인할 수 있다", async () => {
    const app = createApp(createFakeContext());

    const signUpResponse = await app.handle(
      new Request("http://localhost/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Admin",
          email: "admin@example.com",
          password: "password1234",
        }),
      }),
    );
    expect(signUpResponse.status).toBe(200);

    const signInResponse = await app.handle(
      new Request("http://localhost/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@example.com", password: "password1234" }),
      }),
    );
    const payload = await signInResponse.json();

    expect(signInResponse.status).toBe(200);
    expect(payload.user.email).toBe("admin@example.com");
  });
});

describe("/api/groups", () => {
  it("세션이 없으면 401을 반환한다", async () => {
    const app = createApp(createFakeContext());

    const getResponse = await app.handle(new Request("http://localhost/api/groups"));
    expect(getResponse.status).toBe(401);

    const postResponse = await app.handle(
      new Request("http://localhost/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Library Event 2026" }),
      }),
    );
    expect(postResponse.status).toBe(401);
  });

  it("로그인한 상태면 그룹을 생성하고 목록을 조회할 수 있다", async () => {
    const ctx = createFakeContext();
    const cookie = await signInAndGetCookie(ctx);
    const app = createApp(ctx);

    const createResponse = await app.handle(
      new Request("http://localhost/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ name: "Library Event 2026", description: "가을 행사" }),
      }),
    );
    const created = await createResponse.json();
    expect(createResponse.status).toBe(200);
    expect(created).toEqual({
      id: created.id,
      name: "Library Event 2026",
      description: "가을 행사",
    });

    const listResponse = await app.handle(
      new Request("http://localhost/api/groups", { headers: { cookie } }),
    );
    const groups = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(groups).toContainEqual(created);
  });
});
