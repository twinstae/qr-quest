import { describe, expect, it } from "vitest";

import { TEST_CASE } from "../../domain/fixtures.ts";
import type { PlaySession } from "../../domain/playSession.ts";
import createFakeCaseRepo from "../../persistence/FakeCaseRepo.ts";
import { createFakePlaySessionRepo } from "../../persistence/FakePlaySessionRepo.ts";
import { createFakeContext } from "../context.ts";
import { createTestClient, signInAndGetCookie } from "../testHelpers.ts";
import { createApp } from "./app.ts";

function completedSession(overrides: Partial<PlaySession> = {}): PlaySession {
  return {
    id: "session-1",
    caseId: TEST_CASE.id,
    token: "token-1",
    status: "COMPLETED",
    currentStepOrder: 5,
    startedAt: "2026-09-15T05:00:00.000Z",
    lastSeenAt: "2026-09-15T05:20:00.000Z",
    completedAt: "2026-09-15T05:20:00.000Z",
    completionCode: "79-1-K7QP",
    isTest: false,
    ...overrides,
  };
}

async function appWithSessions(sessions: PlaySession[]) {
  const ctx = createFakeContext({
    repo: {
      case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE }),
      playSession: createFakePlaySessionRepo(
        Object.fromEntries(sessions.map((session) => [session.id, session])),
      ),
    },
  });
  const cookie = await signInAndGetCookie(ctx);
  return { app: createApp(ctx), cookie, ctx };
}

describe("POST /api/redeem", () => {
  it("인증 없이는 리딤할 수 없다", async () => {
    const { app } = await appWithSessions([completedSession()]);
    const client = createTestClient(app);

    const response = await client.post("/api/redeem", { code: "79-1-K7QP" });

    expect(response.status).toBe(401);
  });

  it("유효한 코드를 리딤하고 그대로 보여줄 수 있는 결과를 돌려준다", async () => {
    const { app, cookie } = await appWithSessions([completedSession()]);
    const client = createTestClient(app, { cookie });

    const response = await client.post("/api/redeem", { code: "79-1-K7QP" });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      kind: "VALID",
      code: "79-1-K7QP",
      caseNumber: TEST_CASE.number,
      todayCount: 1,
    });
  });

  it("같은 코드를 다시 리딤하면 409와 최초 사용 시각을 돌려준다", async () => {
    const { app, cookie, ctx } = await appWithSessions([completedSession()]);
    const client = createTestClient(app, { cookie });

    const first = await client.post("/api/redeem", { code: "79-1-K7QP" });
    expect(first.status).toBe(200);
    const afterFirst = (await ctx.repo.playSession.getById("session-1"))?.redeemedAt;

    const second = await client.post("/api/redeem", { code: "79-1-K7QP" });
    const payload = await second.json();

    expect(second.status).toBe(409);
    expect(payload.kind).toBe("ALREADY_REDEEMED");
    expect(payload.redeemedAt).toBe(afterFirst);
    // 두 번째 시도가 최초 사용 시각을 덮어쓰지 않는다.
    expect((await ctx.repo.playSession.getById("session-1"))?.redeemedAt).toBe(afterFirst);
  });

  it("없는 코드는 404, 테스트 세션 코드는 403이다", async () => {
    const { app, cookie } = await appWithSessions([
      completedSession({ id: "session-test", token: "token-test", isTest: true }),
    ]);
    const client = createTestClient(app, { cookie });

    const unknown = await client.post("/api/redeem", { code: "79-1-ZZZZ" });
    const testSession = await client.post("/api/redeem", { code: "79-1-K7QP" });

    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toEqual({ kind: "UNKNOWN" });
    expect(testSession.status).toBe(403);
    expect(await testSession.json()).toEqual({ kind: "TEST_SESSION" });
  });
});
