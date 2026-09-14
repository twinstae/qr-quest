import { describe, expect, it, vi } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { CloneCaseButton } from "./clone-case-button.tsx";

const { clonePost } = vi.hoisted(() => ({ clonePost: vi.fn() }));

vi.mock("@/lib/api-client.ts", () => ({
  getApiClient: () => ({ cases: (params: { id: string }) => ({ clone: { post: () => clonePost(params) } }) }),
}));

describe("CloneCaseButton", () => {
  it("누르면 복제를 요청하고, 성공하면 새 CASE를 알려준다", async () => {
    clonePost.mockResolvedValue({ data: { id: "case-2" }, error: null });
    const onCloned = vi.fn();

    await runSiheom(
      given.render(<CloneCaseButton caseId="case-1" onCloned={onCloned} />),
      actions.click(query.button("복제")),
    );

    expect(clonePost).toHaveBeenCalledWith({ id: "case-1" });
    expect(onCloned).toHaveBeenCalledWith("case-2");
  });

  it("실패하면 이유를 알리고 다시 시도할 수 있다", async () => {
    clonePost.mockResolvedValue({ data: null, error: { status: 500 } });

    await runSiheom(
      given.render(<CloneCaseButton caseId="case-1" onCloned={() => {}} />),
      actions.click(query.button("복제")),
      assertions.visible(query.status("안내")),
      assertions.visible(query.button("복제")),
    );
  });
});
