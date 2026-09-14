import { Elysia, status, t } from "elysia";

import { createGroup, deleteGroup, listGroups } from "../../application/questGroupService.ts";
import {
  createQuest,
  getQuestForDisplay,
  getQuestForEdit,
  listQuestsInGroup,
  submitAnswer,
  updateQuest,
} from "../../application/questService.ts";
import { presignUpload } from "../../application/uploadService.ts";
import { FileTooLargeError, NotExistError, UnsupportedFileTypeError } from "../../domain/errors.ts";
import type { AppContext } from "../context.ts";
import { createAuthGuard } from "./authGuard.ts";

const QuestGroupSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
});

const ImageSchema = t.Object({ src: t.String(), alt: t.String() });

const QuestSchema = t.Object({
  id: t.String(),
  groupId: t.String(),
  content: t.String(),
  image: ImageSchema,
  answer: t.String(),
  alternatives: t.Array(t.String()),
  placeholder: t.String(),
  hint: t.String(),
  reward: t.Object({
    text: t.Optional(t.String()),
    image: t.Optional(ImageSchema),
  }),
});

const QuestFieldsSchema = {
  content: t.String(),
  image: ImageSchema,
  answer: t.String(),
  placeholder: t.String(),
  hint: t.String(),
  rewardText: t.Optional(t.String()),
  rewardImage: t.Optional(ImageSchema),
};

export function createApp(ctx: AppContext) {
  return new Elysia({ prefix: "/api" })
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
    .get("/quests/:id", ({ params }) => getQuestForDisplay(ctx, params.id), {
      params: t.Object({ id: t.String() }),
      response: t.Object({
        content: t.String(),
        image: ImageSchema,
        placeholder: t.String(),
        hint: t.String(),
      }),
    })
    .post(
      "/quests/:id/submit-answer",
      ({ params, body }) => submitAnswer(ctx, params.id, body.answer),
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({ answer: t.String() }),
        response: t.Union([
          t.Object({ correct: t.Literal(false) }),
          t.Object({
            correct: t.Literal(true),
            reward: t.Object({
              text: t.Optional(t.String()),
              image: t.Optional(ImageSchema),
            }),
          }),
        ]),
      },
    )
    .get("/groups", () => listGroups(ctx), {
      auth: true,
      response: t.Array(QuestGroupSchema),
    })
    .post("/groups", ({ body }) => createGroup(ctx, body), {
      auth: true,
      body: t.Object({ name: t.String(), description: t.Optional(t.String()) }),
      response: QuestGroupSchema,
    })
    .get("/groups/:id/quests", ({ params }) => listQuestsInGroup(ctx, params.id), {
      auth: true,
      params: t.Object({ id: t.String() }),
      response: t.Array(
        t.Object({
          id: t.String(),
          content: t.String(),
          image: ImageSchema,
          answer: t.String(),
        }),
      ),
    })
    .delete(
      "/groups/:id",
      async ({ params }) => {
        await deleteGroup(ctx, params.id);
        return { deleted: true };
      },
      {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: t.Object({ deleted: t.Boolean() }),
      },
    )
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
    .post("/quests", ({ body }) => createQuest(ctx, body), {
      auth: true,
      body: t.Object({ groupId: t.String(), ...QuestFieldsSchema }),
      response: QuestSchema,
    })
    .get("/quests/:id/edit", ({ params }) => getQuestForEdit(ctx, params.id), {
      auth: true,
      params: t.Object({ id: t.String() }),
      response: QuestSchema,
    })
    .patch("/quests/:id", ({ params, body }) => updateQuest(ctx, params.id, body), {
      auth: true,
      params: t.Object({ id: t.String() }),
      body: t.Object(QuestFieldsSchema),
      response: QuestSchema,
    });
}

export type App = ReturnType<typeof createApp>;
