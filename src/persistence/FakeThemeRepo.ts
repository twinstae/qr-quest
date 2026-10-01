import type { Theme } from "../domain/theme.ts";
import type { ThemeRepo } from "./types.ts";

export function createFakeThemeRepo(initState: Record<string, Theme> = {}): ThemeRepo {
  const state = new Map(Object.entries(initState));

  return {
    async create(input) {
      const created: Theme = { ...input, id: crypto.randomUUID() };
      state.set(created.id, created);
      return created;
    },
    async getById(id) {
      return state.get(id);
    },
    async list() {
      return [...state.values()];
    },
    async update(id, input) {
      if (!state.has(id)) throw new Error(`no theme with id=${id}`);
      const updated: Theme = { ...input, id };
      state.set(id, updated);
      return updated;
    },
    async delete(id) {
      state.delete(id);
    },
  } satisfies ThemeRepo;
}

export default createFakeThemeRepo;
