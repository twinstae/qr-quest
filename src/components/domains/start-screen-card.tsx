import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import * as Clipboard from "@/components/ui/clipboard.tsx";
import {
  describeEstimatedTime,
  formatCaseNumber,
  resolveStartButtonLabel,
  type Case,
} from "@/domain/case.ts";
import { css } from "styled-system/css";

export type StartScreenContent = Pick<
  Case,
  | "number"
  | "title"
  | "teaser"
  | "thumbnail"
  | "estimatedMinutes"
  | "startNote"
  | "startButtonLabel"
>;

const subtleText = css({ textStyle: "sm", color: "fg.subtle", whiteSpace: "pre-line" });

/**
 * 시작 QR을 찍으면 보이는 카드. 참가자 화면(/s)과 관리자 미리보기가 같은 컴포넌트를 써서
 * "미리보기와 실제가 다르다"는 일이 없게 한다.
 */
export function StartScreenCard({
  caseInfo,
  resumed,
  resumeUrl,
  onStart,
}: {
  caseInfo: StartScreenContent;
  /** 이미 진행 중인 세션이면 "이어서 진행할 수 있어요"를 덧붙인다. */
  resumed?: boolean;
  /** 넘기면 다른 기기에서 이어하기 링크 복사 칸이 보인다. */
  resumeUrl?: string;
  onStart?: () => void;
}) {
  const estimatedTime = describeEstimatedTime(caseInfo.estimatedMinutes);

  return (
    <Card.Root variant="elevated" width="full" maxWidth="sm">
      {caseInfo.thumbnail && (
        <img
          src={caseInfo.thumbnail.src}
          alt={caseInfo.thumbnail.alt}
          className={css({ width: "full", aspectRatio: "1 / 1", objectFit: "contain" })}
        />
      )}
      <Card.Header>
        <span className={css({ textStyle: "sm", color: "fg.subtle" })}>
          {formatCaseNumber(caseInfo.number)}
        </span>
        <Card.Title textStyle="xl">{caseInfo.title}</Card.Title>
        <Card.Description>{caseInfo.teaser}</Card.Description>
      </Card.Header>
      <Card.Body gap="2">
        {estimatedTime && <p className={subtleText}>{estimatedTime}</p>}
        {caseInfo.startNote && <p className={subtleText}>{caseInfo.startNote}</p>}
        {resumed && <p className={subtleText}>이어서 진행할 수 있어요.</p>}
      </Card.Body>
      <Card.Footer flexDirection="column" alignItems="stretch" gap="3">
        <Button size="lg" width="full" onClick={onStart}>
          {resolveStartButtonLabel(caseInfo)}
        </Button>
        {resumeUrl && (
          <Clipboard.Root value={resumeUrl}>
            <Clipboard.Label className={css({ textStyle: "xs", color: "fg.subtle" })}>
              다른 기기에서 이어하려면 이 링크를 저장해 두세요
            </Clipboard.Label>
            <Clipboard.Control>
              <Clipboard.Input readOnly />
              <Clipboard.Trigger asChild>
                <Button variant="outline" size="sm">
                  <Clipboard.Indicator />
                </Button>
              </Clipboard.Trigger>
            </Clipboard.Control>
          </Clipboard.Root>
        )}
      </Card.Footer>
    </Card.Root>
  );
}
