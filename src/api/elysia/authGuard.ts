import { Elysia } from "elysia";

import type { AppContext } from "../context.ts";

export function createAuthGuard(ctx: AppContext) {
  return new Elysia({ name: "auth-guard" }).macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await ctx.auth.api.getSession({ headers });
        if (!session) return status(401);
        return { user: session.user, session: session.session };
      },
    },
  });
}
