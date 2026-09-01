import { Elysia, status, t } from "elysia";

import { getQuestForDisplay, submitAnswer } from "../../application/questService.ts";
import { NotExistError } from "../../domain/errors.ts";
import type { AppContext } from "../context.ts";

export function createApp(ctx: AppContext) {
  return new Elysia({ prefix: "/api" })
    .mount(ctx.auth.handler)
    .error({ NotExistError })
    .onError(({ code }) => {
      if (code === "NotExistError") return status("Not Found");
    })
    .get("/quests/:id", ({ params }) => getQuestForDisplay(ctx, params.id), {
      params: t.Object({ id: t.String() }),
      response: t.Object({
        content: t.String(),
        image: t.Object({ src: t.String(), alt: t.String() }),
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
              image: t.Optional(t.Object({ src: t.String(), alt: t.String() })),
            }),
          }),
        ]),
      },
    );
}

export type App = ReturnType<typeof createApp>;
