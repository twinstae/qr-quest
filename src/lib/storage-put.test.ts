import { describe, expect, it } from "vitest";

import { putToStorage } from "./storage-put.ts";

describe("putToStorage", () => {
  it("네트워크가 끊겨 fetch가 던져도 멈추지 않고 실패(false)를 돌려준다", async () => {
    // 아무도 듣지 않는 포트 — 실제로 연결이 거부된다.
    const file = new File([new Uint8Array(8)], "photo.jpg", { type: "image/jpeg" });

    await expect(putToStorage("http://127.0.0.1:1/upload", file)).resolves.toBe(false);
  });
});
