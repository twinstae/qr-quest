import type { Quest } from "../domain/quest.ts";
import type { QuestGroup } from "../domain/questGroup.ts";

export interface QuestRepo {
  getById(id: Quest["id"]): Promise<Quest | undefined>;
  create(input: Omit<Quest, "id">): Promise<Quest>;
  listByGroupId(groupId: Quest["groupId"]): Promise<Quest[]>;
}

export interface QuestGroupRepo {
  create(input: Omit<QuestGroup, "id">): Promise<QuestGroup>;
  list(): Promise<QuestGroup[]>;
}
