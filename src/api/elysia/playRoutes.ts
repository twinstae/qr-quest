import { Elysia, status, t } from "elysia";

import {
  advanceNarrativeStep,
  getPlayProgress,
  getStepForPlay,
  requestHint,
  startOrResumeSession,
  submitAnswer,
  type LockedResult,
} from "../../application/playService.ts";
import type { AnswerSubmission } from "../../domain/step.ts";
import type { AppContext } from "../context.ts";
import { RevealSchema, StepDisplaySchema } from "./schemas.ts";

const CompletedSchema = t.Object({ kind: t.Literal("COMPLETED"), caseId: t.String() });
const LockedOnlySchema = t.Union([
  t.Object({ kind: t.Literal("NOT_STARTED"), caseId: t.String() }),
  t.Object({
    kind: t.Literal("LOCKED"),
    caseId: t.String(),
    currentStepOrder: t.Number(),
    requestedOrder: t.Number(),
    stepName: t.String(),
  }),
  t.Object({ kind: t.Literal("OTHER_CASE"), caseId: t.String(), sessionCaseId: t.String() }),
]);

/**
 * 참가 세션 토큰은 httpOnly 쿠키에 담는다. 여기서는 읽기만 한다 — 새로 쓰거나
 * 바꿀 때는 TanStack Start 쪽(loader/서버 함수)의 setCookie가 실제 응답에 반영한다.
 * (Eden treaty의 서버 사이드 in-process 호출은 이 인스턴스의 Set-Cookie를
 * 바깥 응답으로 그대로 흘려보내지 않기 때문이다.)
 */
export const PLAY_SESSION_COOKIE = "qr_play_session";

export function readSessionToken(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const prefix = `${PLAY_SESSION_COOKIE}=`;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return match?.slice(prefix.length) || undefined;
}

function toSubmission(body: { answer?: string; choiceIds?: string[] }): AnswerSubmission {
  if (body.choiceIds) return { type: "CHOICE", choiceIds: body.choiceIds };
  return { type: "TEXT", value: body.answer ?? "" };
}

/** LOCKED만 423, NOT_STARTED/OTHER_CASE는 서버 에러가 아닌 4xx, COMPLETED는 200으로 내려준다. */
function lockedResponse(result: LockedResult) {
  switch (result.kind) {
    case "LOCKED":
      return status(423, result);
    case "NOT_STARTED":
    case "OTHER_CASE":
      return status(409, result);
    case "COMPLETED":
      return result;
  }
}

export function createPlayRoutes(ctx: AppContext) {
  return new Elysia({ name: "play-routes" })
    .post(
      "/play/sessions",
      async ({ body, headers }) => {
        return startOrResumeSession(ctx, {
          entryToken: body.entryToken,
          existingToken: readSessionToken(headers.cookie),
        });
      },
      {
        body: t.Object({ entryToken: t.String() }),
        response: t.Object({
          token: t.String(),
          caseId: t.String(),
          status: t.Union([t.Literal("IN_PROGRESS"), t.Literal("COMPLETED")]),
          currentStepOrder: t.Number(),
          completionCode: t.Optional(t.String()),
          resumed: t.Boolean(),
        }),
      },
    )
    .get(
      "/play/steps/qr/:qrToken",
      async ({ params, headers }) => {
        const result = await getStepForPlay(ctx, {
          qrToken: params.qrToken,
          sessionToken: readSessionToken(headers.cookie),
        });
        return result.kind === "ALLOWED" ? result : lockedResponse(result);
      },
      {
        params: t.Object({ qrToken: t.String() }),
        response: {
          200: t.Union([
            t.Object({ kind: t.Literal("ALLOWED"), step: StepDisplaySchema }),
            CompletedSchema,
          ]),
          409: LockedOnlySchema,
          423: LockedOnlySchema,
        },
      },
    )
    .post(
      "/play/steps/:id/submit-answer",
      async ({ params, body, headers }) => {
        const result = await submitAnswer(ctx, {
          stepId: params.id,
          sessionToken: readSessionToken(headers.cookie),
          submission: toSubmission(body),
        });
        return result.kind === "INCORRECT" || result.kind === "CORRECT"
          ? result
          : lockedResponse(result);
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          answer: t.Optional(t.String()),
          choiceIds: t.Optional(t.Array(t.String())),
        }),
        response: {
          200: t.Union([
            t.Object({ kind: t.Literal("INCORRECT"), message: t.String() }),
            t.Object({
              kind: t.Literal("CORRECT"),
              reveal: RevealSchema,
              message: t.String(),
              completionCode: t.Optional(t.String()),
            }),
            CompletedSchema,
          ]),
          409: LockedOnlySchema,
          423: LockedOnlySchema,
        },
      },
    )
    .post(
      "/play/steps/:id/advance",
      async ({ params, headers }) => {
        const result = await advanceNarrativeStep(ctx, {
          stepId: params.id,
          sessionToken: readSessionToken(headers.cookie),
        });
        return result.kind === "ADVANCED" ? result : lockedResponse(result);
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: t.Union([t.Object({ kind: t.Literal("ADVANCED") }), CompletedSchema]),
          409: LockedOnlySchema,
          423: LockedOnlySchema,
        },
      },
    )
    .post(
      "/play/steps/:id/hint",
      async ({ params, headers }) => {
        const result = await requestHint(ctx, {
          stepId: params.id,
          sessionToken: readSessionToken(headers.cookie),
        });
        return result.kind === "HINT" ? result : lockedResponse(result);
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: t.Union([t.Object({ kind: t.Literal("HINT"), hint: t.Optional(t.String()) }), CompletedSchema]),
          409: LockedOnlySchema,
          423: LockedOnlySchema,
        },
      },
    )
    .get(
      "/play/cases/:caseId/progress",
      async ({ params, headers }) => {
        return getPlayProgress(ctx, {
          caseId: params.caseId,
          sessionToken: readSessionToken(headers.cookie),
        });
      },
      {
        params: t.Object({ caseId: t.String() }),
        response: t.Union([
          t.Object({ kind: t.Literal("NOT_STARTED") }),
          t.Object({ kind: t.Literal("OTHER_CASE") }),
          t.Object({
            kind: t.Literal("COMPLETED"),
            completionCode: t.Optional(t.String()),
            closing: t.Optional(StepDisplaySchema),
          }),
          t.Object({ kind: t.Literal("NARRATIVE"), step: StepDisplaySchema }),
          t.Object({
            kind: t.Literal("WAITING"),
            stepName: t.String(),
            resolved: t.Number(),
            total: t.Number(),
          }),
        ]),
      },
    );
}
