import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { createDatabase } from "../persistence/drizzle/client.ts";
import { createAuth } from "./auth.ts";

if (import.meta.main) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";
  const databaseUrl = process.env.DATABASE_URL ?? "pglite://.data/dev";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  const db = createDatabase(databaseUrl);
  const auth = createAuth(drizzleAdapter(db, { provider: "pg" }));

  await auth.api.signUpEmail({ body: { name, email, password } });
  console.log(`Admin account created: ${email}`);
}
