import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { createFakeContext } from "../context.ts";
import { createTestClient, signInAndGetCookie } from "../testHelpers.ts";
import { createAuthGuard } from "./authGuard.ts";

function appWithGuard(ctx: ReturnType<typeof createFakeContext>) {
  return new Elysia().use(createAuthGuard(ctx)).get("/protected", () => "ok", { auth: true });
}

describe("createAuthGuard", () => {
  it("세션이 없으면 401을 반환한다", async () => {
    const client = createTestClient(appWithGuard(createFakeContext()));

    const response = await client.get("/protected");

    expect(response.status).toBe(401);
  });

  it("유효한 세션이 있으면 통과한다", async () => {
    const ctx = createFakeContext();
    const cookie = await signInAndGetCookie(ctx);
    const client = createTestClient(appWithGuard(ctx), { cookie });

    const response = await client.get("/protected");

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
  });
});
