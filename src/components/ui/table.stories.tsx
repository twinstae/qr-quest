import type { Meta, StoryObj } from "@storybook/react-vite";

import * as Table from "./table.tsx";

const rows = [
  { content: "카페 앞 QR을 찾아라", answer: "아메리카노", scans: 12 },
  { content: "도서관 3층 힌트", answer: "사서", scans: 5 },
  { content: "체육관 입구 QR", answer: "농구공", scans: 8 },
];

function TableExample(props: Table.RootProps) {
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.Header>문제</Table.Header>
          <Table.Header>정답</Table.Header>
          <Table.Header>스캔 수</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {rows.map((row) => (
          <Table.Row key={row.content}>
            <Table.Cell>{row.content}</Table.Cell>
            <Table.Cell>{row.answer}</Table.Cell>
            <Table.Cell>{row.scans}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

const meta = {
  title: "UI/Table",
  component: Table.Root,
  render: (args) => <TableExample {...args} />,
} satisfies Meta<typeof Table.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const Surface: Story = {
  args: { variant: "surface" },
};

export const Striped: Story = {
  args: { striped: true },
};

export const Interactive: Story = {
  args: { interactive: true },
};

export const ColumnBorder: Story = {
  args: { columnBorder: true },
};
