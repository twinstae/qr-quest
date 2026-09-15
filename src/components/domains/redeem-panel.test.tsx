import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { RedeemPanel, type RedeemView } from "./redeem-panel.tsx";

// siheom의 query는 접근성 이름으로만 찾는다 — 문장 하나를 확인할 때는 DOM에서 직접 찾는다.
function findText(text: string): Element | undefined {
  return [...document.querySelectorAll("p, span")].find((node) => node.textContent === text);
}

function panelReturning(view: RedeemView) {
  const codes: string[] = [];
  const element = (
    <RedeemPanel
      redeem={async (code) => {
        codes.push(code);
        return view;
      }}
    />
  );
  return { element, codes };
}

describe("RedeemPanel", () => {
  it("유효한 코드는 사건·완료 시각·오늘 순번을 보여준다", async () => {
    const { element, codes } = panelReturning({
      kind: "VALID",
      caseNumber: 1,
      caseTitle: "사라진 책의 행방",
      // KST 오후 3:12
      completedAt: "2026-09-15T06:12:00.000Z",
      todayCount: 3,
    });

    await runSiheom(
      given.render(element),
      actions.fill(query.textbox("인증번호"), "k7qp"),
      actions.click(query.button("확인")),
      assertions.textContent(
        query.status("판정 결과"),
        "CASE 01 사라진 책의 행방 · 오후 3:12 완료 · 오늘 3번째",
      ),
      assertions.visible(query.button("리워드 전달 완료")),
    );

    expect(codes).toEqual(["k7qp"]);
  });

  it("입력창을 비워 다음 참가자를 바로 받는다", async () => {
    const { element } = panelReturning({ kind: "UNKNOWN" });

    await runSiheom(
      given.render(element),
      actions.fill(query.textbox("인증번호"), "K7QP"),
      actions.click(query.button("확인")),
      assertions.textContent(query.status("판정 결과"), "일치하는 코드가 없습니다"),
      assertions.value(query.textbox("인증번호"), ""),
    );
  });

  it("전달 완료를 누르면 결과를 지우고 처음 상태로 돌아간다", async () => {
    const { element } = panelReturning({
      kind: "VALID",
      caseNumber: 1,
      caseTitle: "사라진 책의 행방",
      completedAt: "2026-09-15T06:12:00.000Z",
      todayCount: 1,
    });

    await runSiheom(
      given.render(element),
      actions.fill(query.textbox("인증번호"), "K7QP"),
      actions.click(query.button("확인")),
      actions.click(query.button("리워드 전달 완료")),
    );

    expect(document.querySelector('[aria-label="판정 결과"]')).toBeNull();
  });

  it("이미 사용된 코드는 최초 처리 시각을 함께 보여주고 전달 버튼을 주지 않는다", async () => {
    const { element } = panelReturning({
      kind: "ALREADY_REDEEMED",
      // KST 오후 3:40
      redeemedAt: "2026-09-15T06:40:00.000Z",
    });

    await runSiheom(
      given.render(element),
      actions.fill(query.textbox("인증번호"), "K7QP"),
      actions.click(query.button("확인")),
      assertions.textContent(query.status("판정 결과"), "이미 사용된 코드입니다 (오후 3:40 처리)"),
    );

    expect(findText("리워드 전달 완료")).toBeUndefined();
  });

  it("테스트 세션 코드는 건네줄 수 없다고 알려준다", async () => {
    const { element } = panelReturning({ kind: "TEST_SESSION" });

    await runSiheom(
      given.render(element),
      actions.fill(query.textbox("인증번호"), "K7QP"),
      actions.click(query.button("확인")),
      assertions.textContent(query.status("판정 결과"), "테스트 세션 코드는 건네줄 수 없어요"),
    );
  });

  it("입력이 비어 있으면 서버를 부르지 않는다", async () => {
    const { element, codes } = panelReturning({ kind: "UNKNOWN" });

    await runSiheom(given.render(element), actions.click(query.button("확인")));

    expect(codes).toEqual([]);
  });
});
