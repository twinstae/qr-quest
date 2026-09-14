import { describe, expect, it } from "vitest";

import { createFakeImageStorage } from "./FakeImageStorage.ts";

describe("createFakeImageStorage", () => {
  it("파일명이 반영된 uploadUrl/publicUrl을 반환한다", async () => {
    const storage = createFakeImageStorage();

    const result = await storage.presignUpload({
      filename: "cover.jpg",
      contentType: "image/jpeg",
      byteSize: 1024,
    });

    expect(result.uploadUrl).toContain("cover.jpg");
    expect(result.publicUrl).toContain("cover.jpg");
    expect(result.uploadUrl).not.toBe(result.publicUrl);
  });

  it("호출할 때마다 서로 다른 키를 생성한다", async () => {
    const storage = createFakeImageStorage();

    const a = await storage.presignUpload({
      filename: "cover.jpg",
      contentType: "image/jpeg",
      byteSize: 1024,
    });
    const b = await storage.presignUpload({
      filename: "cover.jpg",
      contentType: "image/jpeg",
      byteSize: 1024,
    });

    expect(a.publicUrl).not.toBe(b.publicUrl);
  });
});
