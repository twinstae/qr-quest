import { describe, expect, it } from "vitest";

import { createFakeContext } from "../context.ts";
import { createTestClient, signInAndGetCookie } from "../testHelpers.ts";
import type { Case } from "../../domain/case.ts";
import {
  ANOTHER_CASE,
  ANOTHER_STEP,
  TEST_ADMIN,
  TEST_CASE,
  TEST_STEP,
} from "../../domain/fixtures.ts";
import type { Step } from "../../domain/step.ts";
import { DEFAULT_MAX_IMAGE_BYTES } from "../../domain/upload.ts";
import createFakeCaseRepo from "../../persistence/FakeCaseRepo.ts";
import createFakeStepRepo from "../../persistence/FakeStepRepo.ts";
import { createApp } from "./app.ts";

function appWith(caseItem: Case, steps: Step[] = []) {
  const ctx = createFakeContext({
    repo: {
      case: createFakeCaseRepo({ [caseItem.id]: caseItem }),
      step: createFakeStepRepo(Object.fromEntries(steps.map((step) => [step.id, step]))),
    },
  });
  return createApp(ctx);
}

async function signedInClient(ctx = createFakeContext()) {
  const cookie = await signInAndGetCookie(ctx);
  const app = createApp(ctx);
  return { ctx, app, client: createTestClient(app, { cookie }) };
}

// POST /api/cases와 PATCH /api/cases/:id의 요청 바디는 도메인 Case와 같은 모양이라
// 값만 그대로 옮긴다.
function toCaseRequestBody(item: Case) {
  return {
    number: item.number,
    title: item.title,
    teaser: item.teaser,
    intro: item.intro,
    estimatedMinutes: item.estimatedMinutes,
    thumbnail: item.thumbnail,
    finalBookTitle: item.finalBookTitle,
    rewardNote: item.rewardNote,
  };
}

function toStepRequestBody(step: Step) {
  return {
    name: step.name,
    kind: step.kind,
    title: step.title,
    body: step.body,
    media: step.media,
    reveal: step.reveal,
    question: step.question,
    answerSpec: step.answerSpec,
    placeholder: step.placeholder,
    hint: step.hint,
  };
}

describe("GET /api/cases/by-entry/:entryToken", () => {
  it("시작 토큰으로 CASE를 찾아준다", async () => {
    const client = createTestClient(appWith(TEST_CASE));

    const response = await client.get(`/api/cases/by-entry/${TEST_CASE.entryToken}`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      id: TEST_CASE.id,
      number: TEST_CASE.number,
      title: TEST_CASE.title,
      entryToken: TEST_CASE.entryToken,
    });
  });

  it("없는 토큰은 404를 반환한다", async () => {
    const client = createTestClient(appWith(TEST_CASE));

    expect((await client.get("/api/cases/by-entry/NOPE")).status).toBe(404);
  });
});

describe("/api/auth/* (better-auth mount)", () => {
  it("POST /api/auth/sign-up/email로 가입하고 로그인할 수 있다", async () => {
    const client = createTestClient(createApp(createFakeContext()));

    const signUpResponse = await client.post("/api/auth/sign-up/email", TEST_ADMIN);
    expect(signUpResponse.status).toBe(200);

    const signInResponse = await client.post("/api/auth/sign-in/email", {
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password,
    });
    const payload = await signInResponse.json();

    expect(signInResponse.status).toBe(200);
    expect(payload.user.email).toBe(TEST_ADMIN.email);
  });
});

