import type { AppContext } from "./context.ts";

export async function signInAndGetCookie(
  ctx: AppContext,
  credentials: { name?: string; email: string; password: string } = {
    name: "Admin",
    email: "admin@example.com",
    password: "password1234",
  },
): Promise<string> {
  await ctx.auth.api.signUpEmail({
    body: {
      name: credentials.name ?? "Admin",
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
