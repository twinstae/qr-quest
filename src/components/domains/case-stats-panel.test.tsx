import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { CaseStatsPanel, type CaseStatsView } from "./case-stats-panel.tsx";

// siheom의 query는 접근성 이름으로만 찾는다 — 문장 하나를 확인할 때는 DOM에서 직접 찾는다.
function findText(text: string): Element | undefined {
  return [...document.querySelectorAll("p, span")].find((node) => node.textContent === text);
}

const EMPTY_STATS: CaseStatsView = {
  caseId: "case-1",
  caseNumber: 1,
  caseTitle: "사라진 책의 행방",
  period: "today",
  started: 0,
  completed: 0,
  inProgress: 0,
  completionRate: 0,
  excludedLongSessions: 0,
  steps: [
    {
      stepId: "step-1",
      name: "QR 01",
      order: 1,
      kind: "QR",
      reached: 0,
      dropped: 0,
      dropRate: 0,
      hintCount: 0,
      hasAnswer: true,
      advice: "아직 아무도 여기까지 오지 않았어요.",
    },
  ],
};

const FULL_STATS: CaseStatsView = {
  ...EMPTY_STATS,
  period: "all",
  started: 12,
  completed: 9,
  inProgress: 3,
  completionRate: 0.75,
  averageMinutes: 18,
  excludedLongSessions: 2,
  steps: [
    {
      stepId: "step-1",
      name: "QR 01",
      order: 1,
      kind: "QR",
      reached: 12,
      dropped: 3,
      dropRate: 0.25,
      attemptedSessions: 11,
      firstTryCorrectRate: 0.45,
      attemptCorrectRate: 0.6,
      hintCount: 7,
      hasAnswer: true,
      advice: "힌트를 조금 더 친절하게 바꿔보세요.",
    },
    {
      stepId: "step-2",
      name: "사건 소개",
      order: 0,
      kind: "INTRO",
      reached: 12,
      dropped: 0,
      dropRate: 0,
      hintCount: 0,
      hasAnswer: false,
      advice: "잘 지나가고 있어요.",
    },
  ],
  hardestStep: { stepId: "step-1", name: "QR 01", firstTryCorrectRate: 0.45 },
  mostHintedStep: { stepId: "step-1", name: "QR 01", hintCount: 7 },
};

describe("CaseStatsPanel", () => {
  it("참가 기록이 없으면 빈 상태를 보여주고 0으로 나눈 값을 만들지 않는다", async () => {
    await runSiheom(
      given.render(<CaseStatsPanel stats={EMPTY_STATS} period="today" onPeriodChange={() => {}} />),
      assertions.textContent(query.status("총 시작 세션"), "0"),
      assertions.textContent(query.status("완료율"), "0%"),
      assertions.textContent(query.status("평균 플레이 시간"), "-"),
    );

    expect(findText("아직 참가 기록이 없어요")).toBeDefined();
    // 아직 아무도 걸리지 않은 단계를 "가장 어려운 단계"라고 부르지 않는다.
    expect(findText("가장 많이 틀린 단계")).toBeUndefined();
  });

  it("완료율·평균 시간을 보여주고, 24시간 초과분을 평균에서 뺐다고 알려준다", async () => {
    await runSiheom(
      given.render(<CaseStatsPanel stats={FULL_STATS} period="all" onPeriodChange={() => {}} />),
      assertions.textContent(query.status("총 시작 세션"), "12"),
      assertions.textContent(query.status("완료"), "9"),
      assertions.textContent(query.status("완료율"), "75%"),
      assertions.textContent(query.status("평균 플레이 시간"), "18분"),
    );

    expect(findText("24시간을 넘긴 2건은 평균 시간에서 뺐어요.")).toBeDefined();
  });

  it("가장 어려운 단계·힌트를 많이 쓴 단계와 단계별 조언을 보여준다", async () => {
    await runSiheom(
      given.render(<CaseStatsPanel stats={FULL_STATS} period="all" onPeriodChange={() => {}} />),
      assertions.textContent(query.status("가장 많이 틀린 단계"), "QR 01 (첫 시도 정답률 45%)"),
      assertions.textContent(query.status("힌트를 가장 많이 쓴 단계"), "QR 01 (힌트 7번)"),
    );

    expect(findText("힌트를 조금 더 친절하게 바꿔보세요.")).toBeDefined();

    // 단계별 표: 도달·이탈·첫 시도 정답률·힌트. 정답이 없는 단계는 정답률을 지어내지 않는다.
    const rows = [...document.querySelectorAll("tbody tr")].map((row) =>
      [...row.querySelectorAll("td")].map((cell) => cell.textContent ?? ""),
    );
    expect(rows[0]?.[0]).toContain("QR 01");
    expect(rows[0]?.[1]).toBe("12");
    expect(rows[0]?.[3]).toBe("45%");
    expect(rows[0]?.[4]).toBe("7");
    expect(rows[1]?.[0]).toContain("사건 소개");
    expect(rows[1]?.[3]).toBe("-");
  });

  it("기간을 바꾸면 알려준다", async () => {
    const changes: string[] = [];

    await runSiheom(
      given.render(
        <CaseStatsPanel
          stats={FULL_STATS}
          period="today"
          onPeriodChange={(period) => changes.push(period)}
        />,
      ),
      actions.click(query.button("최근 7일")),
    );

    expect(changes).toEqual(["week"]);
  });
});
