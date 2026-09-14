import { ALLOWED_IMAGE_TYPE_LABEL, formatBytes } from "@/domain/upload";

export type UploadedImage = { src: string; alt: string };

export type UploadIssue =
  | { kind: "too-large"; message: string; limitBytes: number; actualBytes: number }
  | { kind: "unsupported"; message: string }
  | { kind: "failed"; message: string };

export type UploadImageResult =
  | { status: "uploaded"; image: UploadedImage }
  | { status: "issue"; issue: UploadIssue };

export const UPLOAD_FAILED_MESSAGE = "이미지 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.";
export const COMPRESS_FAILED_MESSAGE = "자동 압축에 실패했어요. 더 작은 사진을 골라 주세요.";

export type PresignUpload = (input: {
  filename: string;
  contentType: string;
  byteSize: number;
}) => Promise<{ data: { uploadUrl: string; publicUrl: string } | null; error?: unknown }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * 서버가 돌려준 업로드 거부 이유를 화면에서 쓸 수 있는 형태로 바꾼다.
 *
 * 한도/형식은 서버가 판단한 값을 그대로 쓰고(설정을 바꿔도 화면이 어긋나지 않게),
 * 이유를 알 수 없을 때만 일반 실패 문구로 떨어진다.
 */
export function toUploadIssue(error: unknown): UploadIssue {
  if (isRecord(error)) {
    const message =
      typeof error.message === "string" && error.message !== "" ? error.message : undefined;

    if (
      error.code === "FILE_TOO_LARGE" &&
      typeof error.limitBytes === "number" &&
      typeof error.actualBytes === "number"
    ) {
      return {
        kind: "too-large",
        message:
          message ??
          `${formatBytes(error.limitBytes)} 이하만 올릴 수 있어요. 선택한 파일은 ${formatBytes(
            error.actualBytes,
          )}예요.`,
        limitBytes: error.limitBytes,
        actualBytes: error.actualBytes,
      };
    }

    if (error.code === "UNSUPPORTED_FILE_TYPE") {
      return {
        kind: "unsupported",
        message: message ?? `${ALLOWED_IMAGE_TYPE_LABEL} 파일만 올릴 수 있어요.`,
      };
    }
  }

  return { kind: "failed", message: UPLOAD_FAILED_MESSAGE };
}

export async function uploadImageFile(
  file: File,
  presign: PresignUpload,
): Promise<UploadImageResult> {
  const { data, error } = await presign({
    filename: file.name,
    contentType: file.type,
    byteSize: file.size,
  });

  if (!data) return { status: "issue", issue: toUploadIssue(error) };

  const response = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    return { status: "issue", issue: { kind: "failed", message: UPLOAD_FAILED_MESSAGE } };
  }

  return { status: "uploaded", image: { src: data.publicUrl, alt: file.name } };
}
