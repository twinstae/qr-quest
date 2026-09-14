"use client";
import { ark } from "@ark-ui/react/factory";
import type { ComponentProps } from "react";
import { createStyleContext } from "styled-system/jsx";
import { card } from "styled-system/recipes";

const { withProvider, withContext } = createStyleContext(card);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(ark.div, "root");
export const Header = withContext(ark.div, "header");
export const Body = withContext(ark.div, "body");
// Footer는 버튼 같은 조작 요소를 담는다. h3로 두면 제목 목록을 훑는 사용자에게
// 조작 요소가 제목으로 읽히고, 버튼이 제목 안에 들어간다.
export const Footer = withContext(ark.div, "footer");
export const Title = withContext(ark.h3, "title");
export const Description = withContext(ark.div, "description");
