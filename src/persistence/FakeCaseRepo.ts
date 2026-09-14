import type { Case } from "../domain/case.ts";
import type { CaseRepo } from "./types.ts";

export function createFakeCaseRepo(initState: Record<string, Case>): CaseRepo {
  const state = new Map(Object.entries(initState));

  return {
    async create(input) {
      const created: Case = { ...input, id: crypto.randomUUID() };
      state.set(created.id, created);
      return created;
    },
    async getById(id) {
      return state.get(id);
    },
    async getByEntryToken(token) {
      return [...state.values()].find((item) => item.entryToken === token);
    },
    async list() {
      return [...state.values()];
    },
    async update(id, input) {
      const existing = state.get(id);
      if (!existing) throw new Error(`no case with id=${id}`);
      const updated: Case = { ...input, id };
      state.set(id, updated);
      return updated;
    },
    async delete(id) {
      state.delete(id);
    },
  } satisfies CaseRepo;
}

export default createFakeCaseRepo;
