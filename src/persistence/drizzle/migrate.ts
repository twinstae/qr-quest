import { mkdirSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import * as schema from "./schema.ts";

const migrationsFolder = new URL("./migrations", import.meta.url).pathname;

export async function migrateDatabase(databaseUrl: string): Promise<void> {
  if (databaseUrl.startsWith("pglite://")) {
    const dataDir = databaseUrl.slice("pglite://".length);
    if (dataDir !== "memory") mkdirSync(dataDir, { recursive: true });
    const client = new PGlite(dataDir === "memory" ? undefined : dataDir);
    const db = drizzlePglite({ client, schema });
    await migratePglite(db, { migrationsFolder });
    await client.close();
    return;
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzlePostgres({ client, schema });
  await migratePostgres(db, { migrationsFolder });
  await client.end();
}

if (import.meta.main) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  await migrateDatabase(databaseUrl);
  console.log("Migrations applied");
}
