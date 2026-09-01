import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { createDatabase } from "../../persistence/drizzle/client.ts";
import createDrizzleQuestRepo from "../../persistence/drizzle/DrizzleQuestRepo.ts";
import { createAuth } from "../auth.ts";
import type { AppContext } from "../context.ts";
import { createApp, type App } from "./app.ts";

const databaseUrl = process.env.DATABASE_URL ?? "pglite://.data/dev";
const db = createDatabase(databaseUrl);

const ctx: AppContext = {
  repo: {
    quest: createDrizzleQuestRepo(db),
  },
  auth: createAuth(drizzleAdapter(db, { provider: "pg" })),
};

export const app = createApp(ctx);
export type { App };
