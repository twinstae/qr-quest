import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import * as v from "valibot";

import { SimpleImageUpload, SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { SubmitButton } from "@/components/form/submit-button";
import type { Media } from "@/domain/step.ts";
import {
  fontStack,
  googleFontsHref,
  THEME_FONT_IDS,
  THEME_FONTS,
  THEME_PALETTE_IDS,
  THEME_PALETTE_LABELS,
  type Theme,
  type ThemeFont,
  type ThemePalette,
} from "@/domain/theme.ts";
import { css, cx } from "styled-system/css";
import { Flex, Grid, VStack } from "styled-system/jsx";

import { choiceChip, choiceLegend } from "./choice-chip.ts";
import { ThemePreview } from "./theme-preview.tsx";
import { PALETTE_CLASS } from "./themed-screen.tsx";

export type ThemeInput = Omit<Theme, "id">;

/** 숫자 입력은 문자열로 다룬다 — 지우는 중에 0으로 튀지 않게. */
export type ThemeEditorValues = Omit<ThemeInput, "backgroundDim"> & { backgroundDim: string };

export const EMPTY_THEME_VALUES: ThemeEditorValues = {
  name: "",
  palette: "gray",
  headingFont: "system",
  bodyFont: "system",
  background: undefined,
  backgroundDim: "40",
};

export function toThemeEditorValues({ id: _id, ...theme }: Theme): ThemeEditorValues {
  return { ...theme, backgroundDim: String(theme.backgroundDim) };
}

const schema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "테마 이름을 입력해 주세요")),
  palette: v.picklist(THEME_PALETTE_IDS),
  headingFont: v.picklist(THEME_FONT_IDS),
  bodyFont: v.picklist(THEME_FONT_IDS),
  background: v.optional(v.custom<Media>(() => true)),
  backgroundDim: v.pipe(
    v.string(),
    v.transform(Number),
    v.integer("0~80 사이의 숫자로 입력해 주세요"),
    v.minValue(0, "0~80 사이의 숫자로 입력해 주세요"),
    v.maxValue(80, "0~80 사이의 숫자로 입력해 주세요"),
  ),
});

// 폰트 보기를 그 폰트로 그려 보여주려면 목록 전체를 한 번 불러와야 한다(관리자 화면만).
const ALL_FONTS_HREF = googleFontsHref([...THEME_FONT_IDS]);

function RadioChoices<T extends string>({
  name,
  label,
  options,
}: {
  name: keyof ThemeEditorValues;
  label: string;
  options: { value: T; label: string; render?: ReactNode; fontFamily?: string }[];
}) {
  const { register } = useFormContext<ThemeEditorValues>();

  return (
    <fieldset>
      <legend className={choiceLegend}>{label}</legend>
      <Flex wrap="wrap" gap="2">
        {options.map((option) => (
          <label
            key={option.value}
            className={choiceChip}
            style={{ fontFamily: option.fontFamily }}
          >
            <input type="radio" value={option.value} {...register(name)} />
            {option.render}
            {option.label}
          </label>
        ))}
      </Flex>
    </fieldset>
  );
}

const PALETTE_OPTIONS = THEME_PALETTE_IDS.map((palette: ThemePalette) => ({
  value: palette,
  label: THEME_PALETTE_LABELS[palette],
  render: (
    <span
      aria-hidden
      className={cx(
        PALETTE_CLASS[palette],
        css({ width: "4", height: "4", borderRadius: "full", bg: "colorPalette.9" }),
      )}
    />
  ),
}));

const FONT_OPTIONS = THEME_FONT_IDS.map((font: ThemeFont) => ({
  value: font,
  label: THEME_FONTS[font].label,
  fontFamily: fontStack(font),
}));

function LivePreview() {
  // 모든 필드에 기본값이 있으므로 부분 값이 아니다.
  const { backgroundDim, ...values } = useWatch() as ThemeEditorValues;
  const dim = Number(backgroundDim);

  return (
    <ThemePreview
      theme={{
        ...values,
        backgroundDim: Number.isFinite(dim) ? Math.min(80, Math.max(0, dim)) : 0,
      }}
    />
  );
}

/** 테마 추가·수정 폼. 왼쪽에서 고르면 오른쪽 미리보기가 바로 바뀐다. */
export function ThemeEditorForm({
  defaultValues,
  submitLabel,
  onSubmit,
  footer,
}: {
  defaultValues: ThemeEditorValues;
  submitLabel: string;
  onSubmit: (input: ThemeInput) => Promise<void>;
  /** 취소 버튼 등 제출 버튼 옆에 둘 것. */
  footer?: ReactNode;
}) {
  return (
    <SimpleForm schema={schema} defaultValues={defaultValues} onSubmit={onSubmit}>
      {ALL_FONTS_HREF && <link rel="stylesheet" href={ALL_FONTS_HREF} />}
      <Grid columns={{ base: 1, md: 2 }} gap="6" alignItems="start">
        <VStack alignItems="stretch" gap="5">
          <SimpleInput name="name" label="테마 이름" placeholder="팔레스타인" />
          <RadioChoices name="palette" label="테마색" options={PALETTE_OPTIONS} />
          <RadioChoices name="headingFont" label="제목 폰트" options={FONT_OPTIONS} />
          <RadioChoices name="bodyFont" label="본문 폰트" options={FONT_OPTIONS} />
          <SimpleImageUpload name="background" label="배경 이미지" />
          <SimpleInput
            name="backgroundDim"
            label="배경 흐리게(%)"
            type="number"
            min={0}
            max={80}
            step={10}
            hint="0이면 이미지 그대로, 80이면 거의 바탕색이에요."
          />
        </VStack>
        <div className={css({ position: { md: "sticky" }, top: "4", justifySelf: "center" })}>
          <LivePreview />
        </div>
      </Grid>
      <Flex justify="flex-end" gap="3">
        {footer}
        <SubmitButton>{submitLabel}</SubmitButton>
      </Flex>
    </SimpleForm>
  );
}
