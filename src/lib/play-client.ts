// 참가 세션 쿠키 이름 — 서버(에lysia 라우트)와 클라이언트가 반드시 같은 값을 쓰도록
// src/lib/play-session-cookie.ts 한 곳에서 정의한다.
export { PLAY_SESSION_COOKIE } from "./play-session-cookie.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Eden Treaty는 실패를 `{ status, value: <서버 응답 바디> }`로 감싸서 준다.
 * play 라우트는 성공/잠금 결과 모두 `{ kind: ... }` 모양이라, 어느 쪽이든
 * 이 함수 하나로 풀어내면 화면은 항상 `.kind`만 보고 분기할 수 있다.
 */
export function unwrapPlayResult<T extends { kind: string }>(response: {
  data: T | null;
  error: unknown;
}): T {
  if (response.data) return response.data;
  const payload = response.error;
  if (isRecord(payload) && isRecord(payload.value)) return payload.value as T;
  return payload as T;
}
