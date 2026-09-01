import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createAuthClient } from "better-auth/react";

import { auth } from "@/api/elysia/index.ts";

export const authClient = createAuthClient({
  basePath: "/api/auth",
});

// authClient.getSession() does a relative fetch("/api/auth/get-session"), which
// fails server-side (no implicit origin to resolve a relative URL against). Server
// side, call better-auth's server API directly against the real request's headers
// instead of round-tripping through HTTP.
export const getCurrentSession = createIsomorphicFn()
  .server(() => auth.api.getSession({ headers: getRequest().headers }))
  .client(() => authClient.getSession().then((res) => res.data));
