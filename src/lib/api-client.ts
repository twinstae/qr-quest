import { treaty } from "@elysiajs/eden";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { app, type App } from "@/api/elysia/index.ts";

export const getApiClient = createIsomorphicFn()
  // treaty(app) calls the Elysia instance in-process (no real HTTP fetch), so the
  // current request's cookies aren't forwarded automatically the way a browser
  // fetch would — forward them explicitly so auth-guarded endpoints work in loaders.
  .server(() => treaty(app, { headers: () => getRequestHeaders() }).api)
  .client(() => treaty<App>(window.location.origin).api);
