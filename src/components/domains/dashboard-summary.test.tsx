import { describe, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { DashboardSummary } from "./dashboard-summary.tsx";

describe("DashboardSummary", () => {
  it("진행 중/전체 CASE 수를 보여준다", async () => {
    await runSiheom(
      given.render(<DashboardSummary liveCount={2} totalCount={5} />),
      assertions.visible(query.status("진행 중인 CASE")),
      assertions.textContent(query.status("진행 중인 CASE"), "2"),
      assertions.visible(query.status("전체 CASE")),
      assertions.textContent(query.status("전체 CASE"), "5"),
    );
  });

  it("오늘 참가·완료는 통계가 없으면 -로 보여준다", async () => {
    await runSiheom(
      given.render(<DashboardSummary liveCount={0} totalCount={0} />),
      assertions.visible(query.status("오늘 참가")),
      assertions.textContent(query.status("오늘 참가"), "-"),
      assertions.visible(query.status("오늘 완료")),
      assertions.textContent(query.status("오늘 완료"), "-"),
    );
  });
});
