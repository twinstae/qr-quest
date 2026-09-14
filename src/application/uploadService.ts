import type { AppContext } from "../api/context.ts";
import { validateImageUpload } from "../domain/upload.ts";

export type PresignUploadInput = {
  filename: string;
  contentType: string;
  byteSize: number;
};

export async function presignUpload(
  ctx: AppContext,
  input: PresignUploadInput,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  validateImageUpload({
    contentType: input.contentType,
    byteSize: input.byteSize,
    maxBytes: ctx.uploadLimits.maxImageBytes,
  });

  return ctx.imageStorage.presignUpload(input);
}
