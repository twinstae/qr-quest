import type { Meta, StoryObj } from "@storybook/react-vite";

import { Loader } from "./loader.tsx";
import { Button } from "./button.tsx";

const meta = {
  title: "UI/Loader",
  component: Loader,
  args: {
    children: "제출하기",
  },
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SpinnerOnly: Story = {
  render: (args) => (
    <Button>
      <Loader {...args} />
    </Button>
  ),
};

export const WithText: Story = {
  render: (args) => (
    <Button>
      <Loader {...args} text="제출 중..." />
    </Button>
  ),
};

export const SpinnerAtEnd: Story = {
  render: (args) => (
    <Button>
      <Loader {...args} text="제출 중..." spinnerPlacement="end" />
    </Button>
  ),
};

export const NotVisible: Story = {
  render: (args) => (
    <Button>
      <Loader {...args} visible={false} />
    </Button>
  ),
};
