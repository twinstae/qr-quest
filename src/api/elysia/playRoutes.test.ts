import { describe, expect, it } from "vitest";

import { createFakeContext } from "../context.ts";
import { ANOTHER_CASE, TEST_CASE, TEST_STEP } from "../../domain/fixtures.ts";
import { DEFAULT_CORRECT_MESSAGE, DEFAULT_WRONG_MESSAGE, type Step } from "../../domain/step.ts";
import createFakeCaseRepo from "../../persistence/FakeCaseRepo.ts";
import createFakeStepRepo from "../../persistence/FakeStepRepo.ts";
import { createApp } from "./app.ts";
import { PLAY_SESSION_COOKIE } from "./playRoutes.ts";

const INTRO_STEP: Step = {
  id: "step-intro",
  caseId: TEST_CASE.id,
  order: 0,
  kind: "INTRO",
  name: "사건 소개",
  qrToken: null,
  published: true,
  title: "사건이 시작됩니다",
  body: "",
  reveal: {},
};

const FINAL_STEP: Step = {
  ...TEST_STEP,
  id: "step-final",
  order: 5,
  kind: "FINAL",
  name: "마지막 단서",
  qrToken: "QRTOKENFIN",
};

function appWith(steps: Step[] = [INTRO_STEP, TEST_STEP, FINAL_STEP]) {
  const ctx = createFakeContext({
    repo: {
      case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE, [ANOTHER_CASE.id]: ANOTHER_CASE }),
      step: createFakeStepRepo(Object.fromEntries(steps.map((step) => [step.id, step]))),
    },
  });
  return createApp(ctx);
}

// 세션 토큰마다 쿠키가 달라지므로, 매 요청 헤더를 직접 넣을 수 있는 얇은 클라이언트를 쓴다.
function rawClient(app: ReturnType<typeof createApp>) {
  async function request(
    method: string,
    path: string,
    options: { body?: unknown; token?: string } = {},
  ) {
    const headers: Record<string, string> = {};
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (options.token) headers.cookie = `${PLAY_SESSION_COOKIE}=${options.token}`;

    const response = await app.handle(
      new Request(`http://localhost${path}`, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      }),
    );
    return { status: response.status, json: () => response.json() };
  }

  return {
    get: (path: string, token?: string) => request("GET", path, { token }),
    post: (path: string, body: unknown = {}, token?: string) =>
      request("POST", path, { body, token }),
  };
}

async function startSession(app: ReturnType<typeof createApp>, entryToken = TEST_CASE.entryToken) {
  const client = rawClient(app);
  const response = await client.post("/api/play/sessions", { entryToken });
  return response.json() as Promise<{ token: string; currentStepOrder: number }>;
}

describe("GET /api/play/steps/:qrToken", () => {
  it("정답 정보 없이 단계 내용을 돌려준다", async () => {
    const app = appWith();
    const client = rawClient(app);
    const session = await startSession(app);
    await client.post(`/api/play/steps/${INTRO_STEP.id}/advance`, {}, session.token);

    const response = await client.get(`/api/play/steps/qr/${TEST_STEP.qrToken}`, session.token);
    const payload = await response.json();
    const raw = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(payload.kind).toBe("ALLOWED");
    expect(raw).not.toContain("accepted");
    expect(raw).not.toContain("correctChoiceIds");
    expect(raw).not.toContain("이민열");
  });

  it("순서를 건너뛰면 423과 현재 단계 안내를 돌려준다", async () => {
    const app = appWith();
    const client = rawClient(app);
    const session = await startSession(app);

    // INTRO를 지나지 않은 채로 바로 마지막 단계를 요청한다
    const response = await client.get(`/api/play/steps/qr/${FINAL_STEP.qrToken}`, session.token);
    const payload = await response.json();

    expect(response.status).toBe(423);
    expect(payload).toMatchObject({
      kind: "LOCKED",
      currentStepOrder: INTRO_STEP.order,
      requestedOrder: FINAL_STEP.order,
      stepName: INTRO_STEP.name,
    });
  });

  it("세션 없이 요청하면 서버 에러가 아닌 안내 상태를 돌려준다", async () => {
    const app = appWith();
    const client = rawClient(app);

    const response = await client.get(`/api/play/steps/qr/${TEST_STEP.qrToken}`);
    const payload = await response.json();

    expect(response.status).toBeLessThan(500);
    expect(payload).toEqual({ kind: "NOT_STARTED", caseId: TEST_CASE.id });
  });

  it("다른 CASE의 QR을 찍으면 서버 에러가 아닌 안내 상태를 돌려준다", async () => {
    const app = appWith();
    const client = rawClient(app);
    const session = await startSession(app, ANOTHER_CASE.entryToken);

    const response = await client.get(`/api/play/steps/qr/${TEST_STEP.qrToken}`, session.token);
    const payload = await response.json();

    expect(response.status).toBeLessThan(500);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(payload).toMatchObject({ kind: "OTHER_CASE" });
  });

  it("없는 QR 토큰은 404를 반환한다", async () => {
    const app = appWith();
    const client = rawClient(app);

    const response = await client.get("/api/play/steps/qr/NOPE");

    expect(response.status).toBe(404);
  });
});

