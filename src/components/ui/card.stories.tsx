import type { Meta, StoryObj } from "@storybook/react-vite";
import { css } from "styled-system/css";

import * as Card from "./card.tsx";
import { Button } from "./button.tsx";

const meta = {
  title: "UI/Card",
  component: Card.Root,
} satisfies Meta<typeof Card.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

function CardExample(props: Card.RootProps) {
  return (
    <Card.Root {...props} className={css({ width: "360px" })}>
      <Card.Header>
        <Card.Title>카드 제목</Card.Title>
        <Card.Description>카드 설명입니다.</Card.Description>
      </Card.Header>
      <Card.Body>본문 내용이 여기에 들어갑니다.</Card.Body>
      <Card.Footer>
        <Button variant="outline" size="sm">
          취소
        </Button>
        <Button size="sm">확인</Button>
      </Card.Footer>
    </Card.Root>
  );
}

export const Outline: Story = {
  render: () => <CardExample variant="outline" />,
};

export const Elevated: Story = {
  render: () => <CardExample variant="elevated" />,
};

export const Subtle: Story = {
  render: () => <CardExample variant="subtle" />,
};
