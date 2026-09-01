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
  } satisfies QuestRepo;
}

export default createFakeQuestRepo;
