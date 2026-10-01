import { describe, expect, it } from "vitest";

import { TEST_CASE, TEST_THEME_INPUT } from "../../domain/fixtures.ts";
import createFakeCaseRepo from "../../persistence/FakeCaseRepo.ts";
import { createFakeContext } from "../context.ts";
import { createTestClient, signInAndGetCookie } from "../testHelpers.ts";
import { createApp } from "./app.ts";

async function setup() {
  const ctx = createFakeContext({
    repo: { case: createFakeCaseRepo({ [TEST_CASE.id]: TEST_CASE }) },
  });
  const cookie = await signInAndGetCookie(ctx);
  const app = createApp(ctx);
  return { admin: createTestClient(app, { cookie }), guest: createTestClient(app) };
}

describe("theme routes", () => {
  it("인증 없이는 테마를 만들거나 볼 수 없다", async () => {
    const { guest } = await setup();

    expect((await guest.get("/api/themes")).status).toBe(401);
    expect((await guest.post("/api/themes", TEST_THEME_INPUT)).status).toBe(401);
  });

  it("만들고, 고치고, CASE에 걸면 목록에 사용 중인 CASE가 보이고, 지우면 사라진다", async () => {
    const { admin } = await setup();

    const created = await (await admin.post("/api/themes", TEST_THEME_INPUT)).json();
    const updated = await admin.patch(`/api/themes/${created.id}`, {
      ...TEST_THEME_INPUT,
      name: "올리브 숲",
    });
    expect(updated.status).toBe(200);

    const caseResponse = await admin.patch(`/api/cases/${TEST_CASE.id}`, {
      number: TEST_CASE.number,
      title: TEST_CASE.title,
      teaser: TEST_CASE.teaser,
      intro: TEST_CASE.intro,
      themeId: created.id,
    });
    expect((await caseResponse.json()).themeId).toBe(created.id);

    const listed = await (await admin.get("/api/themes")).json();
    expect(listed).toEqual([
      {
        ...TEST_THEME_INPUT,
        id: created.id,
        name: "올리브 숲",
        usedBy: [{ id: TEST_CASE.id, number: 1, title: TEST_CASE.title, status: "DRAFT" }],
      },
    ]);

    expect((await admin.delete(`/api/themes/${created.id}`)).status).toBe(200);
    expect(await (await admin.get("/api/themes")).json()).toEqual([]);
    expect((await (await admin.get(`/api/cases/${TEST_CASE.id}`)).json()).themeId).toBeUndefined();
  });

  it("배경 어둡게 덮기는 0~80%만 받는다", async () => {
    const { admin } = await setup();

    const response = await admin.post("/api/themes", { ...TEST_THEME_INPUT, backgroundDim: 90 });

    expect(response.status).toBe(422);
  });

  it("참가자는 로그인 없이 CASE의 테마를 받고, 테마가 없으면 null을 받는다", async () => {
    const { admin, guest } = await setup();
    expect(await (await guest.get(`/api/play/cases/${TEST_CASE.id}/theme`)).json()).toEqual({
      theme: null,
    });

    const created = await (await admin.post("/api/themes", TEST_THEME_INPUT)).json();
    await admin.patch(`/api/cases/${TEST_CASE.id}`, {
      number: TEST_CASE.number,
      title: TEST_CASE.title,
      teaser: TEST_CASE.teaser,
      intro: TEST_CASE.intro,
      themeId: created.id,
    });

    expect(await (await guest.get(`/api/play/cases/${TEST_CASE.id}/theme`)).json()).toEqual({
      theme: created,
    });
  });

  it("CASE에 테마만 따로 걸고 뗄 수 있다", async () => {
    const { admin, guest } = await setup();
    const created = await (await admin.post("/api/themes", TEST_THEME_INPUT)).json();

    expect((await guest.patch(`/api/cases/${TEST_CASE.id}/theme`, { themeId: null })).status).toBe(
      401,
    );
    const attached = await admin.patch(`/api/cases/${TEST_CASE.id}/theme`, {
      themeId: created.id,
    });
    expect(await attached.json()).toMatchObject({ id: TEST_CASE.id, themeId: created.id });

    const detached = await admin.patch(`/api/cases/${TEST_CASE.id}/theme`, { themeId: null });
    expect((await detached.json()).themeId).toBeUndefined();
    expect(
      (await admin.patch(`/api/cases/${TEST_CASE.id}/theme`, { themeId: "missing" })).status,
    ).toBe(404);
  });
});
