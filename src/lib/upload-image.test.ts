import { afterEach, describe, expect, it, vi } from "vitest";

import {
  UPLOAD_FAILED_MESSAGE,
  toUploadIssue,
  uploadImageFile,
  type PresignUpload,
} from "./upload-image.ts";

const EIGHT_MB = Math.round(8.2 * 1024 * 1024);

function imageFile(byteSize: number, name = "photo.jpg") {
  return new File([new Uint8Array(byteSize)], name, { type: "image/jpeg" });
}

function presignOk(uploadUrl = "https://fake-storage.test/upload/1") {
  const calls: { filename: string; contentType: string; byteSize: number }[] = [];
  const presign: PresignUpload = async (input) => {
    calls.push(input);
    return { data: { uploadUrl, publicUrl: "https://fake-storage.test/public/1-photo.jpg" } };
  };
  return { presign, calls };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("toUploadIssue", () => {
  it("413 응답을 한도 초과 이유로 바꾸고 숫자를 유지한다", () => {
    const issue = toUploadIssue({
      code: "FILE_TOO_LARGE",
      message: "5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요.",
      limitBytes: 5 * 1024 * 1024,
      actualBytes: EIGHT_MB,
    });

    expect(issue).toEqual({
      kind: "too-large",
      message: "5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요.",
      limitBytes: 5 * 1024 * 1024,
      actualBytes: EIGHT_MB,
    });
  });

  it("서버가 문구를 안 주면 숫자로 직접 만든다", () => {
    const issue = toUploadIssue({
      code: "FILE_TOO_LARGE",
      limitBytes: 5 * 1024 * 1024,
      actualBytes: EIGHT_MB,
    });

    expect(issue.message).toBe("5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요.");
  });

  it("415 응답을 지원하지 않는 형식으로 바꾼다", () => {
    const issue = toUploadIssue({
      code: "UNSUPPORTED_FILE_TYPE",
      message: "JPG, PNG, WebP, GIF 파일만 올릴 수 있어요.",
    });

    expect(issue).toEqual({
      kind: "unsupported",
      message: "JPG, PNG, WebP, GIF 파일만 올릴 수 있어요.",
    });
  });

  // Eden Treaty는 실패를 { status, value }로 감싼다. 브라우저에서 실제 응답으로 확인한 모양.
  it("Eden Treaty가 감싼 413 응답도 풀어서 이유를 알려준다", () => {
    const issue = toUploadIssue({
      status: 413,
      value: {
        code: "FILE_TOO_LARGE",
        message: "5MB 이하만 올릴 수 있어요. 선택한 파일은 12MB예요.",
        limitBytes: 5 * 1024 * 1024,
        actualBytes: 12 * 1024 * 1024,
      },
    });

    expect(issue).toEqual({
      kind: "too-large",
      message: "5MB 이하만 올릴 수 있어요. 선택한 파일은 12MB예요.",
      limitBytes: 5 * 1024 * 1024,
      actualBytes: 12 * 1024 * 1024,
    });
  });

  it("Eden Treaty가 감싼 415 응답도 풀어서 이유를 알려준다", () => {
    const issue = toUploadIssue({
      status: 415,
      value: {
        code: "UNSUPPORTED_FILE_TYPE",
        message: "JPG, PNG, WebP, GIF 파일만 올릴 수 있어요.",
      },
    });

    expect(issue).toEqual({
      kind: "unsupported",
      message: "JPG, PNG, WebP, GIF 파일만 올릴 수 있어요.",
    });
  });

  it("알 수 없는 오류는 일반 실패 문구로 바꾼다", () => {
    expect(toUploadIssue(undefined)).toEqual({ kind: "failed", message: UPLOAD_FAILED_MESSAGE });
    expect(toUploadIssue("boom")).toEqual({ kind: "failed", message: UPLOAD_FAILED_MESSAGE });
    expect(toUploadIssue({ code: "SOMETHING_ELSE" })).toEqual({
      kind: "failed",
      message: UPLOAD_FAILED_MESSAGE,
    });
    expect(toUploadIssue({ status: 413, value: { code: "SOMETHING_ELSE" } })).toEqual({
      kind: "failed",
      message: UPLOAD_FAILED_MESSAGE,
    });
  });
});

describe("uploadImageFile", () => {
  it("파일 크기를 함께 보내고, 성공하면 이미지 값을 돌려준다", async () => {
    const { presign, calls } = presignOk();
    const fetchStub = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchStub);
    const file = imageFile(1024, "표지.jpg");

    const result = await uploadImageFile(file, presign);

    expect(calls).toEqual([{ filename: "표지.jpg", contentType: "image/jpeg", byteSize: 1024 }]);
    expect(fetchStub).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: "uploaded",
      image: { src: "https://fake-storage.test/public/1-photo.jpg", alt: "표지.jpg", kind: "image" },
    });
  });

  it("동영상 파일이면 kind:video로 표시한다", async () => {
    const { presign } = presignOk();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 })),
    );
    const file = new File([new Uint8Array(1024)], "clue.mp4", { type: "video/mp4" });

    const result = await uploadImageFile(file, presign);

    expect(result).toMatchObject({ status: "uploaded", image: { kind: "video" } });
  });

  it("한도 초과로 거부되면 스토리지에 올리지 않고 이유를 돌려준다", async () => {
    const fetchStub = vi.fn();
    vi.stubGlobal("fetch", fetchStub);

    const result = await uploadImageFile(imageFile(EIGHT_MB), async () => ({
      data: null,
      error: {
        code: "FILE_TOO_LARGE",
        message: "5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요.",
        limitBytes: 5 * 1024 * 1024,
        actualBytes: EIGHT_MB,
      },
    }));

    expect(result).toEqual({
      status: "issue",
      issue: {
        kind: "too-large",
        message: "5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요.",
        limitBytes: 5 * 1024 * 1024,
        actualBytes: EIGHT_MB,
      },
    });
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("허용되지 않는 형식이면 형식 안내를 돌려준다", async () => {
    const result = await uploadImageFile(imageFile(1024, "doc.pdf"), async () => ({
      data: null,
      error: {
        code: "UNSUPPORTED_FILE_TYPE",
        message: "JPG, PNG, WebP, GIF 파일만 올릴 수 있어요.",
      },
    }));

    expect(result).toEqual({
      status: "issue",
      issue: { kind: "unsupported", message: "JPG, PNG, WebP, GIF 파일만 올릴 수 있어요." },
    });
  });

  it("스토리지 업로드가 실패하면 일반 실패 문구를 돌려준다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );
    const { presign } = presignOk();

    const result = await uploadImageFile(imageFile(1024), presign);

    expect(result).toEqual({
      status: "issue",
      issue: { kind: "failed", message: UPLOAD_FAILED_MESSAGE },
    });
  });

  it("네트워크가 끊겨 fetch가 던지면 업로드 중 상태로 멈추지 않고 실패를 돌려준다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const { presign } = presignOk();

    const result = await uploadImageFile(imageFile(1024), presign);

    expect(result).toEqual({
      status: "issue",
      issue: { kind: "failed", message: UPLOAD_FAILED_MESSAGE },
    });
  });
});
