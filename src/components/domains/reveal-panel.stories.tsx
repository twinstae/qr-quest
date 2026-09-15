import { type ReactNode, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { RevealPanel } from "./reveal-panel.tsx";
import { Button } from "@/components/ui/button.tsx";
import { css } from "styled-system/css";

/**
 * 연출은 카드 하나에 걸린다 — 사진과 문구가 함께 움직이는지 보려면 단서에 사진이 있어야
 * 한다. 그래서 여기 스토리는 (거의) 전부 사진을 넣는다. 사진 없는 단서는 맨 아래에.
 */
const CLUE_PHOTO = {
  kind: "image" as const,
  src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
  alt: "서가 사이에 놓인 낡은 책",
};

/**
 * 연출은 한 번만 재생된다 — 눈으로 확인하려면 다시 돌려볼 수 있어야 한다.
 * key를 바꿔 다시 마운트하는 게 가장 확실한 "다시 보기"다(접힌 카드도 다시 접힌다).
 */
function Replay({ children }: { children: ReactNode }) {
  const [run, setRun] = useState(0);

  return (
    <div className={css({ display: "grid", gap: "4", justifyItems: "center" })}>
      <div key={run} className={css({ width: "full", maxWidth: "sm" })}>
        {children}
      </div>
      <Button size="sm" variant="outline" onClick={() => setRun((count) => count + 1)}>
        다시 보기
      </Button>
    </div>
  );
}

const meta = {
  title: "Domains/RevealPanel",
  component: RevealPanel,
  args: {
    text: "서가 두 번째 칸, 파란 표지 책갈피 사이에 사건의 실마리가 있습니다.",
    media: CLUE_PHOTO,
  },
  decorators: [
    (Story) => (
      <Replay>
        <Story />
      </Replay>
    ),
  ],
  parameters: { layout: "centered" },
} satisfies Meta<typeof RevealPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FadeUp: Story = { args: { preset: "FADE_UP" } };

export const Unroll: Story = { args: { preset: "UNROLL" } };

export const Typewriter: Story = { args: { preset: "TYPEWRITER" } };

export const TvScan: Story = { args: { preset: "TV_SCAN" } };

export const Glitch: Story = { args: { preset: "GLITCH" } };

/** 접힌 카드 — 누르면 펼쳐지고, 안 누르면 잠시 뒤 스스로 펼쳐진다. [다시 보기]로 반복. */
export const CardUnfold: Story = { args: { preset: "CARD_UNFOLD" } };

/** 사진 없이 오는 단서도 있다 — 연출이 문구만으로도 서는지 확인용. */
export const WithoutMedia: Story = { args: { preset: "UNROLL", media: undefined } };
