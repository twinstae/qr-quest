import { describe, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { StampBoard } from "./stamp-board.tsx";

describe("StampBoard", () => {
  it("푼 문제 칸에는 도장이, 안 푼 칸에는 빈 동그라미가 남는다", async () => {
    await runSiheom(
      given.render(
        <StampBoard
          stamps={[
            { stepId: "step-1", name: "QR 01", solved: true },
            { stepId: "step-2", name: "QR 02", solved: false },
            { stepId: "step-3", name: "QR 03", solved: false },
          ]}
        />,
      ),
      assertions.visible(query.list("스탬프 진행 1/3")),
      assertions.visible(query.listitem("QR 01 스탬프 완료")),
      assertions.visible(query.listitem("QR 02 아직 없음")),
      assertions.visible(query.listitem("QR 03 아직 없음")),
    );
  });

  it("아무것도 안 풀었으면 0/N으로 안내한다", async () => {
    await runSiheom(
      given.render(<StampBoard stamps={[{ stepId: "step-1", name: "QR 01", solved: false }]} />),
      assertions.visible(query.list("스탬프 진행 0/1")),
    );
  });
});
