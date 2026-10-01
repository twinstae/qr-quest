import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { given, runSiheom } from "@siheom/react";

import { SimpleImageUpload } from "./simple-field.tsx";
import { FormFieldStory } from "./story-utils.tsx";

// 실제 api-client를 쓰면 서버 전용 모듈(drizzle/postgres)까지 브라우저로 딸려 온다.
const { presignPost } = vi.hoisted(() => ({ presignPost: vi.fn() }));

vi.mock("@/lib/api-client.ts", () => ({
  getApiClient: () => ({ uploads: { presign: { post: presignPost } } }),
}));

const LIMIT_BYTES = 5 * 1024 * 1024;

function tooLargeError(actualBytes: number) {
  return {
    code: "FILE_TOO_LARGE",
    message: "5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요.",
    limitBytes: LIMIT_BYTES,
    actualBytes,
  };
}

function renderField() {
  return (
    <FormFieldStory defaultValues={{ image: undefined }}>
      <SimpleImageUpload name="image" label="문제 이미지" />
    </FormFieldStory>
  );
}

function renderMediaField() {
  return (
    <FormFieldStory defaultValues={{ image: undefined }}>
      <SimpleImageUpload name="image" label="문제 이미지" allowVideo />
    </FormFieldStory>
  );
}

/**
 * 숨겨진 file input에는 접근성 role이 없어 siheom locator로 잡을 수 없다.
 * 파일 선택창이 하는 일(파일 목록 설정 + change 이벤트)을 그대로 흉내낸다.
 */
async function selectFile(file: File): Promise<void> {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("file input not found");

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);

  await act(async () => {
    input.files = dataTransfer.files;
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function statusText(): string | undefined {
  return document.querySelector('[role="status"]')?.textContent ?? undefined;
}

function alertText(): string | undefined {
  return document.querySelector('[role="alert"]')?.textContent ?? undefined;
}

// 압축이 실제로 성공하도록 진짜 이미지를 만든다 (노이즈를 채워 용량이 의미 있게 줄어들게 한다).
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

afterEach(() => {
  presignPost.mockReset();
  vi.unstubAllGlobals();
});

describe("SimpleImageUpload", () => {
  it("업로드 한도와 허용 형식을 안내한다", async () => {
    await runSiheom(given.render(renderField()));

    expect(document.body.textContent).toContain("5MB 이하 · JPG, PNG, WebP, GIF");
  });

  it("한도를 넘으면 버튼 없이 바로 압축해서 올리고 줄어든 크기를 알려준다", async () => {
    const originalBytes = 8 * 1024 * 1024;
    presignPost
      .mockResolvedValueOnce({ data: null, error: tooLargeError(originalBytes) })
      .mockResolvedValueOnce({
        data: {
          uploadUrl: "https://fake-storage.test/upload/1",
          publicUrl: "https://fake-storage.test/public/1.webp",
        },
      });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 })),
    );

    await runSiheom(given.render(renderField()));
    await selectFile(await createImageFile(2400, 1600));

    await vi.waitFor(() => expect(statusText()).toContain("로 줄여서 올렸어요."));
    expect(presignPost).toHaveBeenCalledTimes(2);
    expect(presignPost.mock.calls[1]?.[0]).toMatchObject({ contentType: "image/webp" });
    expect(alertText()).toBeUndefined();
    expect(document.body.textContent).not.toContain("자동 압축해서 올리기");
  });

  it("두 번 줄여도 한도를 넘으면 더 작은 사진을 고르라고 안내한다", async () => {
    presignPost.mockResolvedValue({ data: null, error: tooLargeError(8 * 1024 * 1024) });

    await runSiheom(given.render(renderField()));
    await selectFile(await createImageFile(2400, 1600));

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("더 작은 사진을 골라 주세요."),
    );
    expect(presignPost).toHaveBeenCalledTimes(3);
    expect(alertText()).toBe("5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요.");
  });

  it("GIF는 애니메이션이 사라지므로 압축하지 않는다", async () => {
    presignPost.mockResolvedValue({ data: null, error: tooLargeError(8 * 1024 * 1024) });

    await runSiheom(given.render(renderField()));
    await selectFile(new File([new Uint8Array(64)], "moving.gif", { type: "image/gif" }));

    await vi.waitFor(() =>
      expect(alertText()).toBe("5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요."),
    );
    expect(document.body.textContent).toContain("더 작은 사진을 골라 주세요.");
    expect(presignPost).toHaveBeenCalledTimes(1);
  });

  it("지원하지 않는 형식이면 지원 형식을 알려준다", async () => {
    presignPost.mockResolvedValue({
      data: null,
      error: {
        code: "UNSUPPORTED_FILE_TYPE",
        message: "JPG, PNG, WebP, GIF 파일만 올릴 수 있어요.",
      },
    });

    await runSiheom(given.render(renderField()));
    await selectFile(new File([new Uint8Array(8)], "doc.pdf", { type: "application/pdf" }));

    await vi.waitFor(() => expect(alertText()).toBe("JPG, PNG, WebP, GIF 파일만 올릴 수 있어요."));
  });

  it("allowVideo면 이미지·동영상 한도를 함께 안내한다", async () => {
    await runSiheom(given.render(renderMediaField()));

    expect(document.body.textContent).toContain(
      "이미지 5MB·동영상 25MB 이하 · JPG, PNG, WebP, GIF, MP4",
    );
  });

  it("allowVideo면 mp4를 올릴 수 있고, 한도를 넘어도 자동 압축을 제안하지 않는다", async () => {
    presignPost.mockResolvedValue({
      data: null,
      error: tooLargeError(30 * 1024 * 1024),
    });

    await runSiheom(given.render(renderMediaField()));
    await selectFile(new File([new Uint8Array(64)], "clue.mp4", { type: "video/mp4" }));

    await vi.waitFor(() =>
      expect(alertText()).toBe("5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요."),
    );
    // 압축 버튼이 아니라 "더 작은 동영상을 골라 주세요" 안내만 보인다.
    expect(document.body.textContent).toContain("더 짧거나 작은 동영상을 골라 주세요.");
    expect(document.body.textContent).not.toContain("자동 압축해서 올리기");
  });

  it("기존 값이 동영상이면 video 태그로 미리 보여준다", async () => {
    await runSiheom(
      given.render(
        <FormFieldStory
          defaultValues={{
            image: { src: "https://example.com/clue.mp4", alt: "단서", kind: "video" },
          }}
        >
          <SimpleImageUpload name="image" label="문제 이미지" allowVideo />
        </FormFieldStory>,
      ),
    );

    expect(document.querySelector("video")).not.toBeNull();
    expect(document.querySelector("img")).toBeNull();
  });
});
