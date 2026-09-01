import { useEffect, type ReactNode } from "react";
import { useForm, FormProvider, type FieldValues } from "react-hook-form";
import { css } from "styled-system/css";

export function FormFieldStory({
  children,
  defaultValues,
  errors,
}: {
  children: ReactNode;
  defaultValues?: FieldValues;
  errors?: Record<string, string>;
}) {
  const methods = useForm({ defaultValues });

  useEffect(() => {
    if (!errors) return;
    for (const [name, message] of Object.entries(errors)) {
      methods.setError(name, { type: "manual", message });
    }
  }, []);

  return (
    <FormProvider {...methods}>
      <div className={css({ width: "320px" })}>{children}</div>
    </FormProvider>
  );
}
