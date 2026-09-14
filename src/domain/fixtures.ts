import type { Case } from "./case.ts";
import type { Step } from "./step.ts";

export const TEST_CASE: Case = {
  id: "case-1",
  number: 1,
  title: "사라진 책의 행방",
  teaser: "책방 안에 남겨진 단서를 찾아주세요.",
  intro: "책방지기가 아침에 아끼던 책 한 권이 사라진 것을 발견했습니다.",
  estimatedMinutes: 20,
  status: "DRAFT",
  entryToken: "ENTRYTOKEN",
  finalBookTitle: "헌법논증이론",
  rewardNote: "기념 엽서",
};

export const ANOTHER_CASE: Case = {
  ...TEST_CASE,
  id: "case-2",
  number: 2,
  title: "다른 사건",
  entryToken: "ENTRYTOKEN2",
};

export const TEST_STEP: Step = {
  id: "step-1",
  caseId: TEST_CASE.id,
  order: 2,
  kind: "QR",
  name: "QR 02",
  qrToken: "QRTOKEN002",
  published: true,
  title: "헌법논증이론의 저자는 누구일까요?",
  body: "서가 두 번째 칸을 살펴보세요.",
  media: { kind: "image", src: "https://example.com/cover.jpg", alt: "헌법논증이론 표지" },
  reveal: {
    text: "새로운 단서가 발견되었습니다.",
    media: { kind: "image", src: "https://example.com/clue.jpg", alt: "단서" },
  },
  question: "저자의 이름은?",
  answerSpec: { type: "SHORT_TEXT", accepted: ["이민열, 김도균"], match: "EXACT" },
  placeholder: "ㅇㅇㅇ, ㅁㅁㅁ",
  hint: "표지 안에 답이 있습니다",
};

export const ANOTHER_STEP: Step = {
  ...TEST_STEP,
  id: "step-2",
  caseId: ANOTHER_CASE.id,
  order: 0,
  name: "QR 01",
  qrToken: "QRTOKEN00A",
  title: "다른 문제",
  answerSpec: { type: "SHORT_TEXT", accepted: ["다른 정답"], match: "EXACT" },
};

export function caseInput(overrides: Partial<Omit<Case, "id">> = {}): Omit<Case, "id"> {
  const { id: _id, ...base } = TEST_CASE;
  return { ...base, ...overrides };
}

export function stepInput(overrides: Partial<Omit<Step, "id">> = {}): Omit<Step, "id"> {
  const { id: _id, ...base } = TEST_STEP;
  return { ...base, ...overrides };
}

export const TEST_ADMIN = {
  name: "Admin",
  email: "admin@example.com",
  password: "password1234",
};
