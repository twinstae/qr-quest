import { ALLOWED_IMAGE_TYPE_LABEL, formatBytes } from "@/domain/upload";
import type { MediaKind } from "@/domain/step";

export type UploadedImage = { src: string; alt: string; kind: MediaKind };

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
 * Eden Treaty는 실패를 `{ status, value: <서버 응답 바디> }`로 감싸서 준다.
 * 응답 바디를 그대로 받는 경우도 있어서 둘 다 받아준다.
 */
function unwrapErrorPayload(error: unknown): unknown {
  if (isRecord(error) && isRecord(error.value)) return error.value;
  return error;
}

/**
 * 서버가 돌려준 업로드 거부 이유를 화면에서 쓸 수 있는 형태로 바꾼다.
 *
 * 한도/형식은 서버가 판단한 값을 그대로 쓰고(설정을 바꿔도 화면이 어긋나지 않게),
 * 이유를 알 수 없을 때만 일반 실패 문구로 떨어진다.
 */
export function toUploadIssue(error: unknown): UploadIssue {
  const payload = unwrapErrorPayload(error);

  if (isRecord(payload)) {
    const message =
      typeof payload.message === "string" && payload.message !== "" ? payload.message : undefined;

    if (
      payload.code === "FILE_TOO_LARGE" &&
      typeof payload.limitBytes === "number" &&
      typeof payload.actualBytes === "number"
    ) {
      return {
        kind: "too-large",
        message:
          message ??
          `${formatBytes(payload.limitBytes)} 이하만 올릴 수 있어요. 선택한 파일은 ${formatBytes(
            payload.actualBytes,
          )}예요.`,
        limitBytes: payload.limitBytes,
        actualBytes: payload.actualBytes,
      };
    }

    if (payload.code === "UNSUPPORTED_FILE_TYPE") {
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

  try {
    const response = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!response.ok) {
      return { status: "issue", issue: { kind: "failed", message: UPLOAD_FAILED_MESSAGE } };
    }
  } catch {
    // 네트워크가 끊기면 fetch가 던진다. 여기서 잡지 않으면 필드가 업로드 중인 채로 멈춘다.
    return { status: "issue", issue: { kind: "failed", message: UPLOAD_FAILED_MESSAGE } };
  }

  const kind: MediaKind = file.type.startsWith("video/") ? "video" : "image";
  return { status: "uploaded", image: { src: data.publicUrl, alt: file.name, kind } };
}
