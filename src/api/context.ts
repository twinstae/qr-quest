import { memoryAdapter } from "better-auth/adapters/memory";

import createFakeImageStorage from "../persistence/FakeImageStorage.ts";
import createFakeQuestGroupRepo from "../persistence/FakeQuestGroupRepo.ts";
import createFakeQuestRepo from "../persistence/FakeQuestRepo.ts";
import type { ImageStorage, QuestGroupRepo, QuestRepo } from "../persistence/types.ts";
import { createAuth } from "./auth.ts";

export interface AppContext {
  repo: {
    quest: QuestRepo;
    questGroup: QuestGroupRepo;
  };
  auth: ReturnType<typeof createAuth>;
  imageStorage: ImageStorage;
}

export function createFakeContext(
  override: Partial<Omit<AppContext, "repo">> & { repo?: Partial<AppContext["repo"]> } = {},
): AppContext {
  return {
    auth: createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] })),
    imageStorage: createFakeImageStorage(),
    ...override,
    repo: {
      quest: createFakeQuestRepo({}),
      questGroup: createFakeQuestGroupRepo({}),
      ...override.repo,
    },
  };
}
