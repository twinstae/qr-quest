import { useState } from "react";

import type { Theme } from "@/domain/theme.ts";
import { css } from "styled-system/css";
import { Flex, VStack } from "styled-system/jsx";

import { choiceChip, choiceLegend } from "./choice-chip.ts";
import { ThemePreview } from "./theme-preview.tsx";

const NO_THEME = "";

/**
 * CASE의 참가자 화면 테마를 고른다. 고르는 즉시 저장하고, 실패하면 원래 값으로 되돌린다.
 */
export function CaseThemePicker({
  themes,
  themeId,
  setTheme,
}: {
  themes: Theme[];
  themeId: string | undefined;
  setTheme: (themeId: string | null) => Promise<void>;
}) {
  const [selected, setSelected] = useState(themeId ?? NO_THEME);
  const [message, setMessage] = useState("");
  const selectedTheme = themes.find((theme) => theme.id === selected);

  async function choose(next: string) {
    const previous = selected;
    setSelected(next);
    setMessage("");
    try {
      await setTheme(next === NO_THEME ? null : next);
      setMessage("저장했어요");
    } catch {
      setSelected(previous);
      setMessage("저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  const options = [{ id: NO_THEME, name: "테마 없음" }, ...themes];

  return (
    <Flex gap="6" wrap="wrap" align="flex-start">
      <VStack alignItems="stretch" gap="3" flex="1" minWidth="60">
        <fieldset>
          <legend className={choiceLegend}>참가자 화면 테마</legend>
          <Flex wrap="wrap" gap="2">
            {options.map((option) => (
              <label key={option.id} className={choiceChip}>
                <input
                  type="radio"
                  name="case-theme"
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => choose(option.id)}
                />
                {option.name}
              </label>
            ))}
          </Flex>
        </fieldset>
        <p
          role="status"
          aria-label="테마 저장"
          className={css({ textStyle: "sm", color: "fg.muted" })}
        >
          {message}
        </p>
      </VStack>
      {selectedTheme && <ThemePreview theme={selectedTheme} />}
    </Flex>
  );
}
