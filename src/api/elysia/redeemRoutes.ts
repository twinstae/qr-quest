import { Elysia, status, t } from "elysia";

import { redeemCompletionCode } from "../../application/redeemService.ts";
import type { AppContext } from "../context.ts";
import {
  RedeemAlreadyRedeemedSchema,
  RedeemTestSessionSchema,
  RedeemUnknownSchema,
  RedeemValidSchema,
} from "./schemas.ts";

/**
 * 직원용 리딤(요구 14). 4글자 입력 → 즉시 판정이 목적이라 응답은 `{ kind }` 하나뿐이다.
 * 판정을 화면 문자열로 바꾸는 건 클라이언트 몫이고, 서버는 사실만 돌려준다.
 *
 * 인증이 필요한 이유: 코드를 아무나 조회·소진할 수 있으면 리워드가 그대로 샌다.
 */
export function createRedeemRoutes(ctx: AppContext) {
  return new Elysia({ name: "redeem-routes" }).post(
    "/redeem",
    async ({ body }) => {
      const result = await redeemCompletionCode(ctx, { code: body.code });
      switch (result.kind) {
        case "VALID":
          return result;
        case "ALREADY_REDEEMED":
          return status(409, result);
        case "TEST_SESSION":
          return status(403, result);
        case "UNKNOWN":
          return status(404, result);
      }
    },
    {
      auth: true,
      body: t.Object({ code: t.String() }),
      response: {
        200: RedeemValidSchema,
        403: RedeemTestSessionSchema,
        404: RedeemUnknownSchema,
        409: RedeemAlreadyRedeemedSchema,
      },
    },
  );
}
