/**
 * 이 기기에 저장된 참가 정보를 모두 지운다 (/reset).
 * 버그나 잘못된 조작으로 저장된 상태가 꼬여 같은 에러가 반복될 때 쓴다.
 * 참가 세션 쿠키는 httpOnly라 서버가 지우고(clearSessionCookie), 나머지 브라우저
 * 저장소는 여기서 비운다. 관리자 로그인 쿠키는 건드리지 않는다.
 */
export async function resetDevice(clearSessionCookie: () => Promise<void>): Promise<void> {
  await clearSessionCookie();
  window.localStorage.clear();
  window.sessionStorage.clear();
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  if ("indexedDB" in window && "databases" in indexedDB) {
    const databases = await indexedDB.databases();
    await Promise.all(databases.map((db) => db.name && deleteDatabase(db.name)));
  }
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    // 다른 탭이 열고 있어 막혀도(onblocked) 기다리지 않는다 — 탭이 닫히면 지워진다.
    request.onsuccess = request.onerror = request.onblocked = () => resolve();
  });
}
