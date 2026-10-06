import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { StartScreenCard, type StartScreenContent } from "./start-screen-card.tsx";

const CONTENT: StartScreenContent = {
  number: 1,
  title: "사라진 책의 행방",
  teaser: "책방 안에 남겨진 단서를 찾아주세요.",
  estimatedMinutes: 20,
};

describe("StartScreenCard", () => {
  it('버튼 문구를 정하지 않으면 "시작하기"를 보여준다', async () => {
    await runSiheom(
      given.render(<StartScreenCard caseInfo={CONTENT} />),
      assertions.visible(query.heading("사라진 책의 행방")),
      assertions.visible(query.button("시작하기")),
    );
    expect(document.body.textContent).toContain("예상 소요 시간 약 20분");
  });

  it("관리자가 정한 버튼 문구와 안내 문구를 보여준다", async () => {
    await runSiheom(
      given.render(
        <StartScreenCard
          caseInfo={{ ...CONTENT, startButtonLabel: "사건 속으로", startNote: "2인 이상 추천" }}
        />,
      ),
      assertions.visible(query.button("사건 속으로")),
    );
    expect(document.body.textContent).toContain("2인 이상 추천");
  });

  it("예상 소요 시간이 0분이면 그 줄을 숨긴다", async () => {
    await runSiheom(
      given.render(<StartScreenCard caseInfo={{ ...CONTENT, estimatedMinutes: 0 }} />),
    );

    expect(document.body.textContent).not.toContain("예상 소요 시간");
  });

  it("시작 버튼을 누르면 onStart를 부른다", async () => {
    let started = 0;

    await runSiheom(
      given.render(
        <StartScreenCard
          caseInfo={CONTENT}
          onStart={() => {
            started += 1;
          }}
        />,
      ),
      actions.click(query.button("시작하기")),
    );

    expect(started).toBe(1);
  });
});
