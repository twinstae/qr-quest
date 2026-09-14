import type { AppContext } from "../api/context.ts";
import { validateMediaUpload } from "../domain/upload.ts";

export type PresignUploadInput = {
  filename: string;
  contentType: string;
  byteSize: number;
};

/** 형식(이미지/동영상)에 따라 알맞은 한도로 검증한다 — 호출부는 어느 쪽인지 모른다. */
export async function presignUpload(
  ctx: AppContext,
  input: PresignUploadInput,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  validateMediaUpload({
    contentType: input.contentType,
    byteSize: input.byteSize,
    maxImageBytes: ctx.uploadLimits.maxImageBytes,
    maxVideoBytes: ctx.uploadLimits.maxVideoBytes,
  });

  return ctx.imageStorage.presignUpload(input);
}
