const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.82;

export type CompressImageOptions = {
  /** 긴 변 기준 최대 픽셀. 기본 1600px. */
  maxEdge?: number;
  quality?: number;
};

function baseName(filename: string): string {
  return filename.replace(/\.[^./\\]+$/, "") || "image";
}

/** 인코딩 결과의 실제 형식에 맞는 확장자를 쓴다 (브라우저가 WebP를 못 쓰면 PNG로 떨어진다). */
function extensionFor(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  return "webp";
}

/**
 * 업로드 한도를 넘는 사진을 올릴 수 있는 크기로 줄인다.
 *
 * 원본을 바꾸지 않고 새 File을 돌려주므로, 사용자가 압축 결과를 보고 나서
 * 업로드할지 결정할 수 있다. EXIF 회전은 디코딩 단계에서 반영한다.
 */
export async function compressImage(
  file: File,
  { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_QUALITY }: CompressImageOptions = {},
): Promise<File> {
  if (typeof createImageBitmap !== "function") {
    throw new Error("이 브라우저에서는 자동 압축을 지원하지 않아요.");
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas 2d 컨텍스트를 만들 수 없어요.");
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob) throw new Error("이미지를 다시 인코딩하지 못했어요.");

    const contentType = blob.type || "image/webp";
    return new File([blob], `${baseName(file.name)}.${extensionFor(contentType)}`, {
      type: contentType,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
