import { formatCaseNumber, type Case } from "./case.ts";
import type { Media } from "./step.ts";

/**
 * 테마 색은 빌드에 들어있는 Radix 팔레트 중에서만 고른다 (ticket 18).
 * 자유 HEX를 받으면 12단계 스케일을 런타임에 만들어야 하고 대비가 깨진다.
 */
export const THEME_PALETTE_IDS = [
  "green",
  "olive",
  "red",
  "tomato",
  "amber",
  "blue",
  "iris",
  "brown",
  "gray",
] as const;

export type ThemePalette = (typeof THEME_PALETTE_IDS)[number];

export const THEME_PALETTE_LABELS: Record<ThemePalette, string> = {
  green: "초록",
  olive: "올리브 그레이",
  red: "빨강",
  tomato: "토마토",
  amber: "호박색",
  blue: "파랑",
  iris: "남보라",
  brown: "갈색",
  gray: "회색",
};

export const THEME_FONT_IDS = [
  "system",
  "noto-sans-kr",
  "noto-serif-kr",
  "gowun-batang",
  "gowun-dodum",
  "nanum-myeongjo",
  "black-han-sans",
  "do-hyeon",
  "jua",
] as const;

export type ThemeFont = (typeof THEME_FONT_IDS)[number];

type FontSpec = {
  label: string;
  /** Google Fonts 이름. null이면 브라우저 기본 폰트. */
  family: string | null;
  /** 없으면 굵기가 하나뿐인 폰트다. */
  weights?: string;
  fallback: "serif" | "sans-serif";
};

/** 한글을 지원하는 Google Fonts. */
export const THEME_FONTS: Record<ThemeFont, FontSpec> = {
  system: { label: "기본 폰트", family: null, fallback: "sans-serif" },
  "noto-sans-kr": {
    label: "Noto Sans KR",
    family: "Noto Sans KR",
    weights: "400;700",
    fallback: "sans-serif",
  },
  "noto-serif-kr": {
    label: "Noto Serif KR",
    family: "Noto Serif KR",
    weights: "400;700",
    fallback: "serif",
  },
  "gowun-batang": {
    label: "고운바탕",
    family: "Gowun Batang",
    weights: "400;700",
    fallback: "serif",
  },
  "gowun-dodum": { label: "고운돋움", family: "Gowun Dodum", fallback: "sans-serif" },
  "nanum-myeongjo": {
    label: "나눔명조",
    family: "Nanum Myeongjo",
    weights: "400;700",
    fallback: "serif",
  },
  "black-han-sans": { label: "검은고딕", family: "Black Han Sans", fallback: "sans-serif" },
  "do-hyeon": { label: "도현", family: "Do Hyeon", fallback: "sans-serif" },
  jua: { label: "주아", family: "Jua", fallback: "sans-serif" },
};

export type Theme = {
  id: string;
  name: string;
  palette: ThemePalette;
  headingFont: ThemeFont;
  bodyFont: ThemeFont;
  background?: Media;
  /** 배경 이미지 위를 어둡게 덮는 정도(%). 0~80. */
  backgroundDim: number;
};

/** 고른 폰트만 한 번의 요청으로 불러온다. 기본 폰트뿐이면 요청하지 않는다. */
export function googleFontsHref(fonts: ThemeFont[]): string | undefined {
  const families = [...new Set(fonts)].flatMap((id) => {
    const font = THEME_FONTS[id];
    if (!font.family) return [];
    const name = font.family.replaceAll(" ", "+");
    return [font.weights ? `${name}:wght@${font.weights}` : name];
  });
  if (families.length === 0) return undefined;
  return `https://fonts.googleapis.com/css2?${families.map((family) => `family=${family}`).join("&")}&display=swap`;
}

/** 폰트 파일이 늦게 와도 같은 계열(명조/고딕)로 먼저 보여준다. 기본 폰트면 상속한다. */
export function fontStack(id: ThemeFont): string | undefined {
  const font = THEME_FONTS[id];
  return font.family ? `"${font.family}", ${font.fallback}` : undefined;
}

export type ThemeUsage = Pick<Case, "number" | "title" | "status">;

/** 쓰고 있는 테마를 지우기 전 확인 창의 경고 문구. LIVE여도 막지 않고 알리기만 한다. */
export function describeThemeDeletion(usedBy: ThemeUsage[]): string | undefined {
  if (usedBy.length === 0) return undefined;
  const names = usedBy
    .map((item) => `${formatCaseNumber(item.number)} ${item.title}(${item.status})`)
    .join(", ");
  return `${names}에서 쓰고 있어요. 삭제하면 이 CASE들은 테마 없이 기본 모습으로 보여요.`;
}
