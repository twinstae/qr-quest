import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";

import { DialogShell } from "@/components/domains/dialog-shell.tsx";
import {
  EMPTY_STEP_EDITOR_VALUES,
  StepEditorForm,
  toAnswerFormValues,
  toStepRequestBody,
  type StepEditorDefaultValues,
} from "@/components/domains/step-editor-form.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import type { StepKind } from "@/domain/step.ts";
import { getApiClient } from "@/lib/api-client";
import { styled } from "styled-system/jsx";

const LoadingBody = styled("div", {
  base: {
    display: "flex",
    justifyContent: "center",
    py: "12",
  },
});

/** 새로 만드는 단계는 지금 항상 QR 단계다 — 종류 선택은 티켓 13에서 붙는다. */
const DEFAULT_STEP_KIND: StepKind = "QR";

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
        kind={DEFAULT_STEP_KIND}
        submitLabel="단계 만들기"
        defaultValues={EMPTY_STEP_EDITOR_VALUES}
        onCancel={() => setOpen(false)}
        onSubmit={async (payload) => {
          const client = getApiClient();
          await client.cases({ id: caseId }).steps.post(toStepRequestBody(payload));
          setOpen(false);
          await router.invalidate();
        }}
      />
    </DialogShell>
  );
}

type LoadedStep = { kind: StepKind; defaultValues: StepEditorDefaultValues };

export function EditStepDialog({ stepId }: { stepId: string }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<LoadedStep | null>(null);
  const router = useRouter();

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !loaded) {
      const client = getApiClient();
      const { data: step } = await client.steps({ id: stepId }).edit.get();
      if (!step) return;
      setLoaded({
        // 종류는 화면에 보여주지 않지만 그대로 되돌려 보낸다 — 소개 단계를
        // 열어 저장했다고 QR 단계로 바뀌면 안 된다.
        kind: step.kind,
        defaultValues: {
          name: step.name,
          title: step.title,
          body: step.body,
          media: { src: step.media?.src ?? "", alt: step.media?.alt ?? "" },
          question: step.question ?? "",
          ...toAnswerFormValues(step.answerSpec),
          placeholder: step.placeholder ?? "",
          hint: step.hint ?? "",
          revealText: step.reveal.text ?? "",
          revealMedia: step.reveal.media,
          revealPreset: step.reveal.preset ?? "FADE_UP",
          revealSound: step.reveal.sound ?? "NONE",
        },
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
      {loaded ? (
        <StepEditorForm
          kind={loaded.kind}
          submitLabel="저장"
          defaultValues={loaded.defaultValues}
          onCancel={() => setOpen(false)}
          onSubmit={async (payload) => {
            const client = getApiClient();
            await client.steps({ id: stepId }).patch(toStepRequestBody(payload));
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
