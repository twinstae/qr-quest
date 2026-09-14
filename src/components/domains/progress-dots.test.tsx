import { describe, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { ProgressDots } from "./progress-dots.tsx";

describe("ProgressDots", () => {
  it("몇 번째 단서까지 왔는지 진행 상황으로 드러낸다", async () => {
    await runSiheom(
      given.render(<ProgressDots resolved={2} total={5} />),
      assertions.visible(query.progressbar("진행 상황 2/5")),
    );
  });
});
