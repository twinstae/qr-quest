import { Elysia, status, t } from "elysia";

import {
  cloneCase,
  getStepForPreview,
  reorderSteps,
  startTestSession,
  updateCaseStatus,
} from "../../application/caseEditorService.ts";
import {
  createCase,
  deleteCase,
  getCaseByEntryToken,
  getCaseForEdit,
  listCases,
  updateCase,
} from "../../application/caseService.ts";
import { createStep, getStepForEdit, listSteps, updateStep } from "../../application/stepService.ts";
import { presignUpload } from "../../application/uploadService.ts";
import {
  FileTooLargeError,
  LiveReadinessError,
  NotExistError,
  UnsupportedFileTypeError,
} from "../../domain/errors.ts";
import type { AppContext } from "../context.ts";
import { createAuthGuard } from "./authGuard.ts";
import { createPlayRoutes } from "./playRoutes.ts";
import {
  CaseFieldsSchema,
  CaseSchema,
  LiveViolationSchema,
  StepFieldsSchema,
  StepKindSchema,
  StepPreviewSchema,
} from "./schemas.ts";

export function createApp(ctx: AppContext) {
  return (
    new Elysia({ prefix: "/api" })
      .mount(ctx.auth.handler)
      .use(createAuthGuard(ctx))
      .error({ NotExistError, FileTooLargeError, UnsupportedFileTypeError, LiveReadinessError })
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

        // LIVE 전환 거부 — 위반 목록을 그대로 화면에 보여준다.
        if (code === "LiveReadinessError") {
          return status(400, {
            code: "LIVE_NOT_READY",
            message: error.message,
            violations: error.violations,
          });
        }
      })
      // ── 참가자 ────────────────────────────────────────────────
      .use(createPlayRoutes(ctx))
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
      .post("/cases/:id/clone", ({ params }) => cloneCase(ctx, params.id), {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: CaseSchema,
      })
      .patch(
        "/cases/:id/status",
        ({ params, body }) => updateCaseStatus(ctx, params.id, body.status),
        {
          auth: true,
          params: t.Object({ id: t.String() }),
          body: t.Object({
            status: t.Union([
              t.Literal("DRAFT"),
              t.Literal("TEST"),
              t.Literal("LIVE"),
              t.Literal("CLOSED"),
            ]),
          }),
          response: {
            200: CaseSchema,
            400: t.Object({
              code: t.Literal("LIVE_NOT_READY"),
              message: t.String(),
              violations: t.Array(LiveViolationSchema),
            }),
          },
        },
      )
      .patch(
        "/cases/:id/steps/reorder",
        async ({ params, body }) => {
          const steps = await reorderSteps(ctx, params.id, body.orderedStepIds);
          return steps.map((step) => ({
            id: step.id,
            order: step.order,
            kind: step.kind,
            name: step.name,
            qrToken: step.qrToken,
            published: step.published,
            title: step.title,
            hasAnswer: step.answerSpec !== undefined,
          }));
        },
        {
          auth: true,
          params: t.Object({ id: t.String() }),
          body: t.Object({ orderedStepIds: t.Array(t.String()) }),
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
        },
      )
      .post("/cases/:id/test-session", ({ params }) => startTestSession(ctx, params.id), {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: t.Object({
          token: t.String(),
          caseId: t.String(),
          status: t.Union([t.Literal("IN_PROGRESS"), t.Literal("COMPLETED")]),
          currentStepOrder: t.Number(),
          completionCode: t.Optional(t.String()),
          resumed: t.Boolean(),
        }),
      })
      .get("/steps/:id/preview", ({ params }) => getStepForPreview(ctx, params.id), {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: StepPreviewSchema,
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
