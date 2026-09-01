import { mkdirSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.ts";

export type Database = PgliteDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

export function createDatabase(databaseUrl: string): Database {
  if (databaseUrl.startsWith("pglite://")) {
    const dataDir = databaseUrl.slice("pglite://".length);
    if (dataDir !== "memory") mkdirSync(dataDir, { recursive: true });
    const client = new PGlite(dataDir === "memory" ? undefined : dataDir);
    return drizzlePglite({ client, schema });
  }

  const client = postgres(databaseUrl);
  return drizzlePostgres({ client, schema });
}
