import { describe, expect, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { Button } from "@/components/ui/button.tsx";
import type { Theme } from "@/domain/theme.ts";

import { ThemedScreen } from "./themed-screen.tsx";

const PALESTINE: Theme = {
  id: "theme-1",
  name: "팔레스타인",
  palette: "green",
  headingFont: "noto-serif-kr",
  bodyFont: "gowun-dodum",
  background: { kind: "image", src: "https://example.com/tatreez.webp", alt: "타트리즈 문양" },
  backgroundDim: 40,
};

function screen(theme: Theme | null) {
  return (
    <ThemedScreen theme={theme}>
      <h1>땅에는 얼마나 긴 시간이 쌓여 있을까?</h1>
      <p>보기를 골라 주세요.</p>
      <Button>정답 확인</Button>
    </ThemedScreen>
  );
}

function fontsLink() {
  return document.querySelector<HTMLLinkElement>('link[href^="https://fonts.googleapis.com"]');
}

describe("ThemedScreen", () => {
  it("테마가 없으면 지금 모습 그대로 보여준다", async () => {
    await runSiheom(
      given.render(screen(null)),
      assertions.visible(query.heading("땅에는 얼마나 긴 시간이 쌓여 있을까?")),
    );

    expect(fontsLink()).toBeNull();
    expect(document.querySelector("[data-theme-background]")).toBeNull();
  });

  it("테마의 폰트·색·배경을 참가자 화면에 입힌다", async () => {
    await runSiheom(given.render(screen(PALESTINE)), assertions.visible(query.button("정답 확인")));

    expect(fontsLink()?.href).toBe(
      "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Gowun+Dodum&display=swap",
    );
    const heading = document.querySelector("h1")!;
    expect(getComputedStyle(heading).fontFamily).toBe('"Noto Serif KR", serif');
    expect(getComputedStyle(document.querySelector("p")!).fontFamily).toBe(
      '"Gowun Dodum", sans-serif',
    );
    // 초록 팔레트의 solid 색 (#30a46c)
    expect(getComputedStyle(document.querySelector("button")!).backgroundColor).toBe(
      "rgb(48, 164, 108)",
    );
    const background = document.querySelector<HTMLElement>("[data-theme-background]")!;
    expect(getComputedStyle(background).backgroundImage).toBe(
      'url("https://example.com/tatreez.webp")',
    );
    expect(getComputedStyle(background, "::after").opacity).toBe("0.4");
  });
});
