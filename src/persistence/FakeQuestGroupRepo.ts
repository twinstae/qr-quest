import type { QuestGroup } from "../domain/questGroup.ts";
import type { QuestGroupRepo } from "./types.ts";

export function createFakeQuestGroupRepo(initState: Record<string, QuestGroup>): QuestGroupRepo {
  const state = new Map(Object.entries(initState));

  return {
    async create(input) {
      const group: QuestGroup = { ...input, id: crypto.randomUUID() };
      state.set(group.id, group);
      return group;
    },
  } satisfies QuestGroupRepo;
}

export default createFakeQuestGroupRepo;
