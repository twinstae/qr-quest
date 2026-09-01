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
