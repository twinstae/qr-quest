import { memoryAdapter } from "better-auth/adapters/memory";

import createFakeQuestRepo from "../persistence/FakeQuestRepo.ts";
import type { QuestRepo } from "../persistence/types.ts";
import { createAuth } from "./auth.ts";

export interface AppContext {
  repo: {
    quest: QuestRepo;
  };
  auth: ReturnType<typeof createAuth>;
}

export function createFakeContext(override: Partial<AppContext> = {}): AppContext {
  return {
    repo: {
      quest: createFakeQuestRepo({}),
    },
    auth: createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] })),
    ...override,
  };
}
