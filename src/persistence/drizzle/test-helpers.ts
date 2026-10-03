import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "./fullSchema.ts";

// URL.pathname은 Windows에서 `/C:/...`가 되어 폴더를 찾지 못한다 — fileURLToPath로 바꾼다.
const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

export type TestDatabase = PgliteDatabase<typeof schema> & AsyncDisposable;

export async function createTestDatabase(): Promise<TestDatabase> {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder });

  return Object.assign(db, {
    [Symbol.asyncDispose]: () => client.close(),
  });
}
