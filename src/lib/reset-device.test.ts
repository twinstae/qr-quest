import { describe, expect, it } from "vitest";

import { resetDevice } from "./reset-device.ts";

function openDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

describe("resetDevice", () => {
  it("세션 쿠키를 지우고 브라우저 저장소(localStorage·sessionStorage·캐시·IndexedDB)를 비운다", async () => {
    window.localStorage.setItem("theme", "dark");
    window.sessionStorage.setItem("qr-quest-sound-enabled", "true");
    await (await caches.open("reset-device-test")).put("/x", new Response("x"));
    await openDatabase("reset-device-test");
    let cookieCleared = false;

    await resetDevice(async () => {
      cookieCleared = true;
    });

    expect(cookieCleared).toBe(true);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(await caches.keys()).toEqual([]);
    const databases = await indexedDB.databases();
    expect(databases.map((db) => db.name)).not.toContain("reset-device-test");
  });

  it("세션 쿠키를 못 지우면 실패로 알린다", async () => {
    await expect(
      resetDevice(async () => {
        throw new Error("network");
      }),
    ).rejects.toThrow("network");
  });
});
