// 브라우저 테스트와 Storybook에서 @/lib/api-client 대신 alias로 연결되는 가짜 API 클라이언트.
// 진짜를 쓰면 @/api/elysia(drizzle → postgres 드라이버)까지 브라우저로 딸려 온다.
//
// 업로드는 서버와 같은 도메인 규칙(validateMediaUpload)으로 판단하므로, 413/415 응답 모양과
// 문구가 실제와 같다. 그 밖의 호출은 { data: null, error: null }을 돌려준다.
import type { PlayProgressResult, SubmitAnswerResult } from "@/application/playService.ts";
import { FileTooLargeError, UnsupportedFileTypeError } from "@/domain/errors.ts";
import {
  DEFAULT_MAX_IMAGE_BYTES,
  DEFAULT_MAX_VIDEO_BYTES,
  validateMediaUpload,
} from "@/domain/upload.ts";

type PresignInput = { filename: string; contentType: string; byteSize: number };

/** 테스트가 조절하고 확인할 수 있는 가짜 서버 상태. 테스트마다 reset()으로 되돌린다. */
export const fakeServer = {
  maxImageBytes: DEFAULT_MAX_IMAGE_BYTES,
  maxVideoBytes: DEFAULT_MAX_VIDEO_BYTES,
  presigned: [] as PresignInput[],
  /** `GET /play/cases/:caseId/progress`가 돌려줄 진행. */
  playProgress: undefined as PlayProgressResult | undefined,
  /** `POST /play/steps/:id/submit-answer`가 돌려줄 결과. */
  submitAnswerResult: undefined as SubmitAnswerResult | undefined,
  reset() {
    fakeServer.maxImageBytes = DEFAULT_MAX_IMAGE_BYTES;
    fakeServer.maxVideoBytes = DEFAULT_MAX_VIDEO_BYTES;
    fakeServer.presigned = [];
    fakeServer.playProgress = undefined;
    fakeServer.submitAnswerResult = undefined;
  },
};

async function presign(input: PresignInput) {
  fakeServer.presigned.push(input);
  try {
    validateMediaUpload({
      contentType: input.contentType,
      byteSize: input.byteSize,
      maxImageBytes: fakeServer.maxImageBytes,
      maxVideoBytes: fakeServer.maxVideoBytes,
    });
  } catch (error) {
    // Eden Treaty가 실패를 감싸는 모양 그대로: { status, value: 응답 바디 }
    if (error instanceof FileTooLargeError) {
      const value = {
        code: "FILE_TOO_LARGE",
        message: error.message,
        limitBytes: error.limitBytes,
        actualBytes: error.actualBytes,
      };
      return { data: null, error: { status: 413, value } };
    }
    if (error instanceof UnsupportedFileTypeError) {
      const value = { code: "UNSUPPORTED_FILE_TYPE", message: error.message };
      return { data: null, error: { status: 415, value } };
    }
    throw error;
  }

  const key = `${fakeServer.presigned.length}-${input.filename}`;
  return {
    data: {
      uploadUrl: `https://fake-storage.test/upload/${key}`,
      publicUrl: `https://fake-storage.test/public/${key}`,
    },
    error: null,
  };
}

const IMPLEMENTED: Record<string, unknown> = {
  uploads: { presign: { post: presign } },
  play: {
    steps: () => ({
      "submit-answer": {
        post: async () => ({ data: fakeServer.submitAnswerResult ?? null, error: null }),
      },
    }),
    cases: () => ({
      progress: { get: async () => ({ data: fakeServer.playProgress ?? null, error: null }) },
    }),
  },
};

/** 구현한 경로는 그대로, 나머지 호출 체인은 빈 응답으로 흉내 낸다. */
function chain(implemented: unknown): unknown {
  const target = () => {};
  return new Proxy(target, {
    get(_target, prop) {
      if (typeof prop === "symbol") return undefined;
      const next =
        implemented && typeof implemented === "object"
          ? (implemented as Record<string, unknown>)[prop]
          : undefined;
      return chain(next);
    },
    apply(_target, _this, args) {
      if (typeof implemented === "function") return implemented(...args);
      return Promise.resolve({ data: null, error: null });
    },
  });
}

export function getApiClient(): unknown {
  return chain(IMPLEMENTED);
}
