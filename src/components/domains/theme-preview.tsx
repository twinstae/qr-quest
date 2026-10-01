import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import type { Theme } from "@/domain/theme.ts";
import { css } from "styled-system/css";
import { VStack } from "styled-system/jsx";

import { ThemedScreen } from "./themed-screen.tsx";

// transform이 있으면 position: fixed인 배경이 화면이 아니라 이 틀에 붙는다.
const phoneFrame = css({
  position: "relative",
  transform: "translateZ(0)",
  overflow: "hidden",
  width: "full",
  maxWidth: "15rem",
  aspectRatio: "9 / 16",
  borderRadius: "2xl",
  borderWidth: "4px",
  borderColor: "gray.12",
  bg: "gray.1",
});

const choice = css({
  borderWidth: "1px",
  borderColor: "border",
  borderRadius: "l2",
  px: "3",
  py: "2",
  textStyle: "xs",
});

const SAMPLE_CHOICES = ["① 중세 이후의 도시 유적", "② 만 년 넘게 쌓인 정착지", "③ 청동기시대 도시"];

/**
 * 테마를 입힌 고정 샘플 문제 화면. 목록·폼·CASE 편집에서 같은 모습을 보여준다.
 * 실제로 누를 수 없게 inert로 막는다.
 */
export function ThemePreview({ theme }: { theme: Omit<Theme, "id"> }) {
  return (
    <figure aria-label={`${theme.name || "새 테마"} 미리보기`} className={phoneFrame}>
      <div inert>
        <ThemedScreen theme={{ ...theme, id: "preview" }}>
          <VStack p="3" pt="10">
            <Card.Root variant="elevated" width="full">
              <Card.Header p="3" gap="1">
                <span className={css({ textStyle: "xs", color: "colorPalette.11" })}>CASE 01</span>
                <Card.Title textStyle="sm">땅에는 얼마나 긴 시간이 쌓여 있을까?</Card.Title>
                <Card.Description textStyle="xs">
                  보기를 골라 정답을 확인해 보세요.
                </Card.Description>
              </Card.Header>
              <Card.Body p="3" pt="0" gap="1.5">
                {SAMPLE_CHOICES.map((label) => (
                  <div key={label} className={choice}>
                    {label}
                  </div>
                ))}
              </Card.Body>
              <Card.Footer p="3" pt="0">
                <Button size="sm" width="full">
                  정답 확인
                </Button>
              </Card.Footer>
            </Card.Root>
          </VStack>
        </ThemedScreen>
      </div>
    </figure>
  );
}
