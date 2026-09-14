import type { AppContext } from "../api/context.ts";
import type { QuestGroup } from "../domain/questGroup.ts";

export async function listGroups(ctx: AppContext): Promise<QuestGroup[]> {
  return ctx.repo.questGroup.list();
}

export async function createGroup(
  ctx: AppContext,
  input: Omit<QuestGroup, "id">,
): Promise<QuestGroup> {
  return ctx.repo.questGroup.create(input);
}

/**
 * 그룹에 속한 퀘스트를 먼저 지우고 그룹을 지운다.
 * 스키마의 FK는 RESTRICT라 자식부터 지워야 하고, 그룹을 지우면 퀘스트도 함께
 * 사라진다는 사실은 화면의 확인 다이얼로그에서 먼저 알린다.
 */
export async function deleteGroup(ctx: AppContext, id: string): Promise<void> {
  await ctx.repo.quest.deleteByGroupId(id);
  await ctx.repo.questGroup.delete(id);
}
