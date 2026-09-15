import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { formatCaseNumber } from "@/domain/case.ts";
import { formatClock } from "@/lib/format-time.ts";
import { css } from "styled-system/css";
import { styled, VStack } from "styled-system/jsx";

/**
 * 화면이 그대로 보여줄 수 있는 판정 결과. 서버 응답(RedeemResult)을 페이지에서
 * 이 모양으로 넘긴다 — 이 컴포넌트는 네트워크도, 코드 판정 규칙도 모른다.
 */
export type RedeemView =
  | {
      kind: "VALID";
      caseNumber: number;
      caseTitle: string;
      completedAt?: string;
      todayCount: number;
    }
  | { kind: "ALREADY_REDEEMED"; redeemedAt: string }
  | { kind: "TEST_SESSION" }
  | { kind: "UNKNOWN" };

/** 판정 결과 한 줄. 색만으로 구분하지 않는다 — 아이콘과 문장이 함께 달라진다. */
const Banner = styled("p", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "3",
    borderRadius: "l2",
    px: "4",
    py: "3",
    textStyle: "lg",
    fontWeight: "medium",
    textAlign: "start",
    _icon: { boxSize: "6", flexShrink: "0" },
  },
  variants: {
    tone: {
      ok: { bg: "green.subtle.bg", color: "green.subtle.fg" },
      rejected: { bg: "red.subtle.bg", color: "red.subtle.fg" },
    },
  },
});

/**
 * 직원용 리워드 확인(요구 14). 목표는 하나 — 참가자 화면의 네 글자를 받아
 * **1초 안에 건네줘도 되는지 아닌지** 판단하는 것. 그래서 입력창 하나와 결과 한 줄뿐이다.
 */
type ValidView = Extract<RedeemView, { kind: "VALID" }>;

/** 사건 01 · 오후 3:12 완료 · 오늘 3번째. 없는 정보는 빼고 한 줄로 만든다. */
function describeValid(result: ValidView): string {
  const completedClock = formatClock(result.completedAt);
  return [
    `${formatCaseNumber(result.caseNumber)} ${result.caseTitle}`.trim(),
    completedClock && `${completedClock} 완료`,
    `오늘 ${result.todayCount}번째`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function RedeemPanel({ redeem }: { redeem: (code: string) => Promise<RedeemView> }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RedeemView | undefined>();
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = code.trim();
    if (!value || busy) return;

    setBusy(true);
    setFailed(false);
    try {
      setResult(await redeem(value));
      // 다음 참가자를 바로 받을 수 있게 입력창을 비운다 — 결과는 아래에 남는다.
      setCode("");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card.Root variant="elevated" width="full" maxWidth="md" mx="auto">
      <Card.Header>
        <Card.Title textStyle="xl">리워드 확인</Card.Title>
        <Card.Description>참가자 화면의 인증번호를 입력하세요.</Card.Description>
      </Card.Header>
      <Card.Body>
        <form onSubmit={submit}>
          <VStack alignItems="stretch" gap="3">
            <Input
              size="2xl"
              aria-label="인증번호"
              placeholder="K7QP"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              maxLength={9}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={css({
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "wide",
              })}
            />
            <p className={css({ textStyle: "sm", color: "fg.subtle", textAlign: "center" })}>
              뒤 네 글자만 입력하면 됩니다 (앞의 79-1은 생략)
            </p>
            <Button type="submit" size="xl" width="full" loading={busy}>
              확인
            </Button>
          </VStack>
        </form>
      </Card.Body>
      {(result || failed) && (
        <Card.Footer flexDirection="column" alignItems="stretch" gap="3">
          {failed && (
            <Banner role="status" aria-label="판정 결과" tone="rejected">
              <AlertTriangle /> 연결이 불안정해요. 다시 시도해주세요.
            </Banner>
          )}
          {result?.kind === "VALID" && (
            <>
              <Banner role="status" aria-label="판정 결과" tone="ok">
                <CheckCircle2 />
                {describeValid(result)}
              </Banner>
              <Button size="lg" width="full" onClick={() => setResult(undefined)}>
                리워드 전달 완료
              </Button>
            </>
          )}
          {result?.kind === "ALREADY_REDEEMED" && (
            <Banner role="status" aria-label="판정 결과" tone="rejected">
              <AlertTriangle />
              {`이미 사용된 코드입니다 (${formatClock(result.redeemedAt)} 처리)`}
            </Banner>
          )}
          {result?.kind === "TEST_SESSION" && (
            <Banner role="status" aria-label="판정 결과" tone="rejected">
              <XCircle />
              테스트 세션 코드는 건네줄 수 없어요
            </Banner>
          )}
          {result?.kind === "UNKNOWN" && (
            <Banner role="status" aria-label="판정 결과" tone="rejected">
              <XCircle />
              일치하는 코드가 없습니다
            </Banner>
          )}
        </Card.Footer>
      )}
    </Card.Root>
  );
}
