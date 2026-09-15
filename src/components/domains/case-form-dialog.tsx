import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as v from "valibot";

import { DialogShell } from "@/components/domains/dialog-shell.tsx";
import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button.tsx";
import { getApiClient } from "@/lib/api-client";
import { caseKeys, todayStatsKey } from "@/queries/cases.ts";
import { styled } from "styled-system/jsx";

const Footer = styled("div", {
  base: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "3",
    pt: "2",
  },
});

export function CreateCaseDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  return (
    <DialogShell
      title="CASE 추가"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Plus /> 새 CASE 만들기
        </Button>
      }
    >
      <SimpleForm
        schema={v.object({
          number: v.pipe(
            v.string(),
            v.transform((value) => Number(value)),
            v.number("CASE 번호는 숫자로 입력해주세요"),
          ),
          title: v.pipe(v.string(), v.minLength(1, "사건 제목을 입력해주세요")),
          teaser: v.string(),
          intro: v.string(),
        })}
        defaultValues={{ number: "1", title: "", teaser: "", intro: "" }}
        onSubmit={async ({ number, title, teaser, intro }) => {
          const client = getApiClient();
          await client.cases.post({
            number,
            title,
            teaser,
            intro,
            estimatedMinutes: 20,
          });
          setOpen(false);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: caseKeys.all }),
            queryClient.invalidateQueries({ queryKey: todayStatsKey }),
          ]);
        }}
      >
        <SimpleInput name="number" label="CASE 번호" placeholder="1" />
        <SimpleInput name="title" label="사건 제목" placeholder="사라진 책의 행방" />
        <SimpleInput
          name="teaser"
          label="한 줄 소개"
          placeholder="책방 안에 남겨진 단서를 찾아주세요."
        />
        <SimpleInput name="intro" label="사건 소개" placeholder="책방지기가 아침에..." />
        <Footer>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <SubmitButton>CASE 만들기</SubmitButton>
        </Footer>
      </SimpleForm>
    </DialogShell>
  );
}
