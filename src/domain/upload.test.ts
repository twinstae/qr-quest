import { describe, expect, it } from "vitest";

import { FileTooLargeError, UnsupportedFileTypeError } from "./errors.ts";
import {
  ALLOWED_IMAGE_TYPE_LABEL,
  DEFAULT_MAX_IMAGE_BYTES,
  formatBytes,
  isAllowedImageContentType,
  validateImageUpload,
} from "./upload.ts";

describe("formatBytes", () => {
  it("1MB 이상은 소수 한 자리 MB로 표시한다", () => {
    expect(formatBytes(8.2 * 1024 * 1024)).toBe("8.2MB");
    expect(formatBytes(1.4 * 1024 * 1024)).toBe("1.4MB");
  });

  it("정확히 나누어떨어지면 소수점을 붙이지 않는다", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5MB");
  });

  it("1MB 미만은 KB로 표시한다", () => {
    expect(formatBytes(512 * 1024)).toBe("512KB");
  });

  it("1KB 미만은 B로 표시한다", () => {
    expect(formatBytes(900)).toBe("900B");
  });
});

describe("isAllowedImageContentType", () => {
  it("허용 형식을 통과시킨다", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
      expect(isAllowedImageContentType(type)).toBe(true);
    }
  });

  it("이미지가 아니거나 지원하지 않는 형식을 거부한다", () => {
    expect(isAllowedImageContentType("application/pdf")).toBe(false);
    expect(isAllowedImageContentType("image/bmp")).toBe(false);
    expect(isAllowedImageContentType("image/svg+xml")).toBe(false);
    expect(isAllowedImageContentType("")).toBe(false);
  });
});

describe("validateImageUpload", () => {
  const baseInput = {
    contentType: "image/jpeg",
    byteSize: 1024,
    maxBytes: DEFAULT_MAX_IMAGE_BYTES,
  };

  it("허용 형식이면 아무 것도 던지지 않는다", () => {
    expect(() => validateImageUpload(baseInput)).not.toThrow();
  });

  it("한도와 같으면 통과한다", () => {
    expect(() =>
      validateImageUpload({ ...baseInput, byteSize: DEFAULT_MAX_IMAGE_BYTES }),
    ).not.toThrow();
  });

  it("한도를 넘으면 실제 크기와 한도를 담아 FileTooLargeError를 던진다", () => {
    const actualBytes = 8.2 * 1024 * 1024;

    const error = (() => {
      try {
        validateImageUpload({ ...baseInput, byteSize: actualBytes });
      } catch (thrown) {
        return thrown;
      }
      return undefined;
    })();

    expect(error).toBeInstanceOf(FileTooLargeError);
    expect((error as FileTooLargeError).limitBytes).toBe(DEFAULT_MAX_IMAGE_BYTES);
    expect((error as FileTooLargeError).actualBytes).toBe(actualBytes);
    expect((error as FileTooLargeError).message).toBe(
      "5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요.",
    );
  });

  it("허용되지 않는 형식이면 지원 형식을 담아 UnsupportedFileTypeError를 던진다", () => {
    const error = (() => {
      try {
        validateImageUpload({ ...baseInput, contentType: "application/pdf" });
      } catch (thrown) {
        return thrown;
      }
      return undefined;
    })();

    expect(error).toBeInstanceOf(UnsupportedFileTypeError);
    expect((error as UnsupportedFileTypeError).message).toBe(
      `${ALLOWED_IMAGE_TYPE_LABEL} 파일만 올릴 수 있어요.`,
    );
    expect((error as UnsupportedFileTypeError).allowedTypes).toContain("image/webp");
  });

  it("형식이 잘못되고 용량도 크면 형식 오류를 먼저 알려준다", () => {
    expect(() =>
      validateImageUpload({
        ...baseInput,
        contentType: "application/pdf",
        byteSize: 100 * 1024 * 1024,
      }),
    ).toThrow(UnsupportedFileTypeError);
  });
});
