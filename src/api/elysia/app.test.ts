import { describe, expect, it } from "vitest";

import { createFakeContext } from "../context.ts";
import { createTestClient, signInAndGetCookie } from "../testHelpers.ts";
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

async function signedInClient(ctx = createFakeContext()) {
  const cookie = await signInAndGetCookie(ctx);
  const app = createApp(ctx);
  return { ctx, app, client: createTestClient(app, { cookie }) };
}

describe("GET /api/quests/:id", () => {
  it("퀘스트 내용을 반환하지만 정답은 노출하지 않는다", async () => {
    const client = createTestClient(appWithQuest(QUEST));

    const response = await client.get(`/api/quests/${QUEST.id}`);
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
    const client = createTestClient(createApp(createFakeContext()));

    const response = await client.get("/api/quests/missing");

    expect(response.status).toBe(404);
  });
});

describe("POST /api/quests/:id/submit-answer", () => {
  it("정답을 맞추면 보상을 반환한다", async () => {
    const client = createTestClient(appWithQuest(QUEST));

    const response = await client.post(`/api/quests/${QUEST.id}/submit-answer`, {
      answer: "  이민열, 김도균  ",
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ correct: true, reward: QUEST.reward });
  });

  it("오답을 제출하면 오답 결과를 반환한다", async () => {
    const client = createTestClient(appWithQuest(QUEST));

    const response = await client.post(`/api/quests/${QUEST.id}/submit-answer`, {
      answer: "이한",
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ correct: false });
  });
});

describe("/api/auth/* (better-auth mount)", () => {
  it("POST /api/auth/sign-up/email로 가입하고 로그인할 수 있다", async () => {
    const client = createTestClient(createApp(createFakeContext()));

    const signUpResponse = await client.post("/api/auth/sign-up/email", {
      name: "Admin",
      email: "admin@example.com",
      password: "password1234",
    });
    expect(signUpResponse.status).toBe(200);

    const signInResponse = await client.post("/api/auth/sign-in/email", {
      email: "admin@example.com",
      password: "password1234",
    });
    const payload = await signInResponse.json();

    expect(signInResponse.status).toBe(200);
    expect(payload.user.email).toBe("admin@example.com");
  });
});

describe("/api/groups", () => {
  it("세션이 없으면 401을 반환한다", async () => {
    const client = createTestClient(createApp(createFakeContext()));

    expect((await client.get("/api/groups")).status).toBe(401);
    expect((await client.post("/api/groups", { name: "Library Event 2026" })).status).toBe(401);
  });

  it("로그인한 상태면 그룹을 생성하고 목록을 조회할 수 있다", async () => {
    const { client } = await signedInClient();

    const createResponse = await client.post("/api/groups", {
      name: "Library Event 2026",
      description: "가을 행사",
    });
    const created = await createResponse.json();
    expect(createResponse.status).toBe(200);
    expect(created).toEqual({
      id: created.id,
      name: "Library Event 2026",
      description: "가을 행사",
    });

    const listResponse = await client.get("/api/groups");
    const groups = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(groups).toContainEqual(created);
  });
});

describe("GET /api/groups/:id/quests", () => {
  it("세션이 없으면 401을 반환한다", async () => {
    const client = createTestClient(createApp(createFakeContext()));

    const response = await client.get("/api/groups/group-1/quests");

    expect(response.status).toBe(401);
  });

  it("로그인한 상태면 그룹의 퀘스트 요약을 반환한다 (정답 미포함)", async () => {
    const ctx = createFakeContext({
      repo: { quest: createFakeQuestRepo({ [QUEST.id]: QUEST }) },
    });
    const { client } = await signedInClient(ctx);

    const response = await client.get(`/api/groups/${QUEST.groupId}/quests`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([{ id: QUEST.id, content: QUEST.content, image: QUEST.image }]);
  });
});

describe("POST /api/uploads/presign", () => {
  it("세션이 없으면 401을 반환한다", async () => {
    const client = createTestClient(createApp(createFakeContext()));

    const response = await client.post("/api/uploads/presign", {
      filename: "cover.jpg",
      contentType: "image/jpeg",
    });

    expect(response.status).toBe(401);
  });

  it("이미지 파일이면 업로드 URL을 반환한다", async () => {
    const { client } = await signedInClient();

    const response = await client.post("/api/uploads/presign", {
      filename: "cover.jpg",
      contentType: "image/jpeg",
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.uploadUrl).toContain("cover.jpg");
    expect(payload.publicUrl).toContain("cover.jpg");
  });

  it("이미지가 아닌 파일은 스토리지를 호출하지 않고 거부한다", async () => {
    let presignCalls = 0;
    const { client } = await signedInClient(
      createFakeContext({
        imageStorage: {
          async presignUpload() {
            presignCalls++;
            return { uploadUrl: "unused", publicUrl: "unused" };
          },
        },
      }),
    );

    const response = await client.post("/api/uploads/presign", {
      filename: "doc.pdf",
      contentType: "application/pdf",
    });

    expect(response.status).not.toBe(200);
    expect(presignCalls).toBe(0);
  });
});

describe("POST /api/quests", () => {
  const NEW_QUEST_BODY = {
    groupId: "group-1",
    content: "새 퀘스트",
    image: { src: "https://example.com/cover.jpg", alt: "표지" },
    answer: "정답",
    placeholder: "placeholder",
    hint: "hint",
    rewardText: "정답입니다!",
  };

  it("세션이 없으면 401을 반환한다", async () => {
    const client = createTestClient(createApp(createFakeContext()));

    const response = await client.post("/api/quests", NEW_QUEST_BODY);

    expect(response.status).toBe(401);
  });

  it("로그인한 상태면 퀘스트를 생성하고, 즉시 풀 수 있다", async () => {
    const { client } = await signedInClient();

    const createResponse = await client.post("/api/quests", NEW_QUEST_BODY);
    const created = await createResponse.json();

    expect(createResponse.status).toBe(200);
    expect(created).toEqual({
      id: created.id,
      groupId: NEW_QUEST_BODY.groupId,
      content: NEW_QUEST_BODY.content,
      image: NEW_QUEST_BODY.image,
      answer: NEW_QUEST_BODY.answer,
      alternatives: [],
      placeholder: NEW_QUEST_BODY.placeholder,
      hint: NEW_QUEST_BODY.hint,
      reward: { text: NEW_QUEST_BODY.rewardText },
    });

    // 방금 만든 퀘스트가 공개 API로 바로 풀 수 있는지 확인 (ticket 03과의 연결)
    const displayResponse = await client.get(`/api/quests/${created.id}`);
    expect(displayResponse.status).toBe(200);

    const submitResponse = await client.post(`/api/quests/${created.id}/submit-answer`, {
      answer: NEW_QUEST_BODY.answer,
    });
    const submitPayload = await submitResponse.json();

    expect(submitPayload).toEqual({
      correct: true,
      reward: { text: NEW_QUEST_BODY.rewardText },
    });
  });
});
