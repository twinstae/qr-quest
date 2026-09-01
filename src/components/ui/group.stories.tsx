import type { Meta, StoryObj } from "@storybook/react-vite";

import { Group } from "./group.tsx";
import { Button } from "./button.tsx";

const meta = {
  title: "UI/Group",
  component: Group,
  render: (args) => (
    <Group {...args}>
      <Button variant="outline">복사</Button>
      <Button variant="outline">다운로드</Button>
      <Button variant="outline">공유</Button>
    </Group>
  ),
} satisfies Meta<typeof Group>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  args: { orientation: "vertical" },
};

export const Attached: Story = {
  args: { attached: true },
};

export const Grow: Story = {
  args: { grow: true },
};
