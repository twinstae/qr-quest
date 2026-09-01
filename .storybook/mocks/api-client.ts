// Storybook에는 실제 백엔드가 없다. 진짜 getApiClient를 그대로 쓰면
// @/api/elysia (drizzle → postgres 드라이버까지) 가 정적 import로 딸려 들어와서
// Node 전용 코드(Buffer 등)가 브라우저 번들에 실리고, dev/build 양쪽에서 깨진다.
// 그래서 이 alias는 모든 API 호출 체인을 흉내만 내는 프록시로 바꿔치기한다.
function createMockClient(): unknown {
  const target = () => {};
  return new Proxy(target, {
    get(_target, prop) {
      if (typeof prop === "symbol") return undefined;
      return createMockClient();
    },
    apply() {
      return Promise.resolve({ data: null, error: null });
    },
  });
}

export function getApiClient() {
  return createMockClient();
}
