import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { createFakeContext } from "../context.ts";
import { createAuthGuard } from "./authGuard.ts";

function appWithGuard(ctx: ReturnType<typeof createFakeContext>) {
  return new Elysia().use(createAuthGuard(ctx)).get("/protected", () => "ok", { auth: true });
}

async function signInAndGetCookie(ctx: ReturnType<typeof createFakeContext>) {
  await ctx.auth.api.signUpEmail({
    body: { name: "Admin", email: "admin@example.com", password: "password1234" },
  });
  const response = await ctx.auth.api.signInEmail({
    body: { email: "admin@example.com", password: "password1234" },
    asResponse: true,
  });
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("no set-cookie header returned from sign-in");
  return cookie.split(";")[0];
}

describe("createAuthGuard", () => {
  it("세션이 없으면 401을 반환한다", async () => {
    const ctx = createFakeContext();
    const app = appWithGuard(ctx);

    const response = await app.handle(new Request("http://localhost/protected"));

    expect(response.status).toBe(401);
  });

  it("유효한 세션이 있으면 통과한다", async () => {
    const ctx = createFakeContext();
    const cookie = await signInAndGetCookie(ctx);
    const app = appWithGuard(ctx);

    const response = await app.handle(
      new Request("http://localhost/protected", { headers: { cookie } }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
  });
});
