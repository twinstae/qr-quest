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
import {
  mergeSessionTokens,
  readSessionTokens,
  sessionCookieHeader,
} from "../../lib/play-session-cookie.ts";
import { RevealSchema, StepDisplaySchema } from "./schemas.ts";

// 참가 세션 쿠키 이름/병합 규칙은 한 기기에서 여러 CASE를 동시에 이어서 하기 때문에
// src/lib/play-session-cookie.ts 한 곳에서 정의하고 여기서는 가져다 쓴다.
export { PLAY_SESSION_COOKIE, sessionCookieHeader } from "../../lib/play-session-cookie.ts";

const CompletedSchema = t.Object({ kind: t.Literal("COMPLETED"), caseId: t.String() });
const LockedOnlySchema = t.Union([
  t.Object({ kind: t.Literal("NOT_STARTED"), caseId: t.String(), message: t.String() }),
  t.Object({
    kind: t.Literal("LOCKED"),
    caseId: t.String(),
    currentStepOrder: t.Number(),
    requestedOrder: t.Number(),
    stepName: t.String(),
    message: t.String(),
  }),
]);

const StampSchema = t.Object({
  stepId: t.String(),
  name: t.String(),
  solved: t.Boolean(),
});

/**
 * 참가 세션 토큰은 httpOnly 쿠키에 담는다. 여기서는 읽기만 하고 — 새로 쓰거나
 * 바꿀 때는 TanStack Start 쪽(loader/서버 함수)의 setCookie가 실제 응답에 반영한다.
 * (Eden treaty의 서버 사이드 in-process 호출은 이 인스턴스의 Set-Cookie를
 * 바깥 응답으로 그대로 흘려보내지 않기 때문이다.)
 *
 * 쿠키 하나에 CASE마다 세션 토큰이 여러 개 들어 있다 — 여러 CASE를 동시에 진행하게.
 */

function toSubmission(body: { answer?: string; choiceIds?: string[] }): AnswerSubmission {
  if (body.choiceIds) return { type: "CHOICE", choiceIds: body.choiceIds };
  return { type: "TEXT", value: body.answer ?? "" };
}

/** LOCKED만 423, NOT_STARTED는 서버 에러가 아닌 4xx, COMPLETED는 200으로 내려준다. */
function lockedResponse(result: LockedResult) {
  switch (result.kind) {
    case "LOCKED":
      return status(423, result);
    case "NOT_STARTED":
      return status(409, result);
    case "COMPLETED":
      return result;
  }
}

export function createPlayRoutes(ctx: AppContext) {
  return new Elysia({ name: "play-routes" })
    .post(
      "/play/sessions",
      async ({ body, headers, set }) => {
        const existingTokens = readSessionTokens(headers.cookie);
        const result = await startOrResumeSession(ctx, {
          entryToken: body.entryToken,
          existingTokens,
        });
        // SPA라 시작 화면의 loader가 브라우저에서 이 API를 직접 부른다 — 여기서 쿠키를 줘야
        // 다음 단계 요청에 세션이 실린다. (서버 실행 경로는 play-session.ts의 setCookie가 맡는다.)
        // 다른 CASE 세션 토큰은 남겨 두어야 여러 CASE를 동시에 이어서 할 수 있다.
        set.headers["set-cookie"] = sessionCookieHeader(
          mergeSessionTokens(existingTokens, result.token),
        );
        return result;
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
          sessionTokens: readSessionTokens(headers.cookie),
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
          sessionTokens: readSessionTokens(headers.cookie),
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
          sessionTokens: readSessionTokens(headers.cookie),
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
          sessionTokens: readSessionTokens(headers.cookie),
        });
        return result.kind === "HINT" ? result : lockedResponse(result);
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: t.Union([
            t.Object({ kind: t.Literal("HINT"), hint: t.Optional(t.String()) }),
            CompletedSchema,
          ]),
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
          sessionTokens: readSessionTokens(headers.cookie),
        });
      },
      {
        params: t.Object({ caseId: t.String() }),
        response: t.Union([
          t.Object({ kind: t.Literal("NOT_STARTED"), message: t.String() }),
          t.Object({
            kind: t.Literal("COMPLETED"),
            completionCode: t.Optional(t.String()),
            elapsedMinutes: t.Optional(t.Number()),
            hintCount: t.Number(),
            closing: t.Optional(StepDisplaySchema),
          }),
          t.Object({ kind: t.Literal("NARRATIVE"), step: StepDisplaySchema }),
          t.Object({
            kind: t.Literal("WAITING"),
            stepName: t.String(),
            // true면 남은 문제 QR을 아무 순서로나 찍으면 된다(자유 진행).
            anyOrder: t.Boolean(),
            // 스탬프판 동그라미 칸 — 푼 문제에만 도장이 찍혀 있다.
            stamps: t.Array(StampSchema),
          }),
        ]),
      },
    );
}
