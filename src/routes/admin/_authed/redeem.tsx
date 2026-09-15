import { createFileRoute } from "@tanstack/react-router";

import { RedeemPanel } from "@/components/domains/redeem-panel.tsx";
import type { CompletionCodeStatus } from "@/domain/playSession.ts";
import { getApiClient } from "@/lib/api-client";
import { unwrapPlayResult } from "@/lib/play-client";
import { styled } from "styled-system/jsx";

export const Route = createFileRoute("/admin/_authed/redeem")({
  component: RouteComponent,
});

const Main = styled("main", {
  base: {
    maxWidth: "md",
    marginX: "auto",
    width: "full",
    px: "4",
    py: "10",
  },
});

/**
 * 직원용 리워드 확인. 서버 판정 결과를 컴포넌트 모양으로 그대로 넘긴다 —
 * 화면은 상태 코드가 아니라 kind만 본다(unwrapPlayResult가 4xx도 풀어준다).
 */
function RouteComponent() {
  return (
    <Main>
      <RedeemPanel
        redeem={async (code) => {
          const response = await getApiClient().redeem.post({ code });
          return unwrapPlayResult<CompletionCodeStatus>(response);
        }}
      />
    </Main>
  );
}
