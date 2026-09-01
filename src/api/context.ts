import createFakeQuestRepo from "../persistence/FakeQuestRepo.ts";
import type { QuestRepo } from "../persistence/types.ts";

export interface AppContext {
  repo: {
    quest: QuestRepo;
  };
}

export function createFakeContext(override: Partial<AppContext> = {}): AppContext {
  return {
    repo: {
      quest: createFakeQuestRepo({}),
    },
    ...override,
  };
}
