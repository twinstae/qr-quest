import { describe, expect, it, vi } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { CaseStatusControl } from "./case-status-control.tsx";

const { statusPatch } = vi.hoisted(() => ({ statusPatch: vi.fn() }));

vi.mock("@/lib/api-client.ts", () => ({
  getApiClient: () => ({
    cases: (params: { id: string }) => ({ status: { patch: (body: unknown) => statusPatch(params, body) } }),
  }),
}));

describe("CaseStatusControl", () => {
  it("LIVE로 전환을 누르면 상태를 바꾸도록 요청한다", async () => {
    statusPatch.mockResolvedValue({ data: { status: "LIVE" }, error: null });
    const onChanged = vi.fn();

    await runSiheom(
      given.render(<CaseStatusControl caseId="case-1" status="DRAFT" onChanged={onChanged} />),
      actions.click(query.button("LIVE로 전환")),
    );

    expect(statusPatch).toHaveBeenCalledWith({ id: "case-1" }, { status: "LIVE" });
    expect(onChanged).toHaveBeenCalledWith("LIVE");
  });

  it("위반이 있으면 전환을 거부하고 위반 목록을 보여준다", async () => {
    statusPatch.mockResolvedValue({
      data: null,
      error: {
        status: 400,
        value: {
          code: "LIVE_NOT_READY",
          message: "이 CASE는 아직 LIVE로 바꿀 수 없어요.",
          violations: [
            { kind: "MISSING_ANSWER", stepId: "s1", stepName: "QR 02" },
            { kind: "MISSING_CLOSING" },
          ],
        },
      },
    });
    const onChanged = vi.fn();

    await runSiheom(
      given.render(<CaseStatusControl caseId="case-1" status="DRAFT" onChanged={onChanged} />),
      actions.click(query.button("LIVE로 전환")),
      assertions.visible(query.status("안내")),
      assertions.textContent(
        query.status("안내"),
        "QR 02 단계에 정답이 없어요. 사건 종결 화면이 없어요.",
      ),
    );

    expect(onChanged).not.toHaveBeenCalled();
  });
});
