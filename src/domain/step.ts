export type MediaKind = "image" | "video";

export type Media = {
  kind: MediaKind;
  src: string;
  alt: string;
};

export type Choice = {
  /** 인쇄물과 관리자 화면에서 쓰는 보기 기호. A, B, C, D. */
  id: string;
  label: string;
};

/**
 * 정답 유형 (요구 20). 관리자 화면은 이 유니온의 분기마다 편집 폼 하나씩만 갖는다.
 *
 * 퍼지 매칭(초성·유사어)은 하지 않는다 — 오탐이 나면 사장님이 통제할 수 없다.
 * 대신 정답을 여러 개 등록할 수 있게 해서 현실의 표기 차이를 흡수한다.
 */
export type AnswerSpec =
  | { type: "SINGLE_CHOICE"; choices: Choice[]; correctChoiceIds: string[] }
  | { type: "MULTI_CHOICE"; choices: Choice[]; correctChoiceIds: string[] }
  | { type: "SHORT_TEXT"; accepted: string[]; match: "EXACT" | "CONTAINS" }
  | { type: "NUMBER"; accepted: number[]; tolerance?: number }
  | { type: "KEYWORDS"; keywords: string[]; match: "ALL" | "ANY" };

/** 참가자가 제출하는 모양. 보기를 고르는 유형과 글자를 입력하는 유형으로 나뉜다. */
export type AnswerSubmission =
  | { type: "CHOICE"; choiceIds: string[] }
  | { type: "TEXT"; value: string };

/**
 * 참가자 화면에 내려보내도 되는 모양. 보기는 보여줘야 하지만
 * 정답(correctChoiceIds/accepted/keywords)은 절대 담지 않는다.
 */
export type PublicAnswerSpec =
  | { type: "SINGLE_CHOICE"; choices: Choice[] }
  | { type: "MULTI_CHOICE"; choices: Choice[] }
  | { type: "SHORT_TEXT" }
  | { type: "NUMBER" }
  | { type: "KEYWORDS" };

export function toPublicAnswerSpec(spec: AnswerSpec): PublicAnswerSpec {
  switch (spec.type) {
    case "SINGLE_CHOICE":
      return { type: "SINGLE_CHOICE", choices: spec.choices };
    case "MULTI_CHOICE":
      return { type: "MULTI_CHOICE", choices: spec.choices };
    case "SHORT_TEXT":
      return { type: "SHORT_TEXT" };
    case "NUMBER":
      return { type: "NUMBER" };
    case "KEYWORDS":
      return { type: "KEYWORDS" };
  }
}

export type RevealPreset =
  | "FADE_UP"
  | "UNROLL"
  | "TYPEWRITER"
  | "TV_SCAN"
  | "GLITCH"
  | "CARD_UNFOLD";

export type SoundKey = "paper" | "radio" | "chime";

export type StepKind = "INTRO" | "QR" | "FINAL" | "CLOSING";

export type Step = {
  id: string;
  caseId: string;
  /** CASE 안에서의 순서. 0부터 시작한다. */
  order: number;
  kind: StepKind;
  /** 관리자 화면과 인쇄 시트에 쓰는 이름. 예: "QR 02". */
  name: string;
  /** QR/FINAL 단계만 값을 가진다. URL = /t/{qrToken}. */
  qrToken: string | null;
  published: boolean;
  title: string;
  body: string;
  media?: Media;
  reveal: {
    text?: string;
    media?: Media;
    preset?: RevealPreset;
    sound?: SoundKey;
  };
  question?: string;
  answerSpec?: AnswerSpec;
  placeholder?: string;
  hint?: string;
  correctMessage?: string;
  wrongMessage?: string;
};

export const DEFAULT_CORRECT_MESSAGE = "정답입니다. 새로운 단서가 발견되었습니다.";
export const DEFAULT_WRONG_MESSAGE =
  "아직 사건의 핵심에 도달하지 못했어요. 문장을 다시 살펴보세요.";

