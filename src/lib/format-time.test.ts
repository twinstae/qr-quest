import { describe, expect, it } from "vitest";

import { formatClock, formatDay } from "./format-time.ts";

describe("formatClock", () => {
  it("서버 시간대와 무관하게 책방 기준(KST) 시각을 보여준다", () => {
    expect(formatClock("2026-09-15T06:12:00.000Z")).toBe("오후 3:12");
    expect(formatClock("2026-09-15T00:05:00.000Z")).toBe("오전 9:05");
  });

  it("값이 없거나 잘못되면 undefined를 돌려준다", () => {
    expect(formatClock(undefined)).toBeUndefined();
    expect(formatClock("이건 날짜가 아니다")).toBeUndefined();
  });
});

describe("formatDay", () => {
  it("책방 기준 날짜를 보여준다", () => {
    expect(formatDay("2026-09-15T06:12:00.000Z")).toBe("9. 15.");
    // KST로 9월 16일 0시 5분.
    expect(formatDay("2026-09-15T15:05:00.000Z")).toBe("9. 16.");
  });
});
