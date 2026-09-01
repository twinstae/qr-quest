import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "./schema.ts";

const migrationsFolder = new URL("./migrations", import.meta.url).pathname;

export async function createTestDatabase(): Promise<{
  db: PgliteDatabase<typeof schema>;
  close: () => Promise<void>;
}> {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder });
  return { db, close: () => client.close() };
}
