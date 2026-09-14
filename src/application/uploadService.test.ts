import { describe, expect, it } from "vitest";

import { createFakeContext } from "../api/context.ts";
import { FileTooLargeError, UnsupportedFileTypeError } from "../domain/errors.ts";
import { DEFAULT_MAX_IMAGE_BYTES, DEFAULT_MAX_VIDEO_BYTES } from "../domain/upload.ts";
import { presignUpload } from "./uploadService.ts";

// 스토리지가 실제로 호출됐는지 세면서 검증이 먼저 걸리는지 확인한다.
function contextSpyingOnStorage(
  maxImageBytes = DEFAULT_MAX_IMAGE_BYTES,
  maxVideoBytes = DEFAULT_MAX_VIDEO_BYTES,
) {
  const calls: { filename: string; contentType: string; byteSize: number }[] = [];
  const ctx = createFakeContext({
    uploadLimits: { maxImageBytes, maxVideoBytes },
    imageStorage: {
      async presignUpload(input) {
        calls.push(input);
        return {
          uploadUrl: `https://fake-storage.test/upload/${input.filename}`,
          publicUrl: `https://fake-storage.test/public/${input.filename}`,
        };
      },
    },
  });
  return { ctx, calls };
}

describe("presignUpload", () => {
  it("한도 이하의 이미지는 스토리지에 위임하고 URL을 반환한다", async () => {
    const { ctx, calls } = contextSpyingOnStorage();

    const result = await presignUpload(ctx, {
      filename: "cover.jpg",
      contentType: "image/jpeg",
      byteSize: 1024,
    });

    expect(calls).toEqual([{ filename: "cover.jpg", contentType: "image/jpeg", byteSize: 1024 }]);
    expect(result.publicUrl).toContain("cover.jpg");
  });

  it("한도를 넘으면 스토리지를 호출하지 않고 FileTooLargeError를 던진다", async () => {
    const { ctx, calls } = contextSpyingOnStorage();

    await expect(
      presignUpload(ctx, {
        filename: "huge.jpg",
        contentType: "image/jpeg",
        byteSize: DEFAULT_MAX_IMAGE_BYTES + 1,
      }),
    ).rejects.toThrow(FileTooLargeError);
    expect(calls).toEqual([]);
  });

  it("허용되지 않는 형식은 스토리지를 호출하지 않고 UnsupportedFileTypeError를 던진다", async () => {
    const { ctx, calls } = contextSpyingOnStorage();

    await expect(
      presignUpload(ctx, {
        filename: "doc.pdf",
        contentType: "application/pdf",
        byteSize: 1024,
      }),
    ).rejects.toThrow(UnsupportedFileTypeError);
    expect(calls).toEqual([]);
  });

  it("한도는 컨텍스트 설정을 따른다 (환경변수로 조정 가능)", async () => {
    const { ctx } = contextSpyingOnStorage(1024);

    const error = await presignUpload(ctx, {
      filename: "small.jpg",
      contentType: "image/jpeg",
      byteSize: 2048,
    }).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(FileTooLargeError);
    expect((error as FileTooLargeError).limitBytes).toBe(1024);
  });

  it("한도 이하의 mp4는 이미지와 별개의 한도로 스토리지에 위임한다", async () => {
    const { ctx, calls } = contextSpyingOnStorage();

    const result = await presignUpload(ctx, {
      filename: "clue.mp4",
      contentType: "video/mp4",
      byteSize: 20 * 1024 * 1024, // 이미지 한도(5MB)는 넘지만 동영상 한도(25MB)는 안 넘음
    });

    expect(calls).toHaveLength(1);
    expect(result.publicUrl).toContain("clue.mp4");
  });

  it("동영상 한도를 넘으면 스토리지를 호출하지 않는다", async () => {
    const { ctx, calls } = contextSpyingOnStorage();

    await expect(
      presignUpload(ctx, {
        filename: "huge.mp4",
        contentType: "video/mp4",
        byteSize: DEFAULT_MAX_VIDEO_BYTES + 1,
      }),
    ).rejects.toThrow(FileTooLargeError);
    expect(calls).toEqual([]);
  });
});
