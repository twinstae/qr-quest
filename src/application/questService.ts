import type { AppContext } from "../api/context.ts";
import { NotExistError } from "../domain/errors.ts";
import { isCorrectAnswer, type Quest } from "../domain/quest.ts";

export type CreateQuestInput = {
  groupId: string;
  content: string;
  image: { src: string; alt: string };
  answer: string;
  placeholder: string;
  hint: string;
  rewardText?: string;
  rewardImage?: { src: string; alt: string };
};

export type UpdateQuestInput = Omit<CreateQuestInput, "groupId">;

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
  answer: string;
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
  return quests.map(({ id, content, image, answer }) => ({ id, content, image, answer }));
}

export async function createQuest(ctx: AppContext, input: CreateQuestInput): Promise<Quest> {
  return ctx.repo.quest.create({
    groupId: input.groupId,
    content: input.content,
    image: input.image,
    answer: input.answer,
    alternatives: [],
    placeholder: input.placeholder,
    hint: input.hint,
    reward: { text: input.rewardText, image: input.rewardImage },
  });
}

export async function getQuestForEdit(ctx: AppContext, id: string): Promise<Quest> {
  return getQuestOrThrow(ctx, id);
}

export async function updateQuest(
  ctx: AppContext,
  id: string,
  input: UpdateQuestInput,
): Promise<Quest> {
  await getQuestOrThrow(ctx, id);
  return ctx.repo.quest.update(id, {
    content: input.content,
    image: input.image,
    answer: input.answer,
    alternatives: [],
    placeholder: input.placeholder,
    hint: input.hint,
    reward: { text: input.rewardText, image: input.rewardImage },
  });
}