describe("/api/uploads/presign", () => {
  it("세션이 없으면 401을 반환한다", async () => {
    const client = createTestClient(createApp(createFakeContext()));

    const response = await client.post("/api/uploads/presign", {
      filename: "cover.jpg",
      contentType: "image/jpeg",
      byteSize: 1024,
    });

    expect(response.status).toBe(401);
  });

  it("이미지 파일이면 업로드 URL을 반환한다", async () => {
    const { client } = await signedInClient();

    const response = await client.post("/api/uploads/presign", {
      filename: "cover.jpg",
      contentType: "image/jpeg",
      byteSize: 1024,
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.uploadUrl).toContain("cover.jpg");
    expect(payload.publicUrl).toContain("cover.jpg");
  });

  it("한도를 넘는 파일은 413과 함께 실제 한도/크기를 알려준다", async () => {
    let presignCalls = 0;
    const { client } = await signedInClient(
      createFakeContext({
        imageStorage: {
          async presignUpload() {
            presignCalls++;
            return { uploadUrl: "unused", publicUrl: "unused" };
          },
        },
      }),
    );

    const response = await client.post("/api/uploads/presign", {
      filename: "huge.jpg",
      contentType: "image/jpeg",
      byteSize: Math.round(8.2 * 1024 * 1024),
    });
    const payload = await response.json();

    expect(response.status).toBe(413);
    expect(payload.code).toBe("FILE_TOO_LARGE");
    expect(payload.limitBytes).toBe(DEFAULT_MAX_IMAGE_BYTES);
    expect(payload.actualBytes).toBe(Math.round(8.2 * 1024 * 1024));
    expect(payload.message).toEqual(expect.stringContaining("8.2MB"));
    expect(presignCalls).toBe(0);
  });

  it("이미지가 아닌 파일은 415와 함께 지원 형식을 알려준다", async () => {
    let presignCalls = 0;
    const { client } = await signedInClient(
      createFakeContext({
        imageStorage: {
          async presignUpload() {
            presignCalls++;
            return { uploadUrl: "unused", publicUrl: "unused" };
          },
        },
      }),
    );

    const response = await client.post("/api/uploads/presign", {
      filename: "doc.pdf",
      contentType: "application/pdf",
      byteSize: 1024,
    });
    const payload = await response.json();

    expect(response.status).toBe(415);
    expect(payload.code).toBe("UNSUPPORTED_FILE_TYPE");
    expect(payload.allowedTypes).toContain("image/webp");
    expect(payload.message).toEqual(expect.stringContaining("JPG, PNG, WebP, GIF"));
    expect(presignCalls).toBe(0);
  });
});

describe("/api/cases", () => {
  it("세션이 없으면 401을 반환한다", async () => {
    const client = createTestClient(createApp(createFakeContext()));

    expect((await client.get("/api/cases")).status).toBe(401);
    expect((await client.post("/api/cases", toCaseRequestBody(TEST_CASE))).status).toBe(401);
  });

  it("CASE를 만들면 단계 뼈대가 함께 생긴다 (QR 단계에는 토큰까지)", async () => {
    const { client } = await signedInClient();

    const createResponse = await client.post("/api/cases", toCaseRequestBody(ANOTHER_CASE));
    const created = await createResponse.json();

    expect(createResponse.status).toBe(200);
    expect(created).toMatchObject({
      number: ANOTHER_CASE.number,
      title: ANOTHER_CASE.title,
      teaser: ANOTHER_CASE.teaser,
      intro: ANOTHER_CASE.intro,
      status: "DRAFT",
    });
    expect(created.entryToken).toEqual(expect.any(String));

    const steps = await (await client.get(`/api/cases/${created.id}/steps`)).json();
    expect(steps.map((step: { kind: string }) => step.kind)).toEqual([
      "INTRO",
      "QR",
      "QR",
      "QR",
      "QR",
      "FINAL",
      "CLOSING",
    ]);
    expect(steps[0]).toMatchObject({ order: 0, name: "사건 소개", qrToken: null });
    expect(steps[1].qrToken).toEqual(expect.any(String));
    expect(steps[5]).toMatchObject({ name: "마지막 단서", kind: "FINAL" });
    expect(steps[6]).toMatchObject({ name: "사건 종결", qrToken: null });

    const list = await (await client.get("/api/cases")).json();
    expect(list).toContainEqual(created);
  });

  it("CASE를 지우면 단계도 함께 사라진다", async () => {
    const { client } = await signedInClient();
    const created = await (await client.post("/api/cases", toCaseRequestBody(ANOTHER_CASE))).json();

    const response = await client.delete(`/api/cases/${created.id}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true });
    expect(await (await client.get("/api/cases")).json()).toEqual([]);
    expect(await (await client.get(`/api/cases/${created.id}/steps`)).json()).toEqual([]);
  });

  it("로그인한 상태면 수정할 수 있다", async () => {
    const { client } = await signedInClient(
      createFakeContext({
        repo: { case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE }) },
      }),
    );

    const response = await client.patch(
      `/api/cases/${TEST_CASE.id}`,
      toCaseRequestBody(ANOTHER_CASE),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      id: TEST_CASE.id,
      title: ANOTHER_CASE.title,
      // 시작 토큰은 수정해도 그대로다 — 인쇄한 시작 QR이 계속 살아 있다
      entryToken: TEST_CASE.entryToken,
    });
  });
});

describe("GET /api/steps/:id/edit", () => {
  it("세션이 없으면 401을 반환한다", async () => {
    const client = createTestClient(appWith(TEST_CASE, [TEST_STEP]));

    expect((await client.get(`/api/steps/${TEST_STEP.id}/edit`)).status).toBe(401);
  });

  it("관리자에게는 정답을 포함한 전체 단계를 반환한다", async () => {
    const { client } = await signedInClient(
      createFakeContext({
        repo: {
          case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE }),
          step: createFakeStepRepo({ [TEST_STEP.id]: TEST_STEP }),
        },
      }),
    );

    const response = await client.get(`/api/steps/${TEST_STEP.id}/edit`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      id: TEST_STEP.id,
      caseId: TEST_CASE.id,
      order: TEST_STEP.order,
      name: TEST_STEP.name,
      title: TEST_STEP.title,
      answerSpec: TEST_STEP.answerSpec,
      reveal: TEST_STEP.reveal,
    });
  });

  it("없는 단계는 404를 반환한다", async () => {
    const { client } = await signedInClient();

    expect((await client.get("/api/steps/missing/edit")).status).toBe(404);
  });
});

describe("PATCH /api/steps/:id", () => {
  function ctxWithStep() {
    return createFakeContext({
      repo: {
        case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE }),
        step: createFakeStepRepo({ [TEST_STEP.id]: TEST_STEP }),
      },
    });
  }

  it("세션이 없으면 401을 반환한다", async () => {
    const client = createTestClient(appWith(TEST_CASE, [TEST_STEP]));

    const response = await client.patch(`/api/steps/${TEST_STEP.id}`, toStepRequestBody(TEST_STEP));

    expect(response.status).toBe(401);
  });

  it("내용을 고쳐도 QR 토큰과 순서는 그대로다 (요구 23)", async () => {
    const { client } = await signedInClient(ctxWithStep());

    const response = await client.patch(`/api/steps/${TEST_STEP.id}`, {
      ...toStepRequestBody(ANOTHER_STEP),
      name: TEST_STEP.name,
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      id: TEST_STEP.id,
      caseId: TEST_CASE.id,
      order: TEST_STEP.order,
      title: ANOTHER_STEP.title,
    });

    const steps = await (await client.get(`/api/cases/${TEST_CASE.id}/steps`)).json();
    expect(steps).toEqual([
      expect.objectContaining({ id: TEST_STEP.id, qrToken: TEST_STEP.qrToken }),
    ]);

    // 새 정답으로 바뀌어 저장된다 (참가자 제출 판정은 playRoutes.test.ts에서 검증한다)
    const edited = await (await client.get(`/api/steps/${TEST_STEP.id}/edit`)).json();
    expect(edited.answerSpec).toEqual(ANOTHER_STEP.answerSpec);
  });
});

describe("DELETE /api/steps/:id", () => {
  it("세션이 없으면 401을 반환한다", async () => {
    const client = createTestClient(appWith(TEST_CASE, [TEST_STEP]));

    expect((await client.delete(`/api/steps/${TEST_STEP.id}`)).status).toBe(401);
  });

  it("그 단계만 지우고 같은 CASE의 다른 단계는 남겨둔다", async () => {
    const survivor = { ...ANOTHER_STEP, id: "step-other", caseId: TEST_CASE.id };
    const { client } = await signedInClient(
      createFakeContext({
        repo: {
          case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE }),
          step: createFakeStepRepo({ [TEST_STEP.id]: TEST_STEP, [survivor.id]: survivor }),
        },
      }),
    );

    const response = await client.delete(`/api/steps/${TEST_STEP.id}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true });
    const steps = await (await client.get(`/api/cases/${TEST_CASE.id}/steps`)).json();
    expect(steps).toEqual([expect.objectContaining({ id: survivor.id })]);
  });
});

