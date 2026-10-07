// 참가 세션 쿠키. 서버(에lysia 라우트)와 클라이언트(시작 화면 loader)가 같은 값을 쓴다.
export const PLAY_SESSION_COOKIE = "qr_play_session";

export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// 한 기기에 쌓을 수 있는 최대 세션 수 — CASE가 늘어나도 쿠키가 커지지 않게 한다.
const MAX_SESSION_TOKENS = 8;

/**
 * 쿠키에 담긴 세션 토큰들. 한 기기에서 여러 CASE를 동시에 이어서 하므로 토큰도 여럿이다
 * (쉼표로 이어 붙인다 — 토큰은 쉼표를 만들지 않는 글자 집합이라 안전하다).
 */
export function readSessionTokens(cookieHeader: string | undefined): string[] {
  if (!cookieHeader) return [];
  const prefix = `${PLAY_SESSION_COOKIE}=`;
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
  if (!value) return [];
  return value
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token !== "");
}

/** 새 세션 토큰을 이어 붙인다. 이미 있으면 뒤로 옮겨 최신으로 쓰게 한다. */
export function mergeSessionTokens(existing: string[], token: string): string[] {
  return [...existing.filter((item) => item !== token), token].slice(-MAX_SESSION_TOKENS);
}

/** httpOnly 쿠키 값. 여러 CASE 세션을 한 줄에 담는다. */
export function sessionCookieHeader(tokens: string[]): string {
  return `${PLAY_SESSION_COOKIE}=${tokens.join(",")}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}`;
}

/** 참가 세션 쿠키를 지우는 값. 기기 초기화(/reset)에서 쓴다 — 관리자 로그인 쿠키는 따로라 남는다. */
export function clearedSessionCookieHeader(): string {
  return `${PLAY_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
