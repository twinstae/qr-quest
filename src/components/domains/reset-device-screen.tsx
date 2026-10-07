import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button.tsx";
import { button } from "styled-system/recipes";
import { styled, VStack } from "styled-system/jsx";

type Phase = "RUNNING" | "DONE" | "FAILED";

/**
 * 기기 초기화 화면(/reset). 들어오자마자 지운다 — QR을 찍는 것만으로 끝나야 해서
 * 확인 버튼을 두지 않는다. 지우는 일은 여러 번 해도 결과가 같아서 다시 시도도 안전하다.
 */
export function ResetDeviceScreen({ reset }: { reset: () => Promise<void> }) {
  const [phase, setPhase] = useState<Phase>("RUNNING");

  function run() {
    setPhase("RUNNING");
    reset().then(
      () => setPhase("DONE"),
      () => setPhase("FAILED"),
    );
  }

  // 화면에 들어올 때 한 번만 지운다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(run, []);

  return (
    <VStack minHeight="screen" justify="center" p="4" gap="4" textAlign="center">
      {phase === "RUNNING" && (
        <styled.p color="fg.muted">기기에 저장된 정보를 지우는 중이에요…</styled.p>
      )}
      {phase === "DONE" && (
        <>
          <styled.h1 textStyle="xl" fontWeight="bold">
            기기에 저장된 정보를 지웠어요
          </styled.h1>
          <styled.p color="fg.muted" maxWidth="sm">
            진행 중이던 사건 기록이 이 기기에서 사라졌어요. 시작 QR을 다시 찍으면 처음부터 할 수
            있어요. 관리자 로그인은 그대로 남아 있어요.
          </styled.p>
          {/* 라우터 이동 대신 새로 불러와 메모리에 남은 상태까지 비운다. */}
          <a href="/" className={button({ variant: "outline" })}>
            처음 화면으로
          </a>
        </>
      )}
      {phase === "FAILED" && (
        <>
          <styled.h1 textStyle="xl" fontWeight="bold">
            지우지 못했어요
          </styled.h1>
          <styled.p color="fg.muted">인터넷 연결을 확인하고 다시 시도해 주세요.</styled.p>
          <Button variant="outline" onClick={run}>
            다시 시도
          </Button>
        </>
      )}
    </VStack>
  );
}
