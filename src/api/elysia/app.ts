import { Elysia, status, t } from "elysia";

import {
  createCase,
  deleteCase,
  getCaseByEntryToken,
  getCaseForEdit,
  listCases,
  updateCase,
} from "../../application/caseService.ts";
import {
  createStep,
  getStepForDisplay,
  getStepForEdit,
  listSteps,
  submitStepAnswer,
  updateStep,
} from "../../application/stepService.ts";
import { presignUpload } from "../../application/uploadService.ts";
import { FileTooLargeError, NotExistError, UnsupportedFileTypeError } from "../../domain/errors.ts";
import type { AnswerSubmission } from "../../domain/step.ts";
import type { AppContext } from "../context.ts";
import { createAuthGuard } from "./authGuard.ts";

const MediaSchema = t.Object({
  kind: t.Union([t.Literal("image"), t.Literal("video")]),
  src: t.String(),
  alt: t.String(),
});

const ChoiceSchema = t.Object({ id: t.String(), label: t.String() });

const AnswerSpecSchema = t.Union([
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
const PublicAnswerSpecSchema = t.Union([
  t.Object({ type: t.Literal("SINGLE_CHOICE"), choices: t.Array(ChoiceSchema) }),
  t.Object({ type: t.Literal("MULTI_CHOICE"), choices: t.Array(ChoiceSchema) }),
  t.Object({ type: t.Literal("SHORT_TEXT") }),
  t.Object({ type: t.Literal("NUMBER") }),
  t.Object({ type: t.Literal("KEYWORDS") }),
]);

const StepKindSchema = t.Union([
  t.Literal("INTRO"),
  t.Literal("QR"),
  t.Literal("FINAL"),
  t.Literal("CLOSING"),
]);

const CaseSchema = t.Object({
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

const CaseFieldsSchema = {
  number: t.Number(),
  title: t.String(),
  teaser: t.String(),
  intro: t.String(),
  estimatedMinutes: t.Optional(t.Number()),
  thumbnail: t.Optional(MediaSchema),
  finalBookTitle: t.Optional(t.String()),
  rewardNote: t.Optional(t.String()),
};

const RevealSchema = t.Object({
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

const StepFieldsSchema = {
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
};

function toSubmission(body: { answer?: string; choiceIds?: string[] }): AnswerSubmission {
  if (body.choiceIds) return { type: "CHOICE", choiceIds: body.choiceIds };
  return { type: "TEXT", value: body.answer ?? "" };
}

export function createApp(ctx: AppContext) {
  return (
    new Elysia({ prefix: "/api" })
      .mount(ctx.auth.handler)
      .use(createAuthGuard(ctx))
      .error({ NotExistError, FileTooLargeError, UnsupportedFileTypeError })
      .onError(({ code, error }) => {
        if (code === "NotExistError") return status("Not Found");

        // 업로드 실패는 화면에서 그대로 보여줄 수 있게 숫자를 함께 내려준다.
        // ("5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요.")
        if (code === "FileTooLargeError") {
          return status(413, {
            code: "FILE_TOO_LARGE",
            message: error.message,
            limitBytes: error.limitBytes,
            actualBytes: error.actualBytes,
          });
        }

        if (code === "UnsupportedFileTypeError") {
          return status(415, {
            code: "UNSUPPORTED_FILE_TYPE",
            message: error.message,
            allowedTypes: [...error.allowedTypes],
          });
        }
      })
      // ── 참가자 ────────────────────────────────────────────────
      .get("/steps/qr/:qrToken", ({ params }) => getStepForDisplay(ctx, params.qrToken), {
        params: t.Object({ qrToken: t.String() }),
        response: t.Object({
          id: t.String(),
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
        }),
      })
      .post(
        "/steps/:id/submit-answer",
        ({ params, body }) => submitStepAnswer(ctx, params.id, toSubmission(body)),
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            answer: t.Optional(t.String()),
            choiceIds: t.Optional(t.Array(t.String())),
          }),
          response: t.Union([
            t.Object({ correct: t.Literal(false) }),
            t.Object({ correct: t.Literal(true), reveal: RevealSchema }),
          ]),
        },
      )
      .get(
        "/cases/by-entry/:entryToken",
        ({ params }) => getCaseByEntryToken(ctx, params.entryToken),
        {
          params: t.Object({ entryToken: t.String() }),
          response: CaseSchema,
        },
      )
      // ── 관리자 ────────────────────────────────────────────────
      .get("/cases", () => listCases(ctx), {
        auth: true,
        response: t.Array(CaseSchema),
      })
      .post("/cases", ({ body }) => createCase(ctx, body), {
        auth: true,
        body: t.Object(CaseFieldsSchema),
        response: CaseSchema,
      })
      .get("/cases/:id", ({ params }) => getCaseForEdit(ctx, params.id), {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: CaseSchema,
      })
      .patch("/cases/:id", ({ params, body }) => updateCase(ctx, params.id, body), {
        auth: true,
        params: t.Object({ id: t.String() }),
        body: t.Object(CaseFieldsSchema),
        response: CaseSchema,
      })
      .delete(
        "/cases/:id",
        async ({ params }) => {
          await deleteCase(ctx, params.id);
          return { deleted: true };
        },
        {
          auth: true,
          params: t.Object({ id: t.String() }),
          response: t.Object({ deleted: t.Boolean() }),
        },
      )
      .get("/cases/:id/steps", ({ params }) => listSteps(ctx, params.id), {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: t.Array(
          t.Object({
            id: t.String(),
            order: t.Number(),
            kind: StepKindSchema,
            name: t.String(),
            qrToken: t.Union([t.String(), t.Null()]),
            published: t.Boolean(),
            title: t.String(),
            hasAnswer: t.Boolean(),
          }),
        ),
      })
      .post("/cases/:id/steps", ({ params, body }) => createStep(ctx, params.id, body), {
        auth: true,
        params: t.Object({ id: t.String() }),
        body: t.Object(StepFieldsSchema),
        response: t.Object({
          id: t.String(),
          caseId: t.String(),
          order: t.Number(),
          name: t.String(),
          qrToken: t.Union([t.String(), t.Null()]),
        }),
      })
      .get("/steps/:id/edit", ({ params }) => getStepForEdit(ctx, params.id), {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: t.Object({
          id: t.String(),
          caseId: t.String(),
          order: t.Number(),
          ...StepFieldsSchema,
        }),
      })
      .patch("/steps/:id", ({ params, body }) => updateStep(ctx, params.id, body), {
        auth: true,
        params: t.Object({ id: t.String() }),
        body: t.Object(StepFieldsSchema),
        response: t.Object({
          id: t.String(),
          caseId: t.String(),
          order: t.Number(),
          ...StepFieldsSchema,
        }),
      })
      .post("/uploads/presign", ({ body }) => presignUpload(ctx, body), {
        auth: true,
        // 형식/용량 판단은 도메인(upload.ts)이 단독으로 한다 — 스키마에서 먼저
        // 거르면 어떤 형식이 허용되는지 설명할 수 없는 400이 나간다.
        body: t.Object({
          filename: t.String(),
          contentType: t.String(),
          byteSize: t.Number({ minimum: 0 }),
        }),
        response: t.Object({ uploadUrl: t.String(), publicUrl: t.String() }),
      })
  );
}

export type App = ReturnType<typeof createApp>;
