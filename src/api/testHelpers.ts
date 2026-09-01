import { TEST_ADMIN } from "../domain/fixtures.ts";
import type { AppContext } from "./context.ts";

export async function signInAndGetCookie(
  ctx: AppContext,
  credentials: { name?: string; email: string; password: string } = TEST_ADMIN,
): Promise<string> {
  await ctx.auth.api.signUpEmail({
    body: {
      name: credentials.name ?? TEST_ADMIN.name,
      email: credentials.email,
      password: credentials.password,
    },
  });
  const response = await ctx.auth.api.signInEmail({
    body: { email: credentials.email, password: credentials.password },
    asResponse: true,
  });
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("no set-cookie header returned from sign-in");
  return cookie.split(";")[0] ?? "";
}

export type TestResponse = {
  status: number;
  json: () => Promise<any>;
  text: () => Promise<string>;
};

export type TestClient = {
  get(path: string): Promise<TestResponse>;
  post(path: string, body?: unknown): Promise<TestResponse>;
  patch(path: string, body?: unknown): Promise<TestResponse>;
};

// Test-only convenience wrapper over app.handle() — avoids repeating
// Content-Type/cookie headers and JSON.stringify at every call site.
export function createTestClient(
  app: { handle(request: Request): Promise<Response> },
  options: { cookie?: string } = {},
): TestClient {
  async function request(method: string, path: string, body?: unknown): Promise<TestResponse> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (options.cookie) headers.cookie = options.cookie;

    const response = await app.handle(
      new Request(`http://localhost${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    );
    return { status: response.status, json: () => response.json(), text: () => response.text() };
  }

  return {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    patch: (path, body) => request("PATCH", path, body),
  };
}