export function resolveCorrectMessage(step: Pick<Step, "correctMessage">): string {
  return step.correctMessage?.trim() ? step.correctMessage : DEFAULT_CORRECT_MESSAGE;
}

export function resolveWrongMessage(step: Pick<Step, "wrongMessage">): string {
  return step.wrongMessage?.trim() ? step.wrongMessage : DEFAULT_WRONG_MESSAGE;
}

/**
 * 관리자 테스트 모드의 [정답 보기] 토글에만 쓴다 — 참가자에게는 절대 내려주지 않는다.
 */
export function describeAnswerForDebug(spec: AnswerSpec): string {
  switch (spec.type) {
    case "SINGLE_CHOICE":
    case "MULTI_CHOICE": {
      const correct = spec.choices.filter((choice) => spec.correctChoiceIds.includes(choice.id));
      return correct.map((choice) => `${choice.id}. ${choice.label}`).join(", ");
    }
    case "SHORT_TEXT":
      return spec.accepted.join(", ");
    case "NUMBER":
      return spec.accepted.join(", ");
    case "KEYWORDS":
      return spec.keywords.join(", ");
  }
}

/** QR을 찍어서 들어가는 단계인가. INTRO/CLOSING은 화면으로만 지나간다. */
export function requiresQrToken(kind: StepKind): boolean {
  return kind === "QR" || kind === "FINAL";
}

export function hasAnswer(step: Step): boolean {
  return step.answerSpec !== undefined && step.answerSpec !== null;
}

const PUNCTUATION = /[.,!?'"~…·、。()[\]{}<>《》「」『』:;/\\|^*+=_-]/g;

/** 대소문자·공백 차이만 흡수한다 (NFC 정규화 포함). */
export function normalizeText(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

/** 문장부호까지 흡수한다. 문장으로 답하는 단답형·키워드에 쓴다. */
export function normalizeLoose(value: string): string {
  return normalizeText(value).replace(PUNCTUATION, "");
}

function normalizeNumber(value: string): number | undefined {
  const cleaned = value.normalize("NFC").replaceAll(",", "").replace(/\s+/g, "");
  if (cleaned === "") return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sameSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

/**
 * 정답 판정. 순수 함수라 테스트가 가장 싸고, 유형이 늘어나도 여기만 고치면 된다.
 */
export function matchAnswer(spec: AnswerSpec, submission: AnswerSubmission): boolean {
  switch (spec.type) {
    case "SINGLE_CHOICE":
      if (submission.type !== "CHOICE") return false;
      return (
        submission.choiceIds.length === 1 &&
        spec.correctChoiceIds.includes(submission.choiceIds[0] ?? "")
      );
    case "MULTI_CHOICE":
      if (submission.type !== "CHOICE") return false;
      return sameSet(submission.choiceIds, spec.correctChoiceIds);
    case "SHORT_TEXT": {
      if (submission.type !== "TEXT") return false;
      const submitted = normalizeLoose(submission.value);
      if (submitted === "") return false;
      return spec.accepted.some((accepted) => {
        const expected = normalizeLoose(accepted);
        if (expected === "") return false;
        return spec.match === "EXACT" ? submitted === expected : submitted.includes(expected);
      });
    }
    case "NUMBER": {
      if (submission.type !== "TEXT") return false;
      const submitted = normalizeNumber(submission.value);
      if (submitted === undefined) return false;
      const tolerance = spec.tolerance ?? 0;
      return spec.accepted.some((accepted) => Math.abs(accepted - submitted) <= tolerance);
    }
    case "KEYWORDS": {
      if (submission.type !== "TEXT") return false;
      const submitted = normalizeLoose(submission.value);
      if (submitted === "") return false;
      const keywords = spec.keywords.map(normalizeLoose).filter((keyword) => keyword !== "");
      if (keywords.length === 0) return false;
      return spec.match === "ALL"
        ? keywords.every((keyword) => submitted.includes(keyword))
        : keywords.some((keyword) => submitted.includes(keyword));
    }
  }
}
