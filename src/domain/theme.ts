import { formatCaseNumber, type Case } from "./case.ts";
import type { Media } from "./step.ts";

/**
 * 테마 색은 빌드에 들어있는 Radix 팔레트 중에서만 고른다 (ticket 18).
 * 자유 HEX를 받으면 12단계 스케일을 런타임에 만들어야 하고 대비가 깨진다.
 */
export const THEME_PALETTES = [
  { id: "green", label: "초록" },
  { id: "olive", label: "올리브" },
  { id: "red", label: "빨강" },
  { id: "tomato", label: "토마토" },
  { id: "amber", label: "호박색" },
  { id: "blue", label: "파랑" },
  { id: "iris", label: "남보라" },
  { id: "brown", label: "갈색" },
  { id: "gray", label: "회색" },
] as const;

export type ThemePalette = (typeof THEME_PALETTES)[number]["id"];

/** 한글을 지원하는 Google Fonts. weights가 없으면 굵기가 하나뿐인 폰트다. */
export const THEME_FONTS = [
  { id: "system", label: "기본 폰트", family: null, fallback: "sans-serif" },
  {
    id: "noto-sans-kr",
    label: "Noto Sans KR",
    family: "Noto Sans KR",
    weights: "400;700",
    fallback: "sans-serif",
  },
  {
    id: "noto-serif-kr",
    label: "Noto Serif KR",
    family: "Noto Serif KR",
    weights: "400;700",
    fallback: "serif",
  },
  {
    id: "gowun-batang",
    label: "고운바탕",
    family: "Gowun Batang",
    weights: "400;700",
    fallback: "serif",
  },
  { id: "gowun-dodum", label: "고운돋움", family: "Gowun Dodum", fallback: "sans-serif" },
  {
    id: "nanum-myeongjo",
    label: "나눔명조",
    family: "Nanum Myeongjo",
    weights: "400;700",
    fallback: "serif",
  },
  { id: "black-han-sans", label: "검은고딕", family: "Black Han Sans", fallback: "sans-serif" },
  { id: "do-hyeon", label: "도현", family: "Do Hyeon", fallback: "sans-serif" },
  { id: "jua", label: "주아", family: "Jua", fallback: "sans-serif" },
] as const satisfies readonly {
  id: string;
  label: string;
  family: string | null;
  weights?: string;
  fallback: "serif" | "sans-serif";
}[];

export type ThemeFont = (typeof THEME_FONTS)[number]["id"];

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

function findFont(id: ThemeFont) {
  return THEME_FONTS.find((font) => font.id === id) ?? THEME_FONTS[0];
}

/** 고른 폰트만 한 번의 요청으로 불러온다. 기본 폰트뿐이면 요청하지 않는다. */
export function googleFontsHref(fonts: ThemeFont[]): string | undefined {
  const families = [...new Set(fonts)].map(findFont).flatMap((font) => {
    if (!font.family) return [];
    const name = font.family.replaceAll(" ", "+");
    return ["weights" in font ? `${name}:wght@${font.weights}` : name];
  });
  if (families.length === 0) return undefined;
  return `https://fonts.googleapis.com/css2?${families.map((family) => `family=${family}`).join("&")}&display=swap`;
}

/** 폰트 파일이 늦게 와도 같은 계열(명조/고딕)로 먼저 보여준다. 기본 폰트면 상속한다. */
export function fontStack(id: ThemeFont): string | undefined {
  const font = findFont(id);
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
