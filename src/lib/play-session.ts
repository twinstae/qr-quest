import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader, setCookie } from "@tanstack/react-start/server";

import { getApiClient } from "@/lib/api-client";
import {
  mergeSessionTokens,
  PLAY_SESSION_COOKIE,
  readSessionTokens,
  SESSION_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/play-session-cookie";

export type StartSessionResult = {
  token: string;
  caseId: string;
  status: "IN_PROGRESS" | "COMPLETED";
  currentStepOrder: number;
  completionCode?: string;
  resumed: boolean;
};

/**
 * 시작 QR 진입. 서버에서 실행될 때만 쿠키를 쓴다 — Eden Treaty의 in-process 호출은
 * 이 응답의 Set-Cookie를 바깥 응답으로 그대로 흘려보내지 않으므로, TanStack Start의
 * setCookie로 실제 응답에 직접 반영한다. 클라이언트에서는 실제 fetch라 쿠키가
 * 브라우저에 의해 자동으로 처리된다.
 *
 * 쿠키에는 CASE마다 세션 토큰이 쌓인다 — 이 CASE를 시작해도 다른 CASE 세션은 남는다.
 */
export const startOrResumeSession = createIsomorphicFn()
  .server(async (entryToken: string): Promise<StartSessionResult> => {
    const client = getApiClient();
    const existingTokens = readSessionTokens(getRequestHeader("cookie"));
    const { data } = await client.play.sessions.post({ entryToken });
    if (!data) throw new Error(`no case for entryToken=${entryToken}`);
    setCookie(PLAY_SESSION_COOKIE, mergeSessionTokens(existingTokens, data.token).join(","), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });
    return data;
  })
  .client(async (entryToken: string): Promise<StartSessionResult> => {
    const client = getApiClient();
    const { data } = await client.play.sessions.post({ entryToken });
    if (!data) throw new Error(`no case for entryToken=${entryToken}`);
    return data;
  });
