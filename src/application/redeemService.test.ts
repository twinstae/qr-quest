import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { TEST_CASE } from "../domain/fixtures.ts";
import type { PlaySession } from "../domain/playSession.ts";
import createFakeCaseRepo from "../persistence/FakeCaseRepo.ts";
import {
  createFakePlaySessionRepo,
  createFakeStepAttemptRepo,
} from "../persistence/FakePlaySessionRepo.ts";
import createFakeStepRepo from "../persistence/FakeStepRepo.ts";
import { redeemCompletionCode } from "./redeemService.ts";

const NOW = new Date("2026-09-15T06:30:00.000Z");
// KST로 9월 15일 오후 3시 30분. 책방 기준 오늘은 2026-09-14T15:00:00.000Z에 시작했다.
const EARLIER_TODAY = "2026-09-15T05:00:00.000Z";
const YESTERDAY = "2026-09-13T05:00:00.000Z";

function completedSession(overrides: Partial<PlaySession> = {}): PlaySession {
  return {
    id: "session-1",
    caseId: TEST_CASE.id,
    token: "token-1",
    status: "COMPLETED",
    currentStepOrder: 5,
    startedAt: EARLIER_TODAY,
    lastSeenAt: EARLIER_TODAY,
    completedAt: EARLIER_TODAY,
    completionCode: "79-1-K7QP",
    isTest: false,
    ...overrides,
  };
}

function contextWithSessions(sessions: PlaySession[]) {
  return createFakeContext({
    repo: {
      case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE }),
      step: createFakeStepRepo({}),
      playSession: createFakePlaySessionRepo(
        Object.fromEntries(sessions.map((session) => [session.id, session])),
      ),
      stepAttempt: createFakeStepAttemptRepo(),
    },
  });
}

describe("redeemCompletionCode", () => {
  it("유효한 코드를 리딤하고 사용 시각을 남긴다", async () => {
    const session = completedSession();
    const ctx = contextWithSessions([session]);

    const result = await redeemCompletionCode(ctx, { code: "79-1-K7QP", now: NOW });

    expect(result).toEqual({
      kind: "VALID",
      code: "79-1-K7QP",
      caseNumber: TEST_CASE.number,
      caseTitle: TEST_CASE.title,
      completedAt: EARLIER_TODAY,
      todayCount: 1,
    });
    expect((await ctx.repo.playSession.getById(session.id))?.redeemedAt).toBe(NOW.toISOString());
  });

  it("직원이 뒤 네 글자만 입력해도 같은 코드로 본다", async () => {
    const ctx = contextWithSessions([completedSession()]);

    const result = await redeemCompletionCode(ctx, { code: " k7qp ", now: NOW });

    expect(result).toMatchObject({ kind: "VALID", code: "79-1-K7QP" });
  });

  it("오늘 몇 번째 리워드인지 알려준다", async () => {
    const first = completedSession({
      id: "session-1",
      token: "token-1",
      completionCode: "79-1-AAAA",
      redeemedAt: EARLIER_TODAY,
    });
    const second = completedSession({
      id: "session-2",
      token: "token-2",
      completionCode: "79-1-BBBB",
      redeemedAt: "2026-09-15T05:30:00.000Z",
    });
    const target = completedSession({
      id: "session-3",
      token: "token-3",
      completionCode: "79-1-CCCC",
    });
    // 어제 건넨 리워드는 오늘 순번에 들어가지 않는다.
    const yesterday = completedSession({
      id: "session-4",
      token: "token-4",
      completionCode: "79-1-DDDD",
      redeemedAt: YESTERDAY,
    });
    const ctx = contextWithSessions([first, second, target, yesterday]);

    const result = await redeemCompletionCode(ctx, { code: "79-1-CCCC", now: NOW });

    expect(result).toMatchObject({ kind: "VALID", todayCount: 3 });
  });

  it("이미 사용된 코드는 거부하고 처음 건넨 시각을 알려준다", async () => {
    const session = completedSession({ redeemedAt: EARLIER_TODAY });
    const ctx = contextWithSessions([session]);

    const result = await redeemCompletionCode(ctx, { code: "79-1-K7QP", now: NOW });

    expect(result).toEqual({
      kind: "ALREADY_REDEEMED",
      code: "79-1-K7QP",
      redeemedAt: EARLIER_TODAY,
    });
    // 최초 사용 시각을 덮어쓰지 않는다.
    expect((await ctx.repo.playSession.getById(session.id))?.redeemedAt).toBe(EARLIER_TODAY);
  });

  it("없는 코드와 형식에 맞지 않는 코드는 구분하지 않고 UNKNOWN이다", async () => {
    const ctx = contextWithSessions([completedSession()]);

    expect(await redeemCompletionCode(ctx, { code: "79-1-ZZZZ", now: NOW })).toEqual({
      kind: "UNKNOWN",
    });
    // 0/O, 1/I는 코드에 쓰지 않는 글자다.
    expect(await redeemCompletionCode(ctx, { code: "79-1-K70P", now: NOW })).toEqual({
      kind: "UNKNOWN",
    });
    expect(await redeemCompletionCode(ctx, { code: "", now: NOW })).toEqual({ kind: "UNKNOWN" });
  });

  it("테스트 모드 세션의 코드는 리딤되지 않는다", async () => {
    const session = completedSession({ isTest: true });
    const ctx = contextWithSessions([session]);

    const result = await redeemCompletionCode(ctx, { code: "79-1-K7QP", now: NOW });

    expect(result).toEqual({ kind: "TEST_SESSION" });
    expect((await ctx.repo.playSession.getById(session.id))?.redeemedAt).toBeUndefined();
  });
});
