import { memoryAdapter } from "better-auth/adapters/memory";

import createFakeQuestGroupRepo from "../persistence/FakeQuestGroupRepo.ts";
import createFakeQuestRepo from "../persistence/FakeQuestRepo.ts";
import type { QuestGroupRepo, QuestRepo } from "../persistence/types.ts";
import { createAuth } from "./auth.ts";

export interface AppContext {
  repo: {
    quest: QuestRepo;
    questGroup: QuestGroupRepo;
  };
  auth: ReturnType<typeof createAuth>;
}

export function createFakeContext(
  override: Partial<Omit<AppContext, "repo">> & { repo?: Partial<AppContext["repo"]> } = {},
): AppContext {
  return {
    auth: createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] })),
    ...override,
    repo: {
      quest: createFakeQuestRepo({}),
      questGroup: createFakeQuestGroupRepo({}),
      ...override.repo,
    },
  };
}
