import { describe, expect, it } from "vitest";

import { compressImage } from "./compress-image.ts";

// 노이즈를 채워 압축률이 비현실적으로 좋아지지 않게 한다.
async function createImageFile(width: number, height: number, name = "photo.png"): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no 2d context");

  const pixels = context.createImageData(width, height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    pixels.data[index] = Math.random() * 255;
    pixels.data[index + 1] = Math.random() * 255;
    pixels.data[index + 2] = Math.random() * 255;
    pixels.data[index + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("no blob");
  return new File([blob], name, { type: "image/png" });
}

async function readSize(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

describe("compressImage", () => {
  it("긴 변을 1600px로 줄이고 WebP로 다시 인코딩한다", async () => {
    const original = await createImageFile(2400, 1600);

    const compressed = await compressImage(original);

    expect(compressed.type).toBe("image/webp");
    expect(compressed.name).toBe("photo.webp");
    await expect(readSize(compressed)).resolves.toEqual({ width: 1600, height: 1067 });
    expect(compressed.size).toBeLessThan(original.size);
  });

  it("이미 작은 이미지는 크기를 늘리지 않는다", async () => {
    const original = await createImageFile(320, 240);

    const compressed = await compressImage(original);

    await expect(readSize(compressed)).resolves.toEqual({ width: 320, height: 240 });
  });

  it("maxEdge 옵션을 따르고 세로 사진도 긴 변 기준으로 줄인다", async () => {
    const portrait = await createImageFile(1200, 2000);

    const compressed = await compressImage(portrait, { maxEdge: 600 });

    await expect(readSize(compressed)).resolves.toEqual({ width: 360, height: 600 });
  });

  it("File을 돌려주므로 업로드에 그대로 쓸 수 있다", async () => {
    const compressed = await compressImage(await createImageFile(2000, 1500, "우리집.사진.png"));

    expect(compressed).toBeInstanceOf(File);
    expect(compressed.name).toBe("우리집.사진.webp");
  });
});
