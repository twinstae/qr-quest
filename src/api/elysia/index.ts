import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { DEFAULT_MAX_IMAGE_BYTES } from "../../domain/upload.ts";
import createFakeImageStorage from "../../persistence/FakeImageStorage.ts";
import { createDatabase } from "../../persistence/drizzle/client.ts";
import createDrizzleCaseRepo from "../../persistence/drizzle/DrizzleCaseRepo.ts";
import {
  createDrizzlePlaySessionRepo,
  createDrizzleStepAttemptRepo,
} from "../../persistence/drizzle/DrizzlePlaySessionRepo.ts";
import createDrizzleStepRepo from "../../persistence/drizzle/DrizzleStepRepo.ts";
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

function maxImageBytesFromEnv(): number {
  const raw = process.env.UPLOAD_MAX_BYTES;
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_IMAGE_BYTES;
}

const ctx: AppContext = {
  repo: {
    case: createDrizzleCaseRepo(db),
    step: createDrizzleStepRepo(db),
    playSession: createDrizzlePlaySessionRepo(db),
    stepAttempt: createDrizzleStepAttemptRepo(db),
  },
  auth: createAuth(drizzleAdapter(db, { provider: "pg" })),
  imageStorage: createImageStorageFromEnv(),
  uploadLimits: { maxImageBytes: maxImageBytesFromEnv() },
};

export const app = createApp(ctx);
export const auth = ctx.auth;
export type { App };
