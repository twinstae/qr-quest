import { css } from "styled-system/css";
import { HStack } from "styled-system/jsx";

/** 참가자가 지금 몇 번째 단서까지 왔는지 점으로 보여준다. 정확한 진행률보다 감각을 준다. */
export function ProgressDots({ resolved, total }: { resolved: number; total: number }) {
  return (
    <HStack
      gap="2"
      role="progressbar"
      aria-valuenow={resolved}
      aria-valuemax={total}
      aria-label={`진행 상황 ${resolved}/${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={css({
            boxSize: "2.5",
            borderRadius: "full",
            bg: index < resolved ? "blue.9" : "gray.4",
          })}
        />
      ))}
    </HStack>
  );
}
