"use client";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react";
import type { ComponentProps } from "react";
import { createStyleContext } from "styled-system/jsx";
import { dialog } from "styled-system/recipes";

const { withProvider, withContext } = createStyleContext(dialog);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Dialog.Root, "root");
export const RootProvider = withProvider(Dialog.RootProvider, "root");
export const Trigger = withContext(Dialog.Trigger, "trigger");
export const Backdrop = withContext(Dialog.Backdrop, "backdrop");
export const Positioner = withContext(Dialog.Positioner, "positioner");
export const Content = withContext(Dialog.Content, "content");
export const Title = withContext(Dialog.Title, "title");
export const Description = withContext(Dialog.Description, "description");
export const CloseTrigger = withContext(Dialog.CloseTrigger, "closeTrigger");
export const Header = withContext("div", "header");
export const Body = withContext("div", "body");
export const Footer = withContext("div", "footer");

export { DialogContext as Context } from "@ark-ui/react/dialog";

export { Portal };
