import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";

import { DialogShell } from "@/components/domains/dialog-shell.tsx";
import {
  EMPTY_STEP_EDITOR_VALUES,
  StepEditorForm,
  toAnswerInput,
  type StepEditorDefaultValues,
  type StepEditorSubmit,
} from "@/components/domains/step-editor-form.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { getApiClient } from "@/lib/api-client";
import { styled } from "styled-system/jsx";

const LoadingBody = styled("div", {
  base: {
    display: "flex",
    justifyContent: "center",
    py: "12",
  },
});

function toRequestBody(payload: StepEditorSubmit) {
  return {
    name: payload.values.name,
    kind: "QR" as const,
    title: payload.values.title,
    body: payload.values.body,
    media: payload.media,
    reveal: {
      text: payload.values.revealText || undefined,
      media: payload.revealMedia,
    },
    question: payload.values.question || undefined,
    answerSpec: payload.answerSpec,
    placeholder: payload.values.placeholder || undefined,
    hint: payload.values.hint || undefined,
  };
}

export function CreateStepDialog({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <DialogShell
      title="단계 추가"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Plus /> 단계 추가
        </Button>
      }
    >
      <StepEditorForm
        submitLabel="단계 만들기"
        defaultValues={EMPTY_STEP_EDITOR_VALUES}
        onCancel={() => setOpen(false)}
        onSubmit={async (payload) => {
          const client = getApiClient();
          await client.cases({ id: caseId }).steps.post(toRequestBody(payload));
          setOpen(false);
          await router.invalidate();
        }}
      />
    </DialogShell>
  );
}

export function EditStepDialog({ stepId }: { stepId: string }) {
  const [open, setOpen] = useState(false);
  const [defaultValues, setDefaultValues] = useState<StepEditorDefaultValues | null>(null);
  const router = useRouter();

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !defaultValues) {
      const client = getApiClient();
      const { data: step } = await client.steps({ id: stepId }).edit.get();
      if (!step) return;
      setDefaultValues({
        name: step.name,
        title: step.title,
        body: step.body,
        media: { src: step.media?.src ?? "", alt: step.media?.alt ?? "" },
        question: step.question ?? "",
        answer: toAnswerInput(step.answerSpec),
        placeholder: step.placeholder ?? "",
        hint: step.hint ?? "",
        revealText: step.reveal.text ?? "",
        revealMedia: step.reveal.media,
      });
    }
  }

  return (
    <DialogShell
      title="단계 수정"
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        <Button variant="outline" size="sm">
          <Pencil /> 수정
        </Button>
      }
    >
      {defaultValues ? (
        <StepEditorForm
          submitLabel="저장"
          defaultValues={defaultValues}
          onCancel={() => setOpen(false)}
          onSubmit={async (payload) => {
            const client = getApiClient();
            await client.steps({ id: stepId }).patch(toRequestBody(payload));
            setOpen(false);
            await router.invalidate();
          }}
        />
      ) : (
        <LoadingBody>
          <Spinner size="lg" />
        </LoadingBody>
      )}
    </DialogShell>
  );
}
