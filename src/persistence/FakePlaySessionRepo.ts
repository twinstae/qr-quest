import type { PlaySession, StepAttempt } from "../domain/playSession.ts";
import type { PlaySessionRepo, StepAttemptRepo } from "./types.ts";

export function createFakePlaySessionRepo(
  initState: Record<string, PlaySession> = {},
): PlaySessionRepo {
  const state = new Map(Object.entries(initState));

  return {
    async create(input) {
      const created: PlaySession = { ...input, id: crypto.randomUUID() };
      state.set(created.id, created);
      return created;
    },
    async getById(id) {
      return state.get(id);
    },
    async getByToken(token) {
      return [...state.values()].find((session) => session.token === token);
    },
    async update(id, input) {
      const existing = state.get(id);
      if (!existing) throw new Error(`no play session with id=${id}`);
      const updated: PlaySession = { ...existing, ...input, id };
      state.set(id, updated);
      return updated;
    },
    async listByCaseId(caseId) {
      return [...state.values()].filter((session) => session.caseId === caseId);
    },
    async getByCompletionCode(code) {
      return [...state.values()].find((session) => session.completionCode === code);
    },
    async countRedeemedSince(since) {
      const boundary = Date.parse(since);
      return [...state.values()].filter(
        (session) => session.redeemedAt !== undefined && Date.parse(session.redeemedAt) >= boundary,
      ).length;
    },
    async countStartedSince(since) {
      const boundary = Date.parse(since);
      return [...state.values()].filter(
        (session) => !session.isTest && Date.parse(session.startedAt) >= boundary,
      ).length;
    },
    async countCompletedSince(since) {
      const boundary = Date.parse(since);
      return [...state.values()].filter(
        (session) =>
          !session.isTest &&
          session.completedAt !== undefined &&
          Date.parse(session.completedAt) >= boundary,
      ).length;
    },
  } satisfies PlaySessionRepo;
}

export function createFakeStepAttemptRepo(initState: StepAttempt[] = []): StepAttemptRepo {
  const state = [...initState];

  return {
    async create(input) {
      const created: StepAttempt = { ...input, id: crypto.randomUUID() };
      state.push(created);
      return created;
    },
    async listBySessionId(sessionId) {
      return state.filter((attempt) => attempt.sessionId === sessionId);
    },
    async listBySessionIds(sessionIds) {
      const wanted = new Set(sessionIds);
      return state.filter((attempt) => wanted.has(attempt.sessionId));
    },
  } satisfies StepAttemptRepo;
}

export default createFakePlaySessionRepo;
