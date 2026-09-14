import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { ImageStorage } from "../types.ts";

export type SupabaseImageStorageConfig = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  // e.g. "https://<project_ref>.supabase.co/storage/v1/object/public"
  publicUrlBase: string;
};

const PRESIGN_EXPIRES_IN_SECONDS = 5 * 60;

export function createSupabaseImageStorage(config: SupabaseImageStorageConfig): ImageStorage {
  const client = new S3Client({
    forcePathStyle: true,
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    async presignUpload({ filename, contentType, byteSize }) {
      const key = `${crypto.randomUUID()}-${filename}`;
      const uploadUrl = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ContentType: contentType,
          // Content-Length까지 서명해야 검증한 크기보다 큰 파일이 스토리지에
          // 올라가지 않는다 (S3가 서명과 다른 크기를 거부한다).
          ContentLength: byteSize,
        }),
        { expiresIn: PRESIGN_EXPIRES_IN_SECONDS },
      );
      return { uploadUrl, publicUrl: `${config.publicUrlBase}/${config.bucket}/${key}` };
    },
  } satisfies ImageStorage;
}

export default createSupabaseImageStorage;
