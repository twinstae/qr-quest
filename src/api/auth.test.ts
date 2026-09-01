import { memoryAdapter } from "better-auth/adapters/memory";
import { describe, expect, it } from "vitest";

import { createAuth } from "./auth.ts";

function createTestAuth() {
  return createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] }));
}

describe("createAuth", () => {
  it("가입한 이메일/비밀번호로 로그인할 수 있다", async () => {
    const auth = createTestAuth();

    await auth.api.signUpEmail({
      body: { name: "Admin", email: "admin@example.com", password: "password1234" },
    });

    const signIn = await auth.api.signInEmail({
      body: { email: "admin@example.com", password: "password1234" },
    });

    expect(signIn.user.email).toBe("admin@example.com");
  });

  it("잘못된 비밀번호로는 로그인할 수 없다", async () => {
    const auth = createTestAuth();

    await auth.api.signUpEmail({
      body: { name: "Admin", email: "admin@example.com", password: "password1234" },
    });

    await expect(
      auth.api.signInEmail({
        body: { email: "admin@example.com", password: "wrong-password" },
      }),
    ).rejects.toThrow();
  });

  it("가입하지 않은 이메일로는 로그인할 수 없다", async () => {
    const auth = createTestAuth();

    await expect(
      auth.api.signInEmail({
        body: { email: "nobody@example.com", password: "password1234" },
      }),
    ).rejects.toThrow();
  });
});
