import { FileTooLargeError, UnsupportedFileTypeError } from "./errors.ts";

export const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

export const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CONTENT_TYPE_LABELS: Record<AllowedImageContentType, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
};

/** 업로드 필드 안내 문구에 쓰는 "JPG, PNG, WebP, GIF". */
export const ALLOWED_IMAGE_TYPE_LABEL = ALLOWED_IMAGE_CONTENT_TYPES.map(
  (contentType) => CONTENT_TYPE_LABELS[contentType],
).join(", ");

const KIB = 1024;
const MIB = 1024 * 1024;

/** "5MB", "8.2MB", "512KB" — 사용자에게 보여주는 용량 표기. */
export function formatBytes(bytes: number): string {
  if (bytes >= MIB) {
    const megabytes = bytes / MIB;
    return Number.isInteger(megabytes) ? `${megabytes}MB` : `${megabytes.toFixed(1)}MB`;
  }
  if (bytes >= KIB) return `${Math.round(bytes / KIB)}KB`;
  return `${bytes}B`;
}

export function isAllowedImageContentType(
  contentType: string,
): contentType is AllowedImageContentType {
  return (ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(contentType);
}

// mp4(H.264)만 받는다 — 재생 호환성이 가장 넓고, 브라우저에서 controls 없이
// playsInline으로 바로 재생하기에 안전하다(요구, ticket 15).
export const ALLOWED_VIDEO_CONTENT_TYPES = ["video/mp4"] as const;
export type AllowedVideoContentType = (typeof ALLOWED_VIDEO_CONTENT_TYPES)[number];
export const DEFAULT_MAX_VIDEO_BYTES = 25 * 1024 * 1024;
export const ALLOWED_VIDEO_TYPE_LABEL = "MP4";

export function isAllowedVideoContentType(
  contentType: string,
): contentType is AllowedVideoContentType {
  return (ALLOWED_VIDEO_CONTENT_TYPES as readonly string[]).includes(contentType);
}

/**
 * 동영상은 한도를 넘어도 이미지처럼 자동 압축하지 않는다 — 브라우저 압축은 품질
 * 손실이 크다. 대신 권장 길이/용량 안내로 다시 고르게 한다(호출부의 몫).
 */
export function validateVideoUpload(input: {
  contentType: string;
  byteSize: number;
  maxBytes: number;
}): void {
  if (!isAllowedVideoContentType(input.contentType)) {
    throw new UnsupportedFileTypeError(
      `${ALLOWED_VIDEO_TYPE_LABEL} 파일만 올릴 수 있어요.`,
      ALLOWED_VIDEO_CONTENT_TYPES,
    );
  }

  if (input.byteSize > input.maxBytes) {
    throw new FileTooLargeError(
      `${formatBytes(input.maxBytes)} 이하만 올릴 수 있어요. 선택한 파일은 ${formatBytes(
        input.byteSize,
      )}예요.`,
      input.maxBytes,
      input.byteSize,
    );
  }
}

/** 이미지·동영상을 함께 받는 미디어 필드에서 쓴다. 형식으로 어느 쪽인지 판단한다. */
export function validateMediaUpload(input: {
  contentType: string;
  byteSize: number;
  maxImageBytes: number;
  maxVideoBytes: number;
}): void {
  if (isAllowedImageContentType(input.contentType)) {
    validateImageUpload({
      contentType: input.contentType,
      byteSize: input.byteSize,
      maxBytes: input.maxImageBytes,
    });
    return;
  }
  if (isAllowedVideoContentType(input.contentType)) {
    validateVideoUpload({
      contentType: input.contentType,
      byteSize: input.byteSize,
      maxBytes: input.maxVideoBytes,
    });
    return;
  }
  throw new UnsupportedFileTypeError(
    `${ALLOWED_IMAGE_TYPE_LABEL} 또는 ${ALLOWED_VIDEO_TYPE_LABEL} 파일만 올릴 수 있어요.`,
    [...ALLOWED_IMAGE_CONTENT_TYPES, ...ALLOWED_VIDEO_CONTENT_TYPES],
  );
}

/**
 * 업로드 직전 검증. 실패하면 실제 한도와 실제 크기를 담은 도메인 에러를 던지므로
 * 화면에서 "5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요."처럼 숫자를 보여줄 수 있다.
 *
 * 형식이 잘못되고 용량도 큰 파일은 형식 오류로 알려준다 — 크기를 줄여도 올릴 수 없기 때문.
 */
export function validateImageUpload(input: {
  contentType: string;
  byteSize: number;
  maxBytes: number;
}): void {
  if (!isAllowedImageContentType(input.contentType)) {
    throw new UnsupportedFileTypeError(
      `${ALLOWED_IMAGE_TYPE_LABEL} 파일만 올릴 수 있어요.`,
      ALLOWED_IMAGE_CONTENT_TYPES,
    );
  }

  if (input.byteSize > input.maxBytes) {
    throw new FileTooLargeError(
      `${formatBytes(input.maxBytes)} 이하만 올릴 수 있어요. 선택한 파일은 ${formatBytes(
        input.byteSize,
      )}예요.`,
      input.maxBytes,
      input.byteSize,
    );
  }
}
