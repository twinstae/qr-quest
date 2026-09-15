import { describe, expect, it } from "vitest";

import { TEST_CASE, TEST_STEP } from "../../domain/fixtures.ts";
import type { PlaySession } from "../../domain/playSession.ts";
import createFakeCaseRepo from "../../persistence/FakeCaseRepo.ts";
import { createFakePlaySessionRepo } from "../../persistence/FakePlaySessionRepo.ts";
import createFakeStepRepo from "../../persistence/FakeStepRepo.ts";
import { createFakeContext } from "../context.ts";
import { createTestClient, signInAndGetCookie } from "../testHelpers.ts";
import { createApp } from "./app.ts";

function session(overrides: Partial<PlaySession> = {}): PlaySession {
  return {
    id: "session-1",
    caseId: TEST_CASE.id,
    token: "token-1",
    status: "IN_PROGRESS",
    currentStepOrder: TEST_STEP.order,
    startedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    isTest: false,
    ...overrides,
  };
}

async function appWithSessions(sessions: PlaySession[]) {
  const ctx = createFakeContext({
    repo: {
      case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE }),
      step: createFakeStepRepo({ [TEST_STEP.id]: TEST_STEP }),
      playSession: createFakePlaySessionRepo(
        Object.fromEntries(sessions.map((item) => [item.id, item])),
      ),
    },
  });
  const cookie = await signInAndGetCookie(ctx);
  return { app: createApp(ctx), cookie };
}

describe("GET /api/cases/:id/stats", () => {
  it("인증 없이는 통계를 볼 수 없다", async () => {
    const { app } = await appWithSessions([session()]);
    const client = createTestClient(app);

    const response = await client.get(`/api/cases/${TEST_CASE.id}/stats?period=today`);

    expect(response.status).toBe(401);
  });

  it("기간별 통계를 돌려준다", async () => {
    const { app, cookie } = await appWithSessions([
      session({ id: "a", token: "token-a" }),
      session({
        id: "b",
        token: "token-b",
        status: "COMPLETED",
        currentStepOrder: TEST_STEP.order + 1,
        completedAt: new Date().toISOString(),
      }),
    ]);
    const client = createTestClient(app, { cookie });

    const response = await client.get(`/api/cases/${TEST_CASE.id}/stats?period=today`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      caseId: TEST_CASE.id,
      period: "today",
      started: 2,
      completed: 1,
      completionRate: 0.5,
    });
    expect(payload.steps).toHaveLength(1);
  });

  it("세션이 없어도 빈 통계를 돌려준다", async () => {
    const { app, cookie } = await appWithSessions([]);
    const client = createTestClient(app, { cookie });

    const response = await client.get(`/api/cases/${TEST_CASE.id}/stats?period=all`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ started: 0, completed: 0, completionRate: 0 });
    expect(payload.averageMinutes).toBeUndefined();
  });

  it("없는 CASE는 404를 반환한다", async () => {
    const { app, cookie } = await appWithSessions([]);
    const client = createTestClient(app, { cookie });

    const response = await client.get("/api/cases/nope/stats?period=all");

    expect(response.status).toBe(404);
  });
});

describe("GET /api/stats/today", () => {
  it("오늘 참가·완료를 돌려주고, 테스트 세션은 세지 않는다", async () => {
    const { app, cookie } = await appWithSessions([
      session({ id: "a", token: "token-a", isTest: true }),
      session({
        id: "b",
        token: "token-b",
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      }),
    ]);
    const client = createTestClient(app, { cookie });

    const response = await client.get("/api/stats/today");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ started: 1, completed: 1 });
  });
});
