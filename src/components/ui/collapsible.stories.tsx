import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDownIcon } from "lucide-react";

import * as Collapsible from "./collapsible.tsx";
import { Badge } from "./badge.tsx";

function CollapsibleExample(props: Collapsible.RootProps) {
  return (
    <Collapsible.Root {...props}>
      <Collapsible.Trigger>
        <Badge variant="outline" size="lg">
          힌트 보기 <ChevronDownIcon />
        </Badge>
      </Collapsible.Trigger>
      <Collapsible.Content>힌트: 정답은 세 글자입니다.</Collapsible.Content>
    </Collapsible.Root>
  );
}

const meta = {
  title: "UI/Collapsible",
  component: Collapsible.Root,
  render: (args) => <CollapsibleExample {...args} />,
} satisfies Meta<typeof Collapsible.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: { defaultOpen: true },
};
