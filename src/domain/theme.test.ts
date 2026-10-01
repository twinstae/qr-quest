import { describe, expect, it } from "vitest";

import { describeThemeDeletion, fontStack, googleFontsHref } from "./theme.ts";

describe("googleFontsHref", () => {
  it("제목·본문 폰트를 한 번의 요청으로 불러온다", () => {
    expect(googleFontsHref(["noto-serif-kr", "jua"])).toBe(
      "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Jua&display=swap",
    );
  });

  it("같은 폰트는 한 번만 부르고, 기본 폰트뿐이면 부르지 않는다", () => {
    expect(googleFontsHref(["jua", "jua"])).toBe(
      "https://fonts.googleapis.com/css2?family=Jua&display=swap",
    );
    expect(googleFontsHref(["system", "system"])).toBeUndefined();
  });
});

describe("fontStack", () => {
  it("폰트가 늦게 오면 같은 계열의 기본 폰트로 보여준다", () => {
    expect(fontStack("noto-serif-kr")).toBe('"Noto Serif KR", serif');
    expect(fontStack("system")).toBeUndefined();
  });
});

describe("describeThemeDeletion", () => {
  it("쓰는 CASE가 없으면 경고하지 않는다", () => {
    expect(describeThemeDeletion([])).toBeUndefined();
  });

  it("쓰는 CASE의 번호·제목·상태를 모두 알려준다", () => {
    expect(
      describeThemeDeletion([
        { number: 3, title: "팔레스타인", status: "LIVE" },
        { number: 1, title: "사라진 책", status: "DRAFT" },
      ]),
    ).toBe(
      "CASE 03 팔레스타인(LIVE), CASE 01 사라진 책(DRAFT)에서 쓰고 있어요. 삭제하면 이 CASE들은 테마 없이 기본 모습으로 보여요.",
    );
  });
});
