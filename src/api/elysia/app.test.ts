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

describe("GET /api/steps/qr/:qrToken", () => {
  it("QR 토큰으로 단계를 찾아주지만 정답은 내려보내지 않는다", async () => {
    const client = createTestClient(appWith(TEST_CASE, [TEST_STEP]));

    const response = await client.get(`/api/steps/qr/${TEST_STEP.qrToken}`);
    const payload = await response.json();
    const raw = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      id: TEST_STEP.id,
      name: TEST_STEP.name,
      kind: "QR",
      order: TEST_STEP.order,
      title: TEST_STEP.title,
      body: TEST_STEP.body,
      media: TEST_STEP.media,
      question: TEST_STEP.question,
      placeholder: TEST_STEP.placeholder,
      hint: TEST_STEP.hint,
    });
    expect(payload.answerSpec).toEqual({ type: "SHORT_TEXT" });

    // 정답 문자열은 어떤 모양으로도 응답에 담기지 않는다
    expect(raw).not.toContain("이민열");
    expect(raw).not.toContain("accepted");
    expect(raw).not.toContain("correctChoiceIds");
  });

  it("없는 QR 토큰은 404를 반환한다", async () => {
    const client = createTestClient(createApp(createFakeContext()));

    const response = await client.get("/api/steps/qr/NOPE");

    expect(response.status).toBe(404);
  });
});

describe("POST /api/steps/:id/submit-answer", () => {
  it("정답을 맞추면 공개할 단서를 반환한다", async () => {
    const client = createTestClient(appWith(TEST_CASE, [TEST_STEP]));

    const response = await client.post(`/api/steps/${TEST_STEP.id}/submit-answer`, {
      answer: `  ${TEST_STEP.answerSpec?.type === "SHORT_TEXT" ? TEST_STEP.answerSpec.accepted[0] : ""}  `,
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ correct: true, reveal: TEST_STEP.reveal });
  });

  it("오답은 실패가 아니라 correct:false로 돌려준다", async () => {
    const client = createTestClient(appWith(TEST_CASE, [TEST_STEP]));

    const response = await client.post(`/api/steps/${TEST_STEP.id}/submit-answer`, {
      answer: "틀린 답",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ correct: false });
  });

  it("객관식은 고른 보기 id로 채점한다", async () => {
    const choiceStep: Step = {
      ...TEST_STEP,
      id: "step-choice",
      qrToken: "QRTOKEN003",
      answerSpec: {
        type: "SINGLE_CHOICE",
        choices: [
          { id: "A", label: "첫 번째" },
          { id: "B", label: "두 번째" },
        ],
        correctChoiceIds: ["B"],
      },
    };
    const client = createTestClient(appWith(TEST_CASE, [choiceStep]));

    const wrong = await client.post(`/api/steps/${choiceStep.id}/submit-answer`, {
      choiceIds: ["A"],
    });
    expect(await wrong.json()).toEqual({ correct: false });

    const right = await client.post(`/api/steps/${choiceStep.id}/submit-answer`, {
      choiceIds: ["B"],
    });
    expect(await right.json()).toEqual({ correct: true, reveal: TEST_STEP.reveal });
  });
});

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

    // 새 정답으로만 풀 수 있다
    expect(
      await (
        await client.post(`/api/steps/${TEST_STEP.id}/submit-answer`, {
          answer: TEST_STEP.answerSpec?.type === "SHORT_TEXT" ? "이민열, 김도균" : "",
        })
      ).json(),
    ).toEqual({ correct: false });

    expect(
      await (
        await client.post(`/api/steps/${TEST_STEP.id}/submit-answer`, { answer: "다른 정답" })
      ).json(),
    ).toMatchObject({ correct: true });
  });
});
