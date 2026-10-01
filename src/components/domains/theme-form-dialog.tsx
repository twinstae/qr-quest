import { useState, type ReactNode } from "react";

import { DialogShell } from "@/components/domains/dialog-shell.tsx";
import { Button } from "@/components/ui/button.tsx";

import { ThemeEditorForm, type ThemeEditorValues, type ThemeInput } from "./theme-editor-form.tsx";

/** 테마 추가와 수정이 같은 폼을 쓴다. 저장에 성공하면 닫힌다. */
export function ThemeFormDialog({
  title,
  trigger,
  defaultValues,
  submitLabel,
  onSave,
}: {
  title: string;
  trigger: ReactNode;
  defaultValues: ThemeEditorValues;
  submitLabel: string;
  onSave: (input: ThemeInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DialogShell title={title} size="wide" open={open} onOpenChange={setOpen} trigger={trigger}>
      <ThemeEditorForm
        defaultValues={defaultValues}
        submitLabel={submitLabel}
        onSubmit={async (input) => {
          await onSave(input);
          setOpen(false);
        }}
        footer={
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
        }
      />
    </DialogShell>
  );
}
