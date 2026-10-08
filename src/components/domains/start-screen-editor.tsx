import { useState } from "react";
import { useWatch } from "react-hook-form";
import { Pencil } from "lucide-react";
import * as v from "valibot";

import { DialogShell } from "@/components/domains/dialog-shell.tsx";
import { PhoneMockup } from "@/components/domains/phone-mockup.tsx";
import { StartScreenCard } from "@/components/domains/start-screen-card.tsx";
import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button.tsx";
import * as Fieldset from "@/components/ui/fieldset.tsx";
import { DEFAULT_START_BUTTON_LABEL } from "@/domain/case.ts";
import type { Media } from "@/domain/step.ts";
import { css } from "styled-system/css";

/** 시작 화면에서 관리자가 고칠 수 있는 문구. */
export type StartScreenFields = {
  title: string;
  teaser: string;
  estimatedMinutes: number;
  startNote: string;
  startButtonLabel: string;
};

const schema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "제목을 입력해주세요")),
  teaser: v.string(),
  estimatedMinutes: v.pipe(
    v.string(),
    v.transform((value) => Number(value.trim() || "0")),
    v.number("숫자로 입력해주세요"),
    v.integer("분 단위 정수로 입력해주세요"),
    v.minValue(0, "0분 이상으로 입력해주세요"),
  ),
  startNote: v.string(),
  startButtonLabel: v.string(),
});

// 폼과 미리보기를 나란히 둔다 — 단계 편집기(step-editor-form.tsx)와 같은 배치.
const layoutClass = css({
  display: "grid",
  alignItems: "start",
  gap: "6",
  gridTemplateColumns: { base: "1fr", lg: "minmax(0, 1fr) minmax(0, 22rem)" },
});

const previewClass = css({
  position: { base: "static", lg: "sticky" },
  top: "0",
});

function StartScreenPreview({ caseNumber, thumbnail }: { caseNumber: number; thumbnail?: Media }) {
  // 입력은 문자열이다 — 숫자가 아니면 미리보기에서는 시간 줄을 숨긴다.
  const values = useWatch() as Omit<StartScreenFields, "estimatedMinutes"> & {
    estimatedMinutes: string;
  };
  const minutes = Number(values.estimatedMinutes);

  return (
    <section role="region" aria-label="시작 화면 미리보기">
      <p className={css({ textStyle: "xs", fontWeight: "semibold", color: "fg.subtle", mb: "2" })}>
        참가자가 보는 화면
      </p>
      <PhoneMockup>
        <StartScreenCard
          caseInfo={{
            number: caseNumber,
            title: values.title || "제목 없음",
            teaser: values.teaser,
            thumbnail,
            estimatedMinutes: Number.isFinite(minutes) ? minutes : 0,
            startNote: values.startNote,
            startButtonLabel: values.startButtonLabel,
          }}
        />
      </PhoneMockup>
    </section>
  );
}

export function StartScreenEditorForm({
  caseNumber,
  thumbnail,
  defaultValues,
  onSubmit,
  onCancel,
}: {
  caseNumber: number;
  thumbnail?: Media;
  defaultValues: StartScreenFields;
  onSubmit: (values: StartScreenFields) => Promise<void>;
  onCancel?: () => void;
}) {
  return (
    <SimpleForm
      schema={schema}
      defaultValues={{ ...defaultValues, estimatedMinutes: String(defaultValues.estimatedMinutes) }}
      onSubmit={onSubmit}
    >
      <div className={layoutClass}>
        <Fieldset.Root>
          <Fieldset.Legend>시작 화면</Fieldset.Legend>
          <Fieldset.Content>
            <SimpleInput name="title" label="제목" />
            <SimpleInput name="teaser" label="한 줄 소개" />
            <SimpleInput
              name="estimatedMinutes"
              label="예상 소요 시간(분)"
              inputMode="numeric"
              hint="0으로 두면 예상 소요 시간을 보여주지 않아요."
            />
            <SimpleInput
              name="startNote"
              label="안내 문구 (선택)"
              placeholder="예: 2인 이상 추천, 휴대폰 소리를 켜주세요"
            />
            <SimpleInput
              name="startButtonLabel"
              label="시작 버튼 문구"
              placeholder={`비우면 "${DEFAULT_START_BUTTON_LABEL}"`}
            />
          </Fieldset.Content>
          <div className={css({ display: "flex", justifyContent: "flex-end", gap: "3", pt: "4" })}>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
            <SubmitButton>저장</SubmitButton>
          </div>
        </Fieldset.Root>

        <div className={previewClass}>
          <StartScreenPreview caseNumber={caseNumber} thumbnail={thumbnail} />
        </div>
      </div>
    </SimpleForm>
  );
}

/** CASE 상세 화면의 [시작 화면 편집] — 폼과 오른쪽 미리보기를 한 다이얼로그에 띄운다. */
export function EditStartScreenDialog({
  caseNumber,
  thumbnail,
  defaultValues,
  save,
}: {
  caseNumber: number;
  thumbnail?: Media;
  defaultValues: StartScreenFields;
  save: (values: StartScreenFields) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DialogShell
      title="시작 화면 편집"
      open={open}
      onOpenChange={setOpen}
      size="wide"
      trigger={
        <Button variant="outline" size="sm">
          <Pencil /> 시작 화면 편집
        </Button>
      }
    >
      <StartScreenEditorForm
        caseNumber={caseNumber}
        thumbnail={thumbnail}
        defaultValues={defaultValues}
        onCancel={() => setOpen(false)}
        onSubmit={async (values) => {
          await save(values);
          setOpen(false);
        }}
      />
    </DialogShell>
  );
}
