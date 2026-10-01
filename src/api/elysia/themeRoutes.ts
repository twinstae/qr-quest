import { Elysia, t } from "elysia";

import {
  createTheme,
  deleteTheme,
  getTheme,
  getThemeForCase,
  listThemes,
  updateTheme,
} from "../../application/themeService.ts";
import type { AppContext } from "../context.ts";
import { ThemeFieldsSchema, ThemeSchema, ThemeWithUsageSchema } from "./schemas.ts";

/** 관리자는 테마를 관리하고, 참가자 화면은 CASE에 걸린 테마만 받는다 (ticket 18). */
export function createThemeRoutes(ctx: AppContext) {
  return (
    new Elysia({ name: "theme-routes" })
      // 테마가 없을 때도 같은 모양이 오도록 { theme } 으로 감싼다.
      .get(
        "/play/cases/:caseId/theme",
        async ({ params }) => ({ theme: await getThemeForCase(ctx, params.caseId) }),
        {
          params: t.Object({ caseId: t.String() }),
          response: t.Object({ theme: t.Nullable(ThemeSchema) }),
        },
      )
      .get("/themes", () => listThemes(ctx), {
        auth: true,
        response: t.Array(ThemeWithUsageSchema),
      })
      .post("/themes", ({ body }) => createTheme(ctx, body), {
        auth: true,
        body: t.Object(ThemeFieldsSchema),
        response: ThemeSchema,
      })
      .get("/themes/:id", ({ params }) => getTheme(ctx, params.id), {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: ThemeSchema,
      })
      .patch("/themes/:id", ({ params, body }) => updateTheme(ctx, params.id, body), {
        auth: true,
        params: t.Object({ id: t.String() }),
        body: t.Object(ThemeFieldsSchema),
        response: ThemeSchema,
      })
      .delete(
        "/themes/:id",
        async ({ params }) => {
          await deleteTheme(ctx, params.id);
          return { deleted: true };
        },
        {
          auth: true,
          params: t.Object({ id: t.String() }),
          response: t.Object({ deleted: t.Boolean() }),
        },
      )
  );
}
