import { betterAuth, type BetterAuthOptions } from "better-auth";

export function createAuth(database: BetterAuthOptions["database"]) {
  return betterAuth({
    database,
    // Elysia's .mount() forwards the full original request path unchanged (it does
    // not strip the enclosing prefix), so basePath must match the real mounted path.
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
    },
  });
}
