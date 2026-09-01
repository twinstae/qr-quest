import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode } from "lucide-react";

import { css } from "styled-system/css";
import { styled, VStack } from "styled-system/jsx";
import { button } from "styled-system/recipes";

export const Route = createFileRoute("/")({ component: App });

const CenterMain = styled("main", {
  base: {
    minHeight: "screen",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    px: "4",
  },
});

function App() {
  return (
    <CenterMain>
      <VStack gap="4">
        <QrCode className={css({ boxSize: "10", color: "fg.subtle" })} />
        <styled.h1 textStyle="2xl" fontWeight="bold">
          QR Quest
        </styled.h1>
        <styled.p color="fg.muted" maxWidth="sm">
          현장의 QR 코드를 찾아 답을 맞히는 스캐빈저 헌트예요. 참가자는 배치된 QR을 스캔해서
          시작하세요.
        </styled.p>
        <Link to="/admin/login" className={button({ variant: "outline" })}>
          관리자 로그인
        </Link>
      </VStack>
    </CenterMain>
  );
}
