import { t } from "elysia";

// 관리자·참가자 라우트가 함께 쓰는 스키마. 한 곳에서만 고치면 요청/응답이 같이 맞는다.

export const MediaSchema = t.Object({
  kind: t.Union([t.Literal("image"), t.Literal("video")]),
  src: t.String(),
  alt: t.String(),
});

export const ChoiceSchema = t.Object({ id: t.String(), label: t.String() });

export const AnswerSpecSchema = t.Union([
  t.Object({
    type: t.Literal("SINGLE_CHOICE"),
    choices: t.Array(ChoiceSchema),
    correctChoiceIds: t.Array(t.String()),
  }),
  t.Object({
    type: t.Literal("MULTI_CHOICE"),
    choices: t.Array(ChoiceSchema),
    correctChoiceIds: t.Array(t.String()),
  }),
  t.Object({
    type: t.Literal("SHORT_TEXT"),
    accepted: t.Array(t.String()),
    match: t.Union([t.Literal("EXACT"), t.Literal("CONTAINS")]),
  }),
  t.Object({
    type: t.Literal("NUMBER"),
    accepted: t.Array(t.Number()),
    tolerance: t.Optional(t.Number()),
  }),
  t.Object({
    type: t.Literal("KEYWORDS"),
    keywords: t.Array(t.String()),
    match: t.Union([t.Literal("ALL"), t.Literal("ANY")]),
  }),
]);

// 참가자에게는 정답 없는 모양만 나간다.
export const PublicAnswerSpecSchema = t.Union([
  t.Object({ type: t.Literal("SINGLE_CHOICE"), choices: t.Array(ChoiceSchema) }),
  t.Object({ type: t.Literal("MULTI_CHOICE"), choices: t.Array(ChoiceSchema) }),
  t.Object({ type: t.Literal("SHORT_TEXT") }),
  t.Object({ type: t.Literal("NUMBER") }),
  t.Object({ type: t.Literal("KEYWORDS") }),
]);

export const StepKindSchema = t.Union([
  t.Literal("INTRO"),
  t.Literal("QR"),
  t.Literal("FINAL"),
  t.Literal("CLOSING"),
]);

export const CaseSchema = t.Object({
  id: t.String(),
  number: t.Number(),
  title: t.String(),
  teaser: t.String(),
  intro: t.String(),
  thumbnail: t.Optional(MediaSchema),
  estimatedMinutes: t.Number(),
  status: t.Union([t.Literal("DRAFT"), t.Literal("TEST"), t.Literal("LIVE"), t.Literal("CLOSED")]),
  entryToken: t.String(),
  finalBookTitle: t.Optional(t.String()),
  rewardNote: t.Optional(t.String()),
});

export const CaseFieldsSchema = {
  number: t.Number(),
  title: t.String(),
  teaser: t.String(),
  intro: t.String(),
  estimatedMinutes: t.Optional(t.Number()),
  thumbnail: t.Optional(MediaSchema),
  finalBookTitle: t.Optional(t.String()),
  rewardNote: t.Optional(t.String()),
};

export const RevealSchema = t.Object({
  text: t.Optional(t.String()),
  media: t.Optional(MediaSchema),
  preset: t.Optional(
    t.Union([
      t.Literal("FADE_UP"),
      t.Literal("UNROLL"),
      t.Literal("TYPEWRITER"),
      t.Literal("TV_SCAN"),
      t.Literal("GLITCH"),
    ]),
  ),
  sound: t.Optional(t.Union([t.Literal("paper"), t.Literal("radio"), t.Literal("chime")])),
});

export const StepFieldsSchema = {
  name: t.String(),
  kind: StepKindSchema,
  title: t.String(),
  body: t.String(),
  media: t.Optional(MediaSchema),
  reveal: RevealSchema,
  question: t.Optional(t.String()),
  answerSpec: t.Optional(AnswerSpecSchema),
  placeholder: t.Optional(t.String()),
  hint: t.Optional(t.String()),
  correctMessage: t.Optional(t.String()),
  wrongMessage: t.Optional(t.String()),
};

export const StepDisplaySchema = t.Object({
  id: t.String(),
  caseId: t.String(),
  name: t.String(),
  kind: StepKindSchema,
  order: t.Number(),
  title: t.String(),
  body: t.String(),
  media: t.Optional(MediaSchema),
  question: t.Optional(t.String()),
  answerSpec: t.Optional(PublicAnswerSpecSchema),
  placeholder: t.Optional(t.String()),
  // 힌트 글자는 절대 담지 않는다 — 있는지 여부만 알려주고, 실제 글자는 힌트 엔드포인트로만 받는다.
  hasHint: t.Boolean(),
});

// 미리보기는 관리자 전용이라 힌트 글자를 그대로 보여준다(정답 자체는 여전히 감춘다).
export const StepPreviewSchema = t.Object({
  id: t.String(),
  caseId: t.String(),
  name: t.String(),
  kind: StepKindSchema,
  order: t.Number(),
  title: t.String(),
  body: t.String(),
  media: t.Optional(MediaSchema),
  question: t.Optional(t.String()),
  answerSpec: t.Optional(PublicAnswerSpecSchema),
  placeholder: t.Optional(t.String()),
  hint: t.Optional(t.String()),
});

export const LiveViolationSchema = t.Union([
  t.Object({ kind: t.Literal("ORDER_GAP") }),
  t.Object({ kind: t.Literal("MISSING_CLOSING") }),
  t.Object({ kind: t.Literal("MISSING_INTRO_BODY") }),
  t.Object({ kind: t.Literal("MISSING_ANSWER"), stepId: t.String(), stepName: t.String() }),
  t.Object({ kind: t.Literal("MISSING_QR_TOKEN"), stepId: t.String(), stepName: t.String() }),
]);

export const QrCheckResultSchema = t.Union([
  t.Object({ kind: t.Literal("READY"), label: t.String(), title: t.String() }),
  t.Object({ kind: t.Literal("OTHER_CASE"), caseNumber: t.Number() }),
  t.Object({ kind: t.Literal("UNKNOWN") }),
]);

