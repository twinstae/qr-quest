export type Quest = {
  id: string;
  groupId: string;
  content: string;
  image: { src: string; alt: string };
  answer: string;
  alternatives: string[];
  placeholder: string;
  hint: string;
  reward: {
    text?: string;
    image?: { src: string; alt: string };
  };
};

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

// alternatives 매칭은 아직 미구현 (ticket 03에서 의도적으로 보류, answer만 비교)
export function isCorrectAnswer(quest: Quest, submitted: string): boolean {
  return normalizeAnswer(submitted) === normalizeAnswer(quest.answer);
}
