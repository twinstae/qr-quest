import type { AppContext } from "../api/context.ts";

export async function presignUpload(
  ctx: AppContext,
  input: { filename: string; contentType: string },
): Promise<{ uploadUrl: string; publicUrl: string }> {
  return ctx.imageStorage.presignUpload(input);
}