describe("POST /api/play/steps/:id/submit-answer", () => {
  it("정답을 맞히면 currentStepOrder가 전진한다", async () => {
    const app = appWith();
    const client = rawClient(app);
    const session = await startSession(app);
    await client.post(`/api/play/steps/${INTRO_STEP.id}/advance`, {}, session.token);

    const response = await client.post(
      `/api/play/steps/${TEST_STEP.id}/submit-answer`,
      { answer: "이민열, 김도균" },
      session.token,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      kind: "CORRECT",
      reveal: TEST_STEP.reveal,
      message: DEFAULT_CORRECT_MESSAGE,
    });
  });

  it("오답은 실패가 아니라 횟수 제한 없이 다시 시도할 수 있다", async () => {
    const app = appWith();
    const client = rawClient(app);
    const session = await startSession(app);
    await client.post(`/api/play/steps/${INTRO_STEP.id}/advance`, {}, session.token);

    for (let i = 0; i < 3; i++) {
      const response = await client.post(
        `/api/play/steps/${TEST_STEP.id}/submit-answer`,
        { answer: "엉뚱한 답" },
        session.token,
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ kind: "INCORRECT", message: DEFAULT_WRONG_MESSAGE });
    }
  });

  it("잠긴 단계에 제출하면 423을 반환한다", async () => {
    const app = appWith();
    const client = rawClient(app);
    const session = await startSession(app);

    const response = await client.post(
      `/api/play/steps/${FINAL_STEP.id}/submit-answer`,
      { answer: "아무거나" },
      session.token,
    );

    expect(response.status).toBe(423);
  });
});

describe("POST /api/play/steps/:id/hint", () => {
  it("힌트를 돌려주고, 반복 요청해도 서버 에러 없이 같은 결과를 돌려준다", async () => {
    const app = appWith();
    const client = rawClient(app);
    const session = await startSession(app);
    await client.post(`/api/play/steps/${INTRO_STEP.id}/advance`, {}, session.token);

    const first = await client.post(`/api/play/steps/${TEST_STEP.id}/hint`, {}, session.token);
    const second = await client.post(`/api/play/steps/${TEST_STEP.id}/hint`, {}, session.token);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await first.json()).toEqual({ kind: "HINT", hint: TEST_STEP.hint });
    expect(await second.json()).toEqual({ kind: "HINT", hint: TEST_STEP.hint });
  });
});

describe("POST /api/play/sessions", () => {
  it("시작 QR을 찍으면 세션을 만든다", async () => {
    const app = appWith();

    const session = await startSession(app);

    expect(session.token).toEqual(expect.any(String));
    expect(session.currentStepOrder).toBe(INTRO_STEP.order);
  });

  it("같은 시작 QR을 다시 스캔하면 기존 세션을 이어간다", async () => {
    const app = appWith();
    const client = rawClient(app);
    const first = await startSession(app);
    await client.post(`/api/play/steps/${INTRO_STEP.id}/advance`, {}, first.token);

    const second = await (
      await app.handle(
        new Request("http://localhost/api/play/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: `${PLAY_SESSION_COOKIE}=${first.token}`,
          },
          body: JSON.stringify({ entryToken: TEST_CASE.entryToken }),
        }),
      )
    ).json();

    expect(second.token).toBe(first.token);
    expect(second.currentStepOrder).toBe(TEST_STEP.order);
    expect(second.resumed).toBe(true);
  });

  it("없는 시작 토큰은 404를 반환한다", async () => {
    const app = appWith();

    const response = await app.handle(
      new Request("http://localhost/api/play/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryToken: "NOPE" }),
      }),
    );

    expect(response.status).toBe(404);
  });
});

describe("GET /api/play/cases/:caseId/progress", () => {
  it("세션이 없으면 NOT_STARTED를 돌려준다", async () => {
    const app = appWith();
    const client = rawClient(app);

    const response = await client.get(`/api/play/cases/${TEST_CASE.id}/progress`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ kind: "NOT_STARTED" });
  });

  it("INTRO 단계에서는 소개 내용을 돌려준다", async () => {
    const app = appWith();
    const session = await startSession(app);
    const client = rawClient(app);

    const response = await client.get(`/api/play/cases/${TEST_CASE.id}/progress`, session.token);
    const payload = await response.json();

    expect(payload.kind).toBe("NARRATIVE");
    expect(payload.step.id).toBe(INTRO_STEP.id);
  });
});
