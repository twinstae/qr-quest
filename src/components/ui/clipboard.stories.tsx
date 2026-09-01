import type { Meta, StoryObj } from "@storybook/react-vite";

import * as Clipboard from "./clipboard.tsx";
import { Button } from "./button.tsx";

function ClipboardExample(props: Clipboard.RootProps) {
  return (
    <Clipboard.Root {...props}>
      <Clipboard.Label>퀘스트 링크</Clipboard.Label>
      <Clipboard.Control>
        <Clipboard.Input />
        <Clipboard.Trigger asChild>
          <Button variant="outline" size="sm">
            <Clipboard.Indicator />
          </Button>
        </Clipboard.Trigger>
      </Clipboard.Control>
    </Clipboard.Root>
  );
}

const meta = {
  title: "UI/Clipboard",
  component: Clipboard.Root,
  args: {
    value: "https://qr-quest.example.com/quest/quest-123",
  },
  render: (args) => <ClipboardExample {...args} />,
} satisfies Meta<typeof Clipboard.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TriggerOnly: Story = {
  render: (args) => (
    <Clipboard.Root {...args}>
      <Clipboard.Trigger asChild>
        <Button variant="outline" size="sm">
          <Clipboard.CopyText />
        </Button>
      </Clipboard.Trigger>
    </Clipboard.Root>
  ),
};
