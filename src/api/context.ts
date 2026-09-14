import { memoryAdapter } from "better-auth/adapters/memory";

import { DEFAULT_MAX_IMAGE_BYTES } from "../domain/upload.ts";
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
  // 실제 배포에서는 환경변수로 정하고, 애플리케이션 계층은 컨텍스트만 본다.
  uploadLimits: { maxImageBytes: number };
}

export function createFakeContext(
  override: Partial<Omit<AppContext, "repo">> & { repo?: Partial<AppContext["repo"]> } = {},
): AppContext {
  return {
    auth: createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] })),
    imageStorage: createFakeImageStorage(),
    uploadLimits: { maxImageBytes: DEFAULT_MAX_IMAGE_BYTES },
    ...override,
    repo: {
      quest: createFakeQuestRepo({}),
      questGroup: createFakeQuestGroupRepo({}),
      ...override.repo,
    },
  };
}
