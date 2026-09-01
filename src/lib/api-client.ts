import { treaty } from "@elysiajs/eden";
import { createIsomorphicFn } from "@tanstack/react-start";

import { app, type App } from "@/api/elysia/index.ts";

export const getApiClient = createIsomorphicFn()
  .server(() => treaty(app).api)
  .client(() => treaty<App>(window.location.origin).api);
