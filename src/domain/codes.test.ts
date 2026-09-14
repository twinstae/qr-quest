import { describe, expect, it } from "vitest";

import {
  COMPLETION_CODE_LENGTH,
  COMPLETION_CODE_PREFIX,
  generateCompletionCode,
  generateQrToken,
  generateSessionToken,
  isQrToken,
  isValidCompletionCode,
  normalizeCompletionCode,
  QR_TOKEN_LENGTH,
  SESSION_TOKEN_LENGTH,
} from "./codes.ts";

describe("generateQrToken", () => {
  it("정해진 길이의 토큰을 만든다", () => {
    expect(generateQrToken()).toHaveLength(QR_TOKEN_LENGTH);
  });

  it("항상 같은 난수면 같은 토큰이 나온다 (난수원 주입)", () => {
    expect(generateQrToken(() => 0)).toBe("2".repeat(QR_TOKEN_LENGTH));
  });

  it("혼동하기 쉬운 글자(O/0/I/1/L)를 쓰지 않는다", () => {
    for (let index = 0; index < 200; index++) {
      const token = generateQrToken();
      expect(token).not.toMatch(/[O0I1L]/);
    }
  });

  it("isQrToken은 길이와 글자 집합을 함께 본다", () => {
    expect(isQrToken(generateQrToken())).toBe(true);
    expect(isQrToken("2".repeat(QR_TOKEN_LENGTH - 1))).toBe(false);
    expect(isQrToken(`${"2".repeat(QR_TOKEN_LENGTH - 1)}O`)).toBe(false);
    expect(isQrToken("")).toBe(false);
  });
});

describe("generateCompletionCode", () => {
  it("79-1-XXXX 형식으로 만든다", () => {
    expect(generateCompletionCode(() => 0)).toBe(`${COMPLETION_CODE_PREFIX}-2222`);
    expect(generateCompletionCode()).toMatch(
      new RegExp(`^${COMPLETION_CODE_PREFIX}-[23456789A-HJ-NP-Z]{${COMPLETION_CODE_LENGTH}}$`),
    );
  });

  it("뒤 네 글자에는 혼동하기 쉬운 글자를 쓰지 않는다", () => {
    // 접두사 79-1은 책방 이름이라 그대로 둔다.
    const prefixLength = `${COMPLETION_CODE_PREFIX}-`.length;
    for (let index = 0; index < 200; index++) {
      expect(generateCompletionCode().slice(prefixLength)).not.toMatch(/[O0I1L]/);
    }
  });
});

describe("generateSessionToken", () => {
  it("정해진 길이의 토큰을 만든다", () => {
    expect(generateSessionToken()).toHaveLength(SESSION_TOKEN_LENGTH);
  });

  it("서로 다른 세션은 서로 다른 토큰을 받는다", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateSessionToken()));
    expect(tokens.size).toBe(200);
  });
});

describe("normalizeCompletionCode / isValidCompletionCode", () => {
  it("소문자와 공백을 받아들인다", () => {
    expect(normalizeCompletionCode(" 79-1-k7qp ")).toBe("79-1-K7QP");
    expect(normalizeCompletionCode("79-1 K7QP")).toBe("79-1-K7QP");
  });

  it("하이픈을 빠뜨려도 같은 코드로 본다", () => {
    expect(normalizeCompletionCode("791K7QP")).toBe("79-1-K7QP");
    expect(isValidCompletionCode("791K7QP")).toBe(true);
  });

  it("형식이 어긋나면 유효하지 않다", () => {
    expect(isValidCompletionCode("79-1-K7Q")).toBe(false);
    expect(isValidCompletionCode("79-1-K7QPX")).toBe(false);
    expect(isValidCompletionCode("79-1-K7OQ")).toBe(false);
    expect(isValidCompletionCode("")).toBe(false);
  });
});
