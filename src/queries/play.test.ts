import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";

import type { PlayProgressResult } from "@/application/playService.ts";
import { fakeServer } from "@/lib/api-client.fake.ts";
import { playProgressQueryOptions, submitPlayAnswer } from "./play.ts";

const WAITING_QR1: PlayProgressResult = {
  kind: "WAITING",
  stepName: "QR 01",
  anyOrder: false,
  stamps: [],
  hints: [],
};
const WAITING_QR2: PlayProgressResult = { ...WAITING_QR1, stepName: "QR 02" };
const STEP = { id: "step-1", caseId: "case-1" };

afterEach(() => fakeServer.reset());

/** 앱과 같은 기본값 — 30초 안에는 캐시를 그대로 쓴다. */
function appQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
}

/** 진행 화면(`/play/$caseId`) 로더가 하는 일. */
function visitPlayScreen(queryClient: QueryClient) {
  return queryClient.query(playProgressQueryOptions(STEP.caseId));
}

describe("submitPlayAnswer", () => {
  // 재현: 진행 화면(QR 01 찾기) → 앱 안 카메라로 QR 01 → 30초 안에 정답 → [다음 단서 찾기]
  // → 캐시에 남은 "QR 01 차례"가 그대로 나와 같은 문제를 또 찾으라고 했다.
  it("정답을 맞히면 진행 캐시를 무효화해, 진행 화면이 서버의 지금 진행을 보여준다", async () => {
    const queryClient = appQueryClient();
    fakeServer.playProgress = WAITING_QR1;
    expect(await visitPlayScreen(queryClient)).toEqual(WAITING_QR1);

    fakeServer.submitAnswerResult = { kind: "CORRECT", reveal: {}, message: "정답" };
    fakeServer.playProgress = WAITING_QR2;
    await submitPlayAnswer(queryClient, STEP, { type: "TEXT", value: "정답" });

    expect(await visitPlayScreen(queryClient)).toEqual(WAITING_QR2);
  });

  it("오답이면 진행이 바뀌지 않으니 캐시를 그대로 쓴다", async () => {
    const queryClient = appQueryClient();
    fakeServer.playProgress = WAITING_QR1;
    await visitPlayScreen(queryClient);

    fakeServer.submitAnswerResult = { kind: "INCORRECT", message: "다시" };
    fakeServer.playProgress = WAITING_QR2;
    await submitPlayAnswer(queryClient, STEP, { type: "TEXT", value: "오답" });

    expect(await visitPlayScreen(queryClient)).toEqual(WAITING_QR1);
  });
});
