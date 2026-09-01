import { drizzleAdapter } from "better-auth/adapters/drizzle";

import createFakeImageStorage from "../../persistence/FakeImageStorage.ts";
import { createDatabase } from "../../persistence/drizzle/client.ts";
import createDrizzleQuestGroupRepo from "../../persistence/drizzle/DrizzleQuestGroupRepo.ts";
import createDrizzleQuestRepo from "../../persistence/drizzle/DrizzleQuestRepo.ts";
import createSupabaseImageStorage from "../../persistence/s3/SupabaseImageStorage.ts";
import type { ImageStorage } from "../../persistence/types.ts";
import { createAuth } from "../auth.ts";
import type { AppContext } from "../context.ts";
import { createApp, type App } from "./app.ts";

const databaseUrl = process.env.DATABASE_URL ?? "pglite://.data/dev";
const db = createDatabase(databaseUrl);

function createImageStorageFromEnv(): ImageStorage {
  const endpoint = process.env.SUPABASE_S3_ENDPOINT;
  const region = process.env.SUPABASE_S3_REGION;
  const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  const publicUrlBase = process.env.SUPABASE_STORAGE_PUBLIC_URL_BASE;

  if (endpoint && region && accessKeyId && secretAccessKey && bucket && publicUrlBase) {
    return createSupabaseImageStorage({
      endpoint,
      region,
      accessKeyId,
      secretAccessKey,
      bucket,
      publicUrlBase,
    });
  }

  // Local dev / this environment has no Supabase project configured yet.
  return createFakeImageStorage();
}

const ctx: AppContext = {
  repo: {
    quest: createDrizzleQuestRepo(db),
    questGroup: createDrizzleQuestGroupRepo(db),
  },
  auth: createAuth(drizzleAdapter(db, { provider: "pg" })),
  imageStorage: createImageStorageFromEnv(),
};

export const app = createApp(ctx);
export const auth = ctx.auth;
export type { App };
