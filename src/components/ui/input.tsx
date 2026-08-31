import { Field } from "@ark-ui/react";
import type { ComponentProps } from "react";
import { styled } from "styled-system/jsx";
import { input } from "styled-system/recipes";

export type InputProps = ComponentProps<typeof Field.Input>;
export const Input = styled(Field.Input, input);
