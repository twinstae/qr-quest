import { describe, expect, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { CompletionScreen } from "./completion-screen.tsx";

// siheom의 query는 접근성 이름으로만 찾는다 — 문장 하나를 확인할 때는 DOM에서 직접 찾는다.
function findText(text: string): Element | undefined {
  return [...document.querySelectorAll("p, span")].find((node) => node.textContent === text);
}

describe("CompletionScreen", () => {
  it("인증번호를 직원 안내 문구와 함께 보여준다", async () => {
    await runSiheom(
      given.render(
        <CompletionScreen
          closingTitle="사건이 종결되었습니다"
          completionCode="79-1-K7QP"
          elapsedMinutes={17}
          hintCount={2}
        />,
      ),
      assertions.textContent(query.status("인증번호"), "79-1-K7QP"),
    );

    // 화면에서 인증번호로 가는 순서: 라벨 → 번호 → 직원 안내.
    expect(findText("완료 인증번호")).toBeDefined();
    expect(findText("직원에게 이 번호를 보여주세요")).toBeDefined();
  });

  it("인증번호가 화면에서 가장 큰 글자다", async () => {
    await runSiheom(
      given.render(
        <CompletionScreen completionCode="79-1-K7QP" elapsedMinutes={17} hintCount={2} />,
      ),
    );

    const code = document.querySelector('[aria-label="인증번호"]');
    expect(code).not.toBeNull();

    const others = [...document.querySelectorAll("p, h1, h2, h3, span")].filter(
      (node) => node !== code,
    );
    const codeSize = Number.parseFloat(getComputedStyle(code!).fontSize);
    const largestOther = Math.max(
      ...others.map((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
    );

    expect(codeSize).toBeGreaterThan(largestOther);
  });

  it("소요 시간과 힌트 횟수를 인증번호 아래에 한 줄로 보여준다", async () => {
    await runSiheom(
      given.render(
        <CompletionScreen completionCode="79-1-K7QP" elapsedMinutes={17} hintCount={2} />,
      ),
    );

    const code = document.querySelector('[aria-label="인증번호"]');
    const progress = findText("약 17분 · 힌트 2번");

    expect(progress).toBeDefined();
    // 화면 순서: 인증번호 → 소요 시간·힌트 → 직원 안내.
    expect(
      code!.compareDocumentPosition(progress!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("재진입처럼 시간 정보가 없으면 인증번호만 보여준다", async () => {
    await runSiheom(
      given.render(
        <CompletionScreen closingTitle="이미 사건을 해결했어요" completionCode="79-1-K7QP" />,
      ),
      assertions.textContent(query.status("인증번호"), "79-1-K7QP"),
    );

    expect(findText("약 17분 · 힌트 2번")).toBeUndefined();
  });
});
