import type { Quest } from "./quest.ts";
import type { QuestGroup } from "./questGroup.ts";

export const TEST_QUEST_GROUP: QuestGroup = {
  id: "group-1",
  name: "Library Event 2026",
  description: "가을 도서관 행사",
};

export const ANOTHER_QUEST_GROUP: QuestGroup = {
  id: "group-2",
  name: "Bookstore Event 2026",
};

export const TEST_QUEST: Quest = {
  id: "quest-1",
  groupId: TEST_QUEST_GROUP.id,
  content: "헌법논증이론의 저자는 누구일까요?",
  image: { src: "https://example.com/cover.jpg", alt: "헌법논증이론 표지" },
  answer: "이민열, 김도균",
  alternatives: ["이한"],
  placeholder: "ㅇㅇㅇ, ㅁㅁㅁ",
  hint: "표지 안에 답이 있습니다",
  reward: {
    text: "정답입니다!",
    image: { src: "https://example.com/reward.jpg", alt: "보상" },
  },
};

export const ANOTHER_QUEST: Quest = {
  id: "quest-2",
  groupId: ANOTHER_QUEST_GROUP.id,
  content: "다른 문제",
  image: { src: "https://example.com/another-cover.jpg", alt: "다른 표지" },
  answer: "다른 정답",
  alternatives: [],
  placeholder: "다른 placeholder",
  hint: "다른 힌트",
  reward: { text: undefined, image: undefined },
};

// DB에 실제로 존재하는 group.id로 덮어써야 하는 경우가 많아 groupId를 포함한
// 오버라이드를 받는다 (repo.create()는 실제 FK가 걸린 groupId를 요구한다).
export function questInput(overrides: Partial<Omit<Quest, "id">> = {}): Omit<Quest, "id"> {
  const { id: _id, ...base } = TEST_QUEST;
  return { ...base, ...overrides };
}

export function questGroupInput(
  overrides: Partial<Omit<QuestGroup, "id">> = {},
): Omit<QuestGroup, "id"> {
  const { id: _id, ...base } = TEST_QUEST_GROUP;
  return { ...base, ...overrides };
}

export const TEST_ADMIN = {
  name: "Admin",
  email: "admin@example.com",
  password: "password1234",
};
