import type { ComponentProps } from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button.tsx";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type" | "loading">;

/** SimpleForm 안에서 제출 중임을 formState.isSubmitting으로 자동 표시한다. */
export function SubmitButton({ children, ...props }: SubmitButtonProps) {
  const { formState } = useFormContext();
  return (
    <Button type="submit" loading={formState.isSubmitting} {...props}>
      {children}
    </Button>
  );
}
