import { styled } from "styled-system/jsx";

const Wrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "3",
    borderRadius: "l3",
    borderWidth: "1px",
    borderStyle: "dashed",
    borderColor: "border",
    py: "16",
    px: "6",
    color: "fg.muted",
    _icon: {
      boxSize: "8",
      color: "fg.subtle",
    },
  },
});

const Title = styled("p", {
  base: {
    color: "fg.default",
    fontWeight: "semibold",
    textStyle: "md",
  },
});

const Description = styled("p", {
  base: {
    textStyle: "sm",
    maxWidth: "sm",
  },
});

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Wrapper>
      {icon}
      <Title>{title}</Title>
      <Description>{description}</Description>
      {action}
    </Wrapper>
  );
}
