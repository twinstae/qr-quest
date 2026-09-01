import type { AppContext } from "../api/context.ts";
import { NotExistError } from "../domain/errors.ts";
import { isCorrectAnswer } from "../domain/quest.ts";

export type QuestDisplay = {
  content: string;
  image: { src: string; alt: string };
  placeholder: string;
  hint: string;
};

export type SubmitAnswerResult =
  | { correct: false }
  | { correct: true; reward: { text?: string; image?: { src: string; alt: string } } };

export type QuestSummary = {
  id: string;
  content: string;
  image: { src: string; alt: string };
};

async function getQuestOrThrow(ctx: AppContext, id: string) {
  const quest = await ctx.repo.quest.getById(id);
  if (!quest) throw new NotExistError(`Quest id=${id} not found`);
  return quest;
}

export async function getQuestForDisplay(ctx: AppContext, id: string): Promise<QuestDisplay> {
  const quest = await getQuestOrThrow(ctx, id);
  return {
    content: quest.content,
    image: quest.image,
    placeholder: quest.placeholder,
    hint: quest.hint,
  };
}

export async function submitAnswer(
  ctx: AppContext,
  id: string,
  answer: string,
): Promise<SubmitAnswerResult> {
  const quest = await getQuestOrThrow(ctx, id);
  if (!isCorrectAnswer(quest, answer)) return { correct: false };
  return { correct: true, reward: quest.reward };
}

export async function listQuestsInGroup(ctx: AppContext, groupId: string): Promise<QuestSummary[]> {
  const quests = await ctx.repo.quest.listByGroupId(groupId);
  return quests.map(({ id, content, image }) => ({ id, content, image }));
}