describe("CASE 편집기 (ticket 13)", () => {
  async function createFullCase(client: ReturnType<typeof createTestClient>) {
    const created = await (await client.post("/api/cases", toCaseRequestBody(TEST_CASE))).json();
    const steps = await (await client.get(`/api/cases/${created.id}/steps`)).json();

    for (const step of steps) {
      if (step.kind === "QR" || step.kind === "FINAL") {
        await client.patch(`/api/steps/${step.id}`, {
          name: step.name,
          kind: step.kind,
          title: "제목",
          body: "본문",
          reveal: {},
          answerSpec: { type: "SHORT_TEXT", accepted: ["정답"], match: "EXACT" },
        });
      }
      if (step.kind === "INTRO") {
        await client.patch(`/api/steps/${step.id}`, {
          name: step.name,
          kind: step.kind,
          title: step.title,
          body: "사건이 시작됩니다.",
          reveal: {},
        });
      }
    }

    return created;
  }

  describe("POST /api/cases/:id/clone", () => {
    it("단계까지 통째로 복제하고 DRAFT로 시작한다", async () => {
      const { client } = await signedInClient();
      const created = await createFullCase(client);

      const response = await client.post(`/api/cases/${created.id}/clone`);
      const cloned = await response.json();

      expect(response.status).toBe(200);
      expect(cloned.id).not.toBe(created.id);
      expect(cloned.status).toBe("DRAFT");
      expect(cloned.entryToken).not.toBe(created.entryToken);

      const clonedSteps = await (await client.get(`/api/cases/${cloned.id}/steps`)).json();
      expect(clonedSteps).toHaveLength(7);
    });
  });

  describe("PATCH /api/cases/:id/status", () => {
    it("완전한 CASE는 LIVE로 바뀐다", async () => {
      const { client } = await signedInClient();
      const created = await createFullCase(client);

      const response = await client.patch(`/api/cases/${created.id}/status`, { status: "LIVE" });

      expect(response.status).toBe(200);
      expect((await response.json()).status).toBe("LIVE");
    });

    it("정답이 빠진 단계가 있으면 400과 위반 목록을 돌려주고 상태는 그대로다", async () => {
      const { client } = await signedInClient();
      const created = await (await client.post("/api/cases", toCaseRequestBody(TEST_CASE))).json();

      const response = await client.patch(`/api/cases/${created.id}/status`, { status: "LIVE" });
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.violations).toEqual(
        expect.arrayContaining([expect.objectContaining({ kind: "MISSING_ANSWER" })]),
      );

      const stillDraft = await (await client.get(`/api/cases/${created.id}`)).json();
      expect(stillDraft.status).toBe("DRAFT");
    });
  });

  describe("PATCH /api/cases/:id/steps/reorder", () => {
    it("주어진 순서대로 저장한다", async () => {
      const { client } = await signedInClient();
      const created = await createFullCase(client);
      const steps = await (await client.get(`/api/cases/${created.id}/steps`)).json();
      const reversedIds = [...steps].reverse().map((step: { id: string }) => step.id);

      const response = await client.patch(`/api/cases/${created.id}/steps/reorder`, {
        orderedStepIds: reversedIds,
      });
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.map((step: { id: string }) => step.id)).toEqual(reversedIds);
      expect(payload.map((step: { order: number }) => step.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
  });

  describe("POST /api/cases/:id/test-session", () => {
    it("isTest 세션을 만들어 토큰을 돌려준다", async () => {
      const { client } = await signedInClient();
      const created = await createFullCase(client);

      const response = await client.post(`/api/cases/${created.id}/test-session`);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.token).toEqual(expect.any(String));
      expect(payload.caseId).toBe(created.id);
    });

    it("참가 세션 쿠키를 그대로 심어준다 — 관리자가 /play로 바로 넘어갈 수 있게", async () => {
      const { client } = await signedInClient();
      const created = await createFullCase(client);

      const response = await client.post(`/api/cases/${created.id}/test-session`);
      const payload = await response.json();
      const setCookie = response.headers.get("set-cookie") ?? "";

      expect(setCookie).toContain(`qr_play_session=${payload.token}`);
      expect(setCookie).toContain("HttpOnly");
    });
  });

  describe("POST /api/cases/:id/test-session/step-back", () => {
    it("진행 중인 테스트 세션이 있으면 ok=true를 돌려준다", async () => {
      const { client } = await signedInClient();
      const created = await createFullCase(client);
      await client.post(`/api/cases/${created.id}/test-session`);

      const response = await client.post(`/api/cases/${created.id}/test-session/step-back`);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload).toEqual({ ok: true });
    });

    it("테스트 세션이 없으면 ok=false를 돌려준다", async () => {
      const { client } = await signedInClient();
      const created = await createFullCase(client);

      const response = await client.post(`/api/cases/${created.id}/test-session/step-back`);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload).toEqual({ ok: false });
    });
  });

  describe("POST /api/cases/:id/test-session/reset-completion", () => {
    it("완료되지 않은 테스트 세션이면 ok=true(변화 없음)를 돌려준다", async () => {
      const { client } = await signedInClient();
      const created = await createFullCase(client);
      await client.post(`/api/cases/${created.id}/test-session`);

      const response = await client.post(`/api/cases/${created.id}/test-session/reset-completion`);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload).toEqual({ ok: true });
    });

    it("테스트 세션이 없으면 ok=false를 돌려준다", async () => {
      const { client } = await signedInClient();
      const created = await createFullCase(client);

      const response = await client.post(`/api/cases/${created.id}/test-session/reset-completion`);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload).toEqual({ ok: false });
    });
  });

  describe("GET /api/steps/:id/preview", () => {
    it("공개하지 않은 단계도 초안을 그대로 보여준다", async () => {
      const { client } = await signedInClient();
      const created = await (await client.post("/api/cases", toCaseRequestBody(TEST_CASE))).json();
      const steps = await (await client.get(`/api/cases/${created.id}/steps`)).json();
      const draftStep = steps.find((step: { kind: string }) => step.kind === "QR");

      const response = await client.get(`/api/steps/${draftStep.id}/preview`);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.id).toBe(draftStep.id);
      expect(JSON.stringify(payload)).not.toContain("accepted");
    });
  });

  describe("GET /api/cases/:id/qr-check", () => {
    it("이 CASE의 단계 토큰이면 준비 완료를 알려준다", async () => {
      const { client } = await signedInClient();
      const created = await (await client.post("/api/cases", toCaseRequestBody(TEST_CASE))).json();
      const steps = await (await client.get(`/api/cases/${created.id}/steps`)).json();
      const qrStep = steps.find((step: { qrToken: string | null }) => step.qrToken);

      const response = await client.get(
        `/api/cases/${created.id}/qr-check?token=${qrStep.qrToken}`,
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        kind: "READY",
        label: qrStep.name,
        title: qrStep.title,
      });
    });

    it("아무 데도 없는 토큰은 미발급으로 본다", async () => {
      const { client } = await signedInClient();
      const created = await (await client.post("/api/cases", toCaseRequestBody(TEST_CASE))).json();

      const response = await client.get(`/api/cases/${created.id}/qr-check?token=NOPE`);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ kind: "UNKNOWN" });
    });
  });

  describe("토큰 재발급", () => {
    it("POST /api/cases/:id/entry-token/reissue는 새 시작 토큰을 돌려준다", async () => {
      const { client } = await signedInClient();
      const created = await (await client.post("/api/cases", toCaseRequestBody(TEST_CASE))).json();

      const response = await client.post(`/api/cases/${created.id}/entry-token/reissue`);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.entryToken).not.toBe(created.entryToken);
    });

    it("POST /api/steps/:id/qr-token/reissue는 새 QR 토큰을 돌려준다", async () => {
      const { client } = await signedInClient();
      const created = await (await client.post("/api/cases", toCaseRequestBody(TEST_CASE))).json();
      const steps = await (await client.get(`/api/cases/${created.id}/steps`)).json();
      const qrStep = steps.find((step: { qrToken: string | null }) => step.qrToken);

      const response = await client.post(`/api/steps/${qrStep.id}/qr-token/reissue`);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.qrToken).not.toBe(qrStep.qrToken);
      expect(payload.qrToken).toEqual(expect.any(String));
    });
  });
});
