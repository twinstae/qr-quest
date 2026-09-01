import { Elysia, status, t } from "elysia";

import { createGroup, listGroups } from "../../application/questGroupService.ts";
import {
  createQuest,
  getQuestForDisplay,
  getQuestForEdit,
  listQuestsInGroup,
  submitAnswer,
  updateQuest,
} from "../../application/questService.ts";
import { presignUpload } from "../../application/uploadService.ts";
import { NotExistError } from "../../domain/errors.ts";
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
    .error({ NotExistError })
    .onError(({ code }) => {
      if (code === "NotExistError") return status("Not Found");
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
    .post("/uploads/presign", ({ body }) => presignUpload(ctx, body), {
      auth: true,
      body: t.Object({
        filename: t.String(),
        contentType: t.String({ pattern: "^image/" }),
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
