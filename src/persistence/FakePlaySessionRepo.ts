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
  } satisfies StepAttemptRepo;
}

export default createFakePlaySessionRepo;
