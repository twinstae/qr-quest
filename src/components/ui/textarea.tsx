import { Field } from "@ark-ui/react";
import type { ComponentProps } from "react";
import { styled } from "styled-system/jsx";
import { textarea } from "styled-system/recipes";

export type TextareaProps = ComponentProps<typeof Field.Textarea>;
export const Textarea = styled(Field.Textarea, textarea);
