import type { Quest } from "../domain/quest.ts";
import type { QuestRepo } from "./types.ts";

export function createFakeQuestRepo(initState: Record<string, Quest>): QuestRepo {
  const state = new Map(Object.entries(initState));

  return {
    async getById(id) {
      return state.get(id);
    },
    async create(input) {
      const quest: Quest = { ...input, id: crypto.randomUUID() };
      state.set(quest.id, quest);
      return quest;
    },
    async listByGroupId(groupId) {
      return [...state.values()].filter((quest) => quest.groupId === groupId);
    },
    async update(id, input) {
      const existing = state.get(id);
      if (!existing) throw new Error(`no quest with id=${id}`);
      const quest: Quest = { ...existing, ...input, id };
      state.set(id, quest);
      return quest;
    },
  } satisfies QuestRepo;
}

export default createFakeQuestRepo;
