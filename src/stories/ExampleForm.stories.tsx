import type { Meta, StoryObj } from "@storybook/react-vite";

import { ExapmleForm } from "./ExapmleForm";

const meta = {
  component: ExapmleForm,
} satisfies Meta<typeof ExapmleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    addData: async (result) => {
      console.log(result);
    },
    initData: {},
  },
};
