import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { Button } from "@/components/ui/button.tsx";
import type { Theme } from "@/domain/theme.ts";

import { PhoneMockup } from "./phone-mockup.tsx";

const PALESTINE: Theme = {
  id: "theme-1",
  name: "팔레스타인",
  palette: "green",
  headingFont: "noto-serif-kr",
  bodyFont: "gowun-dodum",
  background: { kind: "image", src: "https://example.com/tatreez.webp", alt: "타트리즈 문양" },
  backgroundDim: 40,
};

function phone(theme: Theme | null) {
  return (
    <PhoneMockup theme={theme}>
      <h2>땅에는 얼마나 긴 시간이 쌓여 있을까?</h2>
      <Button>제출하기</Button>
    </PhoneMockup>
  );
}

describe("PhoneMockup", () => {
  it("CASE 테마의 색·폰트·배경을 참가자 화면처럼 입힌다", async () => {
    await runSiheom(given.render(phone(PALESTINE)), assertions.visible(query.button("제출하기")));

    expect(getComputedStyle(document.querySelector("h2")!).fontFamily).toBe(
      '"Noto Serif KR", serif',
    );
    // 초록 팔레트의 solid 색 (#30a46c)
    expect(getComputedStyle(document.querySelector("button")!).backgroundColor).toBe(
      "rgb(48, 164, 108)",
    );
    expect(document.querySelector("[data-theme-background]")).not.toBeNull();
  });

  it("테마 배경은 브라우저 화면 전체가 아니라 휴대폰 화면 안에만 깔린다", async () => {
    await page.viewport(1280, 900);
    try {
      await runSiheom(
        given.render(<div style={{ width: 360, margin: "0 auto" }}>{phone(PALESTINE)}</div>),
        assertions.visible(query.group("휴대폰 화면")),
      );

      const screen = document.querySelector("[aria-label='휴대폰 화면']")!.getBoundingClientRect();
      const background = document.querySelector("[data-theme-background]")!.getBoundingClientRect();
      expect(background.left).toBeGreaterThanOrEqual(screen.left);
      expect(background.right).toBeLessThanOrEqual(screen.right);
      expect(background.top).toBeGreaterThanOrEqual(screen.top);
      expect(background.bottom).toBeLessThanOrEqual(screen.bottom);
    } finally {
      await page.viewport(414, 896);
    }
  });

  it("테마가 없으면 기본 모습 그대로다", async () => {
    await runSiheom(given.render(phone(null)), assertions.visible(query.button("제출하기")));

    expect(document.querySelector("[data-theme-background]")).toBeNull();
  });
});
