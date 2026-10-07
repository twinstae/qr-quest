import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "./fullSchema.ts";

// URL.pathname은 Windows에서 `/C:/...`가 되어 폴더를 찾지 못한다 — fileURLToPath로 바꾼다.
const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

export type TestDatabase = PgliteDatabase<typeof schema> & AsyncDisposable;

// PGlite 하나가 ~500MB를 쓰고 close해도 프로세스 메모리가 돌아오지 않는다. 테스트마다 새로 띄우면
// 병렬 워커들이 메모리를 다 써서 스왑이 돌고, 첫 테스트가 15초를 넘었다. 그래서 DB는 한 번만
// 띄워 마이그레이션하고, 테스트마다 모든 테이블을 비워서 준다. DB 테스트는 `db` 프로젝트에서
// 한 워커로 순서대로 돌아서(vite.config.ts) 서로 겹치지 않는다.
let shared: Promise<PgliteDatabase<typeof schema>> | undefined;

async function createSharedDatabase() {
  const db = drizzle({ client: new PGlite(), schema });
  await migrate(db, { migrationsFolder });
  return db;
}

async function truncateAllTables(db: PgliteDatabase<typeof schema>) {
  const { rows } = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  if (rows.length === 0) return;
  const tables = rows.map((row) => `"${row.tablename}"`).join(", ");
  await db.execute(sql.raw(`truncate ${tables} restart identity cascade`));
}

export async function createTestDatabase(): Promise<TestDatabase> {
  shared ??= createSharedDatabase();
  const db = await shared;
  await truncateAllTables(db);

  return Object.assign(db, {
    // 공유 DB라 닫지 않는다 — 다음 테스트가 시작할 때 비운다.
    [Symbol.asyncDispose]: async () => {},
  });
}
