import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "./fullSchema.ts";

const migrationsFolder = new URL("./migrations", import.meta.url).pathname;

export type TestDatabase = PgliteDatabase<typeof schema> & AsyncDisposable;

export async function createTestDatabase(): Promise<TestDatabase> {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder });

  return Object.assign(db, {
    [Symbol.asyncDispose]: () => client.close(),
  });
}
