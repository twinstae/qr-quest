import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { ANOTHER_QUEST_GROUP, TEST_QUEST, TEST_QUEST_GROUP } from "../domain/fixtures.ts";
import createFakeQuestGroupRepo from "../persistence/FakeQuestGroupRepo.ts";
import createFakeQuestRepo from "../persistence/FakeQuestRepo.ts";
import { deleteGroup } from "./questGroupService.ts";

function contextWithGroups() {
  return createFakeContext({
    repo: {
      questGroup: createFakeQuestGroupRepo({
        [TEST_QUEST_GROUP.id]: TEST_QUEST_GROUP,
        [ANOTHER_QUEST_GROUP.id]: ANOTHER_QUEST_GROUP,
      }),
      quest: createFakeQuestRepo({
        [TEST_QUEST.id]: TEST_QUEST,
        "quest-in-another-group": {
          ...TEST_QUEST,
          id: "quest-in-another-group",
          groupId: ANOTHER_QUEST_GROUP.id,
        },
      }),
    },
  });
}

describe("deleteGroup", () => {
  it("그룹과 그 그룹의 퀘스트를 함께 지운다", async () => {
    const ctx = contextWithGroups();

    await deleteGroup(ctx, TEST_QUEST_GROUP.id);

    expect(await ctx.repo.questGroup.list()).toEqual([ANOTHER_QUEST_GROUP]);
    expect(await ctx.repo.quest.listByGroupId(TEST_QUEST_GROUP.id)).toEqual([]);
  });

  it("다른 그룹의 퀘스트는 남겨둔다", async () => {
    const ctx = contextWithGroups();

    await deleteGroup(ctx, TEST_QUEST_GROUP.id);

    expect(await ctx.repo.quest.listByGroupId(ANOTHER_QUEST_GROUP.id)).toHaveLength(1);
  });

  it("퀘스트가 없는 그룹도 지울 수 있다", async () => {
    const ctx = contextWithGroups();

    await deleteGroup(ctx, ANOTHER_QUEST_GROUP.id);
    await deleteGroup(ctx, ANOTHER_QUEST_GROUP.id);

    expect(await ctx.repo.questGroup.list()).toEqual([TEST_QUEST_GROUP]);
  });
});
