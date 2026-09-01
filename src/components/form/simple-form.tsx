import { useForm, FormProvider, type FieldValues } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { styled } from "styled-system/jsx";

const FormBase = styled("form", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
  },
});

interface SimpleFormProps<Input, Output> extends Omit<React.ComponentProps<"form">, "onSubmit"> {
  schema: StandardSchemaV1<Input, Output>;
  defaultValues: FieldValues;
  onSubmit: (values: Output) => Promise<void>;
  reValidateMode?: "onBlur" | "onSubmit";
}

export function SimpleForm<Output>({
  schema,
  onSubmit,
  defaultValues,
  reValidateMode,
  ...props
}: SimpleFormProps<FieldValues, Output>) {
  const methods = useForm({
    defaultValues,
    resolver: standardSchemaResolver(schema),
    reValidateMode: reValidateMode ?? "onSubmit",
  });

  return (
    <FormProvider {...methods}>
      <FormBase onSubmit={methods.handleSubmit(onSubmit)} {...props}>
        {props.children}
      </FormBase>
    </FormProvider>
  );
}
