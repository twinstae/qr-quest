import type { Meta, StoryObj } from "@storybook/react-vite";
import { css } from "styled-system/css";

import { AbsoluteCenter } from "./absolute-center.tsx";

const meta = {
  title: "UI/AbsoluteCenter",
  component: AbsoluteCenter,
  render: (args) => (
    <div
      className={css({
        position: "relative",
        width: "240px",
        height: "160px",
        borderWidth: "1px",
        borderStyle: "dashed",
        borderColor: "border",
      })}
    >
      <AbsoluteCenter {...args}>중앙 정렬</AbsoluteCenter>
    </div>
  ),
} satisfies Meta<typeof AbsoluteCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Both: Story = {
  args: { axis: "both" },
};

export const Horizontal: Story = {
  args: { axis: "horizontal" },
};

export const Vertical: Story = {
  args: { axis: "vertical" },
};
