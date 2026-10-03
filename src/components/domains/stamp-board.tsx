import { Check } from "lucide-react";

import type { StepStamp } from "@/domain/tourFlow.ts";
import { css } from "styled-system/css";
import { HStack } from "styled-system/jsx";

/**
 * 스탬프 투어의 동그라미 칸. 참가자가 문제 하나를 풀 때마다 칸 하나에 도장이 찍힌다
 * (요청: 점이 아니라 스탬프판처럼). 몇 개 중 몇 개인지가 아니라 **어디에 찍혔는지**가
 * 남으므로, 순서 없이 풀어도 진행 상황이 그대로 읽힌다.
 */
export function StampBoard({ stamps }: { stamps: StepStamp[] }) {
  const resolved = stamps.filter((stamp) => stamp.solved).length;

  return (
    <HStack gap="3" role="list" aria-label={`스탬프 진행 ${resolved}/${stamps.length}`}>
      {stamps.map((stamp, index) => (
        <span
          key={stamp.stepId}
          role="listitem"
          aria-label={`${stamp.name} ${stamp.solved ? "스탬프 완료" : "아직 없음"}`}
          className={css({
            boxSize: "12",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "full",
            borderWidth: "2px",
            borderStyle: stamp.solved ? "solid" : "dashed",
            borderColor: stamp.solved ? "blue.9" : "gray.7",
            bg: stamp.solved ? "blue.9" : "transparent",
            color: stamp.solved ? "gray.1" : "fg.subtle",
            textStyle: "lg",
            fontWeight: "bold",
            // 도장은 조금 비뚤게 찍힌다 — 붙인 느낌을 위해 살짝 돌린다.
            transform: stamp.solved ? "rotate(-8deg)" : undefined,
          })}
        >
          {stamp.solved ? <Check aria-hidden size={22} strokeWidth={3} /> : index + 1}
        </span>
      ))}
    </HStack>
  );
}
