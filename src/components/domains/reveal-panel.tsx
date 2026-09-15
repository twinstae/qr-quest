import { useEffect, useState } from "react";

import { StepMedia } from "./step-card.tsx";
import * as Card from "@/components/ui/card.tsx";
import type { Media, RevealPreset } from "@/domain/step.ts";
import { css } from "styled-system/css";
import { revealAnimation } from "styled-system/recipes";

/**
 * 접힌 카드를 누르지 않아도 이만큼 지나면 스스로 펼쳐진다 — 단서를 클릭 뒤에 가두면
 * 참가자는 뭘 해야 하는지 모른 채 멈춘다. 클릭은 "굳이 기다리지 않고 먼저 펼쳐보는"
 * 선택지일 뿐이고, 어느 쪽이든 연출이 끝나면 단서를 바로 읽을 수 있다.
 */
export const AUTO_UNFOLD_MS = 900;

// 접힌 카드의 보이는 절반을 덮는 버튼. CSS가 reduced-motion에서 이 버튼을 숨긴다 —
// 연출이 없으면 접힘도 없으므로(카드가 그냥 펼쳐져 있으므로) 숨겨야 맞다.
const foldButtonClass = css({
  display: "none",
  position: "absolute",
  inset: "0 0 50% 0",
  zIndex: "1",
  placeItems: "center",
  cursor: "pointer",
  _motionSafe: { display: "grid" },
});

const foldLabelClass = css({
  px: "3",
  py: "1.5",
  borderWidth: "1px",
  borderStyle: "dashed",
  borderColor: "border",
  borderRadius: "full",
  color: "fg.muted",
  textStyle: "sm",
});

/**
 * 정답을 맞힌 뒤 보여주는 단서. 연출 프리셋은 카드 하나에 걸린다 — 카드 안의 사진과
 * 문구가 함께 움직여야 "단서가 나온다"로 읽힌다.
 */
export function RevealPanel({
  preset,
  text,
  media,
}: {
  preset: RevealPreset;
  text: string;
  media?: Media;
}) {
  // 접히는 프리셋만 "접힌 채로 나와서 펼쳐진다"는 상호작용을 갖는다.
  const folds = preset === "CARD_UNFOLD";
  const [unfolded, setUnfolded] = useState(!folds);

  useEffect(() => {
    if (!folds) {
      setUnfolded(true);
      return;
    }

    // 새 단서는 다시 접힌 채로 시작한다.
    setUnfolded(false);
    const timer = setTimeout(() => setUnfolded(true), AUTO_UNFOLD_MS);
    return () => clearTimeout(timer);
  }, [folds]);

  const folded = folds && !unfolded;

  return (
    <Card.Root
      variant="elevated"
      colorPalette="green"
      width="full"
      maxWidth="sm"
      alignItems="center"
      textAlign="center"
      className={revealAnimation({ preset })}
      data-fold={folded ? "closed" : undefined}
    >
      {media && <StepMedia media={media} />}
      <Card.Header alignItems="center">
        <Card.Title textStyle="xl">{text}</Card.Title>
      </Card.Header>
      {folded && (
        <button type="button" onClick={() => setUnfolded(true)} className={foldButtonClass}>
          <span className={foldLabelClass}>단서 펼치기</span>
        </button>
      )}
    </Card.Root>
  );
}
